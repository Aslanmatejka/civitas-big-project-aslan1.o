// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title AirdropDistributor
 * @notice Merkle-proof based CIV token airdrop with optional vesting.
 *
 * Two airdrop modes:
 *   1. INSTANT  — full amount claimable immediately.
 *   2. VESTED   — amount vests linearly over VESTING_DURATION from claim date.
 *
 * Anti-gaming:
 *   - Merkle root set by admin; users prove inclusion with their address + amount.
 *   - Each address can only claim once per round.
 *   - Claim window: CLAIM_WINDOW (180 days) after round opens; unclaimed tokens
 *     can be swept back to treasury by admin after deadline.
 *   - Regional bonus: addresses in the "developing region" Merkle root receive
 *     REGIONAL_BONUS_BPS extra tokens (subsidized fees).
 *
 * Inclusivity:
 *   - A separate "developing regions" round can be created with a higher bonus.
 *   - Minimum viable identity verification: user must have a registered DID on-chain
 *     (checked via DIDRegistry interface) to claim from identity-gated rounds.
 */
contract AirdropDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE      = keccak256("ADMIN_ROLE");
    bytes32 public constant SWEEPER_ROLE    = keccak256("SWEEPER_ROLE");

    uint256 public constant VESTING_DURATION   = 180 days;
    uint256 public constant CLAIM_WINDOW       = 180 days;
    uint256 public constant REGIONAL_BONUS_BPS = 500; // 5% extra for developing regions

    IERC20  public immutable civToken;
    address public immutable treasury;

    // ── Airdrop Rounds ────────────────────────────────────────────────────────

    enum RoundMode { INSTANT, VESTED }

    struct Round {
        bytes32 merkleRoot;          // standard recipients
        bytes32 regionalMerkleRoot;  // developing-region recipients (may equal merkleRoot)
        uint256 totalAmount;         // total CIV allocated to this round
        uint256 claimedAmount;
        uint256 openedAt;
        RoundMode mode;
        bool requiresDID;            // if true, user must have DID registered
        bool active;
    }

    struct VestingPosition {
        uint256 totalGranted;
        uint256 claimed;
        uint256 startTime;
    }

    Round[]   public rounds;

    // roundId → address → claimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // address → vesting position (across all vested rounds)
    mapping(address => VestingPosition) public vestingPositions;

    // ── DIDRegistry interface ─────────────────────────────────────────────────
    interface IDIDRegistry {
        function hasDID(address account) external view returns (bool);
    }
    IDIDRegistry public didRegistry;

    // ── Events ────────────────────────────────────────────────────────────────

    event RoundCreated(uint256 indexed roundId, bytes32 merkleRoot, uint256 totalAmount, RoundMode mode);
    event Claimed(uint256 indexed roundId, address indexed claimant, uint256 amount, bool regional);
    event VestingClaimed(address indexed claimant, uint256 amount, uint256 remaining);
    event UnclamedSwept(uint256 indexed roundId, uint256 amount);
    event DIDRegistryUpdated(address indexed newRegistry);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _civToken, address _treasury, address _didRegistry) {
        require(_civToken   != address(0), "AirdropDistributor: zero token");
        require(_treasury   != address(0), "AirdropDistributor: zero treasury");
        civToken    = IERC20(_civToken);
        treasury    = _treasury;
        didRegistry = IDIDRegistry(_didRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SWEEPER_ROLE, msg.sender);
    }

    // ── Admin: Round Management ───────────────────────────────────────────────

    /**
     * @notice Create a new airdrop round. Admin must pre-fund the contract with
     *         `totalAmount` CIV before or after creating the round.
     * @param merkleRoot         Merkle root of (address, amount) pairs.
     * @param regionalMerkleRoot Separate root for developing-region recipients (5% bonus).
     *                           Pass bytes32(0) to disable regional bonus.
     * @param totalAmount        Total CIV tokens set aside for this round (wei units).
     * @param mode               INSTANT or VESTED.
     * @param requiresDID        If true, claimant must have a DID registered.
     */
    function createRound(
        bytes32 merkleRoot,
        bytes32 regionalMerkleRoot,
        uint256 totalAmount,
        RoundMode mode,
        bool requiresDID
    ) external onlyRole(ADMIN_ROLE) {
        require(merkleRoot != bytes32(0), "AirdropDistributor: empty merkle root");
        require(totalAmount > 0, "AirdropDistributor: zero amount");

        uint256 roundId = rounds.length;
        rounds.push(Round({
            merkleRoot:         merkleRoot,
            regionalMerkleRoot: regionalMerkleRoot,
            totalAmount:        totalAmount,
            claimedAmount:      0,
            openedAt:           block.timestamp,
            mode:               mode,
            requiresDID:        requiresDID,
            active:             true
        }));

        emit RoundCreated(roundId, merkleRoot, totalAmount, mode);
    }

    /**
     * @notice Close a round (stops new claims; does not affect existing vesting).
     */
    function closeRound(uint256 roundId) external onlyRole(ADMIN_ROLE) {
        require(roundId < rounds.length, "AirdropDistributor: round not found");
        rounds[roundId].active = false;
    }

    /**
     * @notice Update the DID registry address.
     */
    function setDIDRegistry(address registry) external onlyRole(ADMIN_ROLE) {
        didRegistry = IDIDRegistry(registry);
        emit DIDRegistryUpdated(registry);
    }

    // ── Claim: Standard ───────────────────────────────────────────────────────

    /**
     * @notice Claim tokens from a standard (non-regional) round.
     * @param roundId   The airdrop round ID.
     * @param amount    The amount you're entitled to (from the Merkle leaf).
     * @param proof     Merkle proof of (address, amount) inclusion.
     */
    function claim(uint256 roundId, uint256 amount, bytes32[] calldata proof)
        external
        nonReentrant
    {
        _claim(roundId, amount, proof, false);
    }

    /**
     * @notice Claim tokens with the developing-region bonus (+5%).
     * @param roundId   The airdrop round ID.
     * @param amount    The base amount from the Merkle leaf.
     * @param proof     Merkle proof against the regionalMerkleRoot.
     */
    function claimRegional(uint256 roundId, uint256 amount, bytes32[] calldata proof)
        external
        nonReentrant
    {
        _claim(roundId, amount, proof, true);
    }

    function _claim(uint256 roundId, uint256 amount, bytes32[] calldata proof, bool regional) internal {
        require(roundId < rounds.length, "AirdropDistributor: round not found");
        Round storage round = rounds[roundId];

        require(round.active, "AirdropDistributor: round not active");
        require(block.timestamp <= round.openedAt + CLAIM_WINDOW, "AirdropDistributor: claim window closed");
        require(!hasClaimed[roundId][msg.sender], "AirdropDistributor: already claimed");

        if (round.requiresDID) {
            require(didRegistry.hasDID(msg.sender), "AirdropDistributor: DID required");
        }

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        bytes32 root = regional ? round.regionalMerkleRoot : round.merkleRoot;
        require(root != bytes32(0), "AirdropDistributor: regional not enabled");
        require(MerkleProof.verify(proof, root, leaf), "AirdropDistributor: invalid proof");

        // Apply regional bonus
        uint256 finalAmount = regional
            ? amount + (amount * REGIONAL_BONUS_BPS / 10000)
            : amount;

        require(round.claimedAmount + finalAmount <= round.totalAmount, "AirdropDistributor: round exhausted");

        hasClaimed[roundId][msg.sender] = true;
        round.claimedAmount += finalAmount;

        if (round.mode == RoundMode.INSTANT) {
            civToken.safeTransfer(msg.sender, finalAmount);
        } else {
            // Accumulate into vesting position
            VestingPosition storage pos = vestingPositions[msg.sender];
            pos.totalGranted += finalAmount;
            if (pos.startTime == 0) {
                pos.startTime = block.timestamp;
            }
        }

        emit Claimed(roundId, msg.sender, finalAmount, regional);
    }

    // ── Vesting Claim ─────────────────────────────────────────────────────────

    /**
     * @notice Claim linearly vested tokens. Can be called at any time.
     */
    function claimVested() external nonReentrant {
        VestingPosition storage pos = vestingPositions[msg.sender];
        require(pos.totalGranted > 0, "AirdropDistributor: no vesting position");

        uint256 vested = _vestedAmount(pos);
        uint256 claimable = vested - pos.claimed;
        require(claimable > 0, "AirdropDistributor: nothing to claim yet");

        pos.claimed += claimable;
        civToken.safeTransfer(msg.sender, claimable);

        emit VestingClaimed(msg.sender, claimable, pos.totalGranted - pos.claimed);
    }

    // ── Sweep ─────────────────────────────────────────────────────────────────

    /**
     * @notice Sweep unclaimed tokens of a closed/expired round back to treasury.
     */
    function sweepUnclaimed(uint256 roundId) external onlyRole(SWEEPER_ROLE) nonReentrant {
        require(roundId < rounds.length, "AirdropDistributor: round not found");
        Round storage round = rounds[roundId];
        require(
            !round.active || block.timestamp > round.openedAt + CLAIM_WINDOW,
            "AirdropDistributor: round still active"
        );

        uint256 unclaimed = round.totalAmount - round.claimedAmount;
        require(unclaimed > 0, "AirdropDistributor: nothing to sweep");

        round.claimedAmount = round.totalAmount; // prevent double sweep
        civToken.safeTransfer(treasury, unclaimed);

        emit UnclamedSwept(roundId, unclaimed);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the claimable vested amount for an address right now.
     */
    function claimableVested(address user) external view returns (uint256) {
        VestingPosition storage pos = vestingPositions[user];
        if (pos.totalGranted == 0) return 0;
        return _vestedAmount(pos) - pos.claimed;
    }

    /**
     * @notice Returns the number of airdrop rounds.
     */
    function roundCount() external view returns (uint256) {
        return rounds.length;
    }

    function _vestedAmount(VestingPosition storage pos) internal view returns (uint256) {
        if (block.timestamp >= pos.startTime + VESTING_DURATION) {
            return pos.totalGranted;
        }
        uint256 elapsed = block.timestamp - pos.startTime;
        return pos.totalGranted * elapsed / VESTING_DURATION;
    }
}
