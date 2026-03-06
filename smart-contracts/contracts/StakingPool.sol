// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title StakingPool
 * @dev CIVITAS anti-Sybil staking and reputation boost pool.
 *
 * Architecture Layer 2 — Identity and Privacy (anti-Sybil mechanism)
 * Architecture Layer 3 — Financial (reward distribution)
 *
 * Features:
 * - Users stake CIV to gain voting power and reputation boosts in DIDRegistry
 * - Anti-whale cap: max 1% of total supply per staker
 * - 7-day unstake cooldown (prevents flash-loan abuse)
 * - Slash mechanism (callable by governance or SLASHER_ROLE)
 * - Staking rewards distributed from treasury at configurable APR
 * - Reputation multiplier: sqrt(stake / MIN_STAKE) capped at 3× (quadratic)
 * - Node operators get additional boost when combined with NodeRegistry stake
 */
contract StakingPool is AccessControl, ReentrancyGuard {

    bytes32 public constant SLASHER_ROLE    = keccak256("SLASHER_ROLE");
    bytes32 public constant REWARDS_ROLE    = keccak256("REWARDS_ROLE");

    IERC20 public civToken;

    uint256 public constant TOTAL_SUPPLY       = 1_000_000_000 * 10**18;
    uint256 public constant MAX_STAKE_BPS      = 100;            // 1% of total supply
    uint256 public constant MIN_STAKE          = 100  * 10**18;  // 100 CIV
    uint256 public constant UNSTAKE_COOLDOWN   = 7 days;
    uint256 public constant PRECISION          = 1e18;
    uint256 public constant ANNUAL_REWARD_BPS  = 800;            // 8% APR

    struct StakerInfo {
        uint256 staked;
        uint256 pendingRewards;
        uint256 rewardDebt;           // for reward-per-token accounting
        uint256 stakedAt;
        uint256 unstakeInitiatedAt;
        uint256 unstakePendingAmount;
    }

    mapping(address => StakerInfo) public stakers;

    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public rewardRate;                // tokens per second from treasury

    address public treasury;

    event Staked(address indexed user, uint256 amount);
    event UnstakeInitiated(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount, string reason);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _civToken, address _treasury) {
        civToken = IERC20(_civToken);
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SLASHER_ROLE, msg.sender);
        _grantRole(REWARDS_ROLE, msg.sender);
        lastUpdateTime = block.timestamp;
        // Set initial reward rate: ANNUAL_REWARD_BPS of MIN_STAKE distributed per year
        rewardRate = (TOTAL_SUPPLY * ANNUAL_REWARD_BPS) / (10000 * 365 days);
    }

    // ── Reward Accounting ─────────────────────────────────────────────────────

    modifier updateReward(address user) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (user != address(0)) {
            stakers[user].pendingRewards = earned(user);
            stakers[user].rewardDebt = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored +
            ((block.timestamp - lastUpdateTime) * rewardRate * PRECISION) / totalStaked;
    }

    function earned(address user) public view returns (uint256) {
        StakerInfo storage s = stakers[user];
        return s.pendingRewards +
            (s.staked * (rewardPerToken() - s.rewardDebt)) / PRECISION;
    }

    // ── Staking ───────────────────────────────────────────────────────────────

    /**
     * @dev Stake CIV. Anti-whale cap: max 1% of total supply at once.
     */
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount >= MIN_STAKE, "Below minimum stake");

        // Anti-whale cap
        uint256 maxAllowed = (TOTAL_SUPPLY * MAX_STAKE_BPS) / 10000;
        require(stakers[msg.sender].staked + amount <= maxAllowed, "Exceeds whale cap");

        civToken.transferFrom(msg.sender, address(this), amount);

        stakers[msg.sender].staked += amount;
        stakers[msg.sender].stakedAt = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Initiate unstake. Begins 7-day cooldown.
     */
    function initiateUnstake(uint256 amount) external updateReward(msg.sender) {
        StakerInfo storage s = stakers[msg.sender];
        require(amount > 0 && amount <= s.staked, "Invalid amount");
        require(s.unstakeInitiatedAt == 0, "Unstake already pending");

        s.staked -= amount;
        s.unstakePendingAmount = amount;
        s.unstakeInitiatedAt = block.timestamp;
        totalStaked -= amount;

        emit UnstakeInitiated(msg.sender, amount);
    }

    /**
     * @dev Complete unstake after 7-day cooldown.
     */
    function completeUnstake() external nonReentrant updateReward(msg.sender) {
        StakerInfo storage s = stakers[msg.sender];
        require(s.unstakeInitiatedAt > 0, "No unstake pending");
        require(block.timestamp >= s.unstakeInitiatedAt + UNSTAKE_COOLDOWN, "Cooldown not over");

        uint256 amount = s.unstakePendingAmount;
        s.unstakePendingAmount = 0;
        s.unstakeInitiatedAt = 0;

        civToken.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim accumulated staking rewards.
     */
    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = stakers[msg.sender].pendingRewards;
        require(reward > 0, "No rewards");

        stakers[msg.sender].pendingRewards = 0;
        // Treasury funds the rewards
        civToken.transferFrom(treasury, msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    // ── Slashing ──────────────────────────────────────────────────────────────

    /**
     * @dev Slash a staker's stake for malicious behavior.
     *      Callable by governance (SLASHER_ROLE).
     *      Slashed tokens go to treasury.
     */
    function slash(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyRole(SLASHER_ROLE) updateReward(user) nonReentrant {
        StakerInfo storage s = stakers[user];
        require(amount > 0, "Zero amount");

        uint256 slashFromStaked  = amount <= s.staked ? amount : s.staked;
        uint256 slashFromPending = amount > slashFromStaked ? amount - slashFromStaked : 0;

        s.staked -= slashFromStaked;
        totalStaked -= slashFromStaked;

        if (slashFromPending > 0 && slashFromPending <= s.unstakePendingAmount) {
            s.unstakePendingAmount -= slashFromPending;
        }

        uint256 actualSlash = slashFromStaked + slashFromPending;
        civToken.transfer(treasury, actualSlash);

        emit Slashed(user, actualSlash, reason);
    }

    // ── Reputation Interface ──────────────────────────────────────────────────

    /**
     * @dev Returns reputation multiplier for DIDRegistry integration.
     *      Uses quadratic formula: sqrt(stake / MIN_STAKE), capped at 3.
     *      Returns value * 100 for precision (200 = 2.00×)
     */
    function getReputationMultiplier(address user) external view returns (uint256) {
        uint256 staked = stakers[user].staked;
        if (staked < MIN_STAKE) return 100; // 1.00× (no boost)

        uint256 ratio = staked / MIN_STAKE;
        uint256 sqrtRatio = _sqrt(ratio);
        // Cap at 3×
        if (sqrtRatio > 3) sqrtRatio = 3;
        return sqrtRatio * 100;
    }

    /**
     * @dev Returns whether user has staked (Sybil resistance check).
     *      True if staked ≥ MIN_STAKE (can be used by DIDRegistry as anti-Sybil).
     */
    function isAntiSybilVerified(address user) external view returns (bool) {
        return stakers[user].staked >= MIN_STAKE;
    }

    function getStakerInfo(address user) external view returns (
        uint256 staked,
        uint256 pendingRewards,
        uint256 stakedAt,
        uint256 unstakeInitiatedAt,
        uint256 unstakePendingAmount,
        uint256 reputationMultiplier
    ) {
        StakerInfo storage s = stakers[user];
        return (
            s.staked,
            earned(user),
            s.stakedAt,
            s.unstakeInitiatedAt,
            s.unstakePendingAmount,
            this.getReputationMultiplier(user)
        );
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setRewardRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) updateReward(address(0)) {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = _treasury;
    }

    // ── Math ──────────────────────────────────────────────────────────────────

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) { z = x; x = (y / x + x) / 2; }
        } else if (y != 0) {
            z = 1;
        }
    }
}
