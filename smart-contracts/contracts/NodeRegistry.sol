// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title NodeRegistry
 * @dev CIVITAS distributed node operator registry.
 *
 * Architecture Layer 4 — Storage and Compute
 *
 * Features:
 * - Node operators stake CIV to register and join the network
 * - Tracks storage capacity, peer ID, region, and endpoint
 * - Uptime oracle updates uptime scores on-chain
 * - Rewards proportional to (uptime × storage) accrued each epoch
 * - Slash mechanism for malicious/offline nodes (via governance or oracle)
 * - Cooldown period on withdrawals (unstake delay = 7 days)
 * - Integrates with StakingPool for reputation boost
 */
contract NodeRegistry is AccessControl, ReentrancyGuard {

    bytes32 public constant ORACLE_ROLE     = keccak256("ORACLE_ROLE");
    bytes32 public constant SLASHER_ROLE    = keccak256("SLASHER_ROLE");

    IERC20 public civToken;
    address public treasury;

    uint256 public constant MIN_NODE_STAKE       = 5_000  * 10**18;  // 5,000 CIV
    uint256 public constant UNSTAKE_COOLDOWN     = 7 days;
    uint256 public constant SLASH_FRACTION_BPS   = 1000;             // 10%
    uint256 public constant EPOCH_DURATION       = 1 days;
    uint256 public constant REWARD_RATE_PER_EPOCH = 100 * 10**18;    // 100 CIV / epoch to pool

    enum NodeState { Pending, Active, Suspended, Slashed, Exited }
    enum NodeTier   { Bronze, Silver, Gold, Platinum }

    struct Node {
        uint256   id;
        address   operator;
        string    peerId;             // libp2p peer ID
        string    endpoint;           // gRPC/REST endpoint
        string    region;             // geographic region (e.g. "us-east-1")
        uint256   storageCapacityGB;  // declared storage capacity
        uint256   stake;              // CIV staked
        NodeState state;
        NodeTier  tier;
        uint256   uptimeScore;        // 0-10000 (100.00%)
        uint256   totalRewardsClaimed;
        uint256   pendingRewards;
        uint256   registeredAt;
        uint256   lastUptimeUpdate;
        uint256   unstakeInitiatedAt; // for cooldown tracking
        string    ipfsProfileCID;     // off-chain node metadata
    }

    mapping(uint256 => Node)      public nodes;
    mapping(address => uint256)   public operatorNodeId;  // operator → node id (1-indexed)
    mapping(uint256 => uint256)   public epochRewardPool; // epoch → total rewards

    uint256 public nodeCount;
    uint256 public activeNodeCount;
    uint256 public currentEpoch;
    uint256 public epochStartTime;

    // Reward accounting per epoch
    mapping(uint256 => mapping(uint256 => bool)) public epochRewardClaimed; // epoch → nodeId → claimed

    event NodeRegistered(uint256 indexed id, address indexed operator, string peerId, uint256 stake);
    event NodeActivated(uint256 indexed id);
    event NodeSuspended(uint256 indexed id, string reason);
    event NodeSlashed(uint256 indexed id, uint256 amount, string reason);
    event NodeExited(uint256 indexed id);
    event UptimeReported(uint256 indexed id, uint256 uptimeScore, uint256 epoch);
    event RewardsClaimed(uint256 indexed id, address indexed operator, uint256 amount);
    event EpochAdvanced(uint256 epoch, uint256 rewardPool);
    event TierUpgraded(uint256 indexed id, NodeTier tier);

    constructor(address _civToken, address _treasury) {
        civToken = IERC20(_civToken);
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(SLASHER_ROLE, msg.sender);
        currentEpoch = 1;
        epochStartTime = block.timestamp;
    }

    // ── Node Registration ─────────────────────────────────────────────────────

    /**
     * @dev Register a new node by staking CIV.
     *      One node per operator address.
     */
    function registerNode(
        string calldata peerId,
        string calldata endpoint,
        string calldata region,
        uint256 storageCapacityGB,
        uint256 stakeAmount,
        string calldata ipfsProfileCID
    ) external nonReentrant returns (uint256 id) {
        require(operatorNodeId[msg.sender] == 0, "Already registered");
        require(stakeAmount >= MIN_NODE_STAKE, "Insufficient stake");
        require(bytes(peerId).length > 0, "Empty peer ID");
        require(storageCapacityGB > 0, "No storage declared");

        civToken.transferFrom(msg.sender, address(this), stakeAmount);

        id = ++nodeCount;
        activeNodeCount++;

        nodes[id] = Node({
            id: id,
            operator: msg.sender,
            peerId: peerId,
            endpoint: endpoint,
            region: region,
            storageCapacityGB: storageCapacityGB,
            stake: stakeAmount,
            state: NodeState.Active,
            tier: _computeTier(stakeAmount),
            uptimeScore: 10000,        // start perfect
            totalRewardsClaimed: 0,
            pendingRewards: 0,
            registeredAt: block.timestamp,
            lastUptimeUpdate: block.timestamp,
            unstakeInitiatedAt: 0,
            ipfsProfileCID: ipfsProfileCID
        });

        operatorNodeId[msg.sender] = id;

        emit NodeRegistered(id, msg.sender, peerId, stakeAmount);
        emit NodeActivated(id);
        emit TierUpgraded(id, nodes[id].tier);
    }

    // ── Uptime Oracle ─────────────────────────────────────────────────────────

    /**
     * @dev Oracle reports uptime score for a node each epoch.
     *      uptimeScore: 0-10000 (basis points, so 9950 = 99.50%)
     *      Also accrues pending rewards based on contribution.
     */
    function reportUptime(
        uint256 nodeId,
        uint256 uptimeScore,
        uint256 storageUsedGB,
        bytes32 proofHash         // Merkle proof root of uptime measurements
    ) external onlyRole(ORACLE_ROLE) {
        require(nodeId > 0 && nodeId <= nodeCount, "Invalid node");
        Node storage n = nodes[nodeId];
        require(n.state == NodeState.Active, "Node not active");
        require(uptimeScore <= 10000, "Invalid uptime score");

        n.uptimeScore = uptimeScore;
        n.lastUptimeUpdate = block.timestamp;

        // Accrue rewards: weight by uptime × min(declared, used) storage
        uint256 effectiveStorage = storageUsedGB < n.storageCapacityGB
            ? storageUsedGB
            : n.storageCapacityGB;
        uint256 reward = _calculateEpochReward(uptimeScore, effectiveStorage, n.stake);
        n.pendingRewards += reward;

        emit UptimeReported(nodeId, uptimeScore, currentEpoch);
    }

    function _calculateEpochReward(
        uint256 uptimeScore,
        uint256 storageGB,
        uint256 stake
    ) internal pure returns (uint256) {
        // Reward = base * (uptime/10000) * log2(storage+1) * tieFactor(stake)
        // Simplified linear version for deployment:
        // reward = REWARD_RATE_PER_EPOCH * uptime/10000 * storageGB/1000 * stake/MIN_STAKE / 1e18
        if (storageGB == 0 || uptimeScore == 0) return 0;
        uint256 base = REWARD_RATE_PER_EPOCH;
        uint256 uptimeFactor = uptimeScore;                  // /10000
        uint256 storageFactor = storageGB > 1000 ? 1000 : storageGB; // cap at 1000 GB
        uint256 stakeFactor   = stake / MIN_NODE_STAKE;      // multiplier
        if (stakeFactor == 0) stakeFactor = 1;
        return (base * uptimeFactor * storageFactor * stakeFactor) / (10000 * 1000 * 10);
    }

    // ── Reward Claiming ───────────────────────────────────────────────────────

    /**
     * @dev Node operator claims accumulated pending rewards.
     */
    function claimRewards(uint256 nodeId) external nonReentrant {
        Node storage n = nodes[nodeId];
        require(msg.sender == n.operator, "Not operator");
        require(n.state == NodeState.Active || n.state == NodeState.Suspended, "Cannot claim");
        require(n.pendingRewards > 0, "No rewards");

        uint256 amount = n.pendingRewards;
        n.pendingRewards = 0;
        n.totalRewardsClaimed += amount;

        // Mint or transfer from treasury — here we transfer from contract balance
        // (treasury must pre-fund the contract)
        civToken.transfer(n.operator, amount);

        emit RewardsClaimed(nodeId, n.operator, amount);
    }

    // ── Slashing ──────────────────────────────────────────────────────────────

    /**
     * @dev Slash a node for malicious behavior.
     *      SLASH_FRACTION of stake goes to treasury, rest locked.
     */
    function slashNode(uint256 nodeId, string calldata reason) external onlyRole(SLASHER_ROLE) {
        Node storage n = nodes[nodeId];
        require(n.state == NodeState.Active || n.state == NodeState.Suspended, "Cannot slash");

        uint256 slashAmount = (n.stake * SLASH_FRACTION_BPS) / 10000;
        n.stake -= slashAmount;
        n.state = NodeState.Slashed;
        activeNodeCount--;

        civToken.transfer(treasury, slashAmount);

        emit NodeSlashed(nodeId, slashAmount, reason);
    }

    function suspendNode(uint256 nodeId, string calldata reason) external onlyRole(SLASHER_ROLE) {
        Node storage n = nodes[nodeId];
        require(n.state == NodeState.Active, "Not active");
        n.state = NodeState.Suspended;
        emit NodeSuspended(nodeId, reason);
    }

    function reinstateNode(uint256 nodeId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Node storage n = nodes[nodeId];
        require(n.state == NodeState.Suspended, "Not suspended");
        n.state = NodeState.Active;
        emit NodeActivated(nodeId);
    }

    // ── Exit / Unstake ────────────────────────────────────────────────────────

    /**
     * @dev Initiate unstake. Starts cooldown period.
     */
    function initiateUnstake(uint256 nodeId) external {
        Node storage n = nodes[nodeId];
        require(msg.sender == n.operator, "Not operator");
        require(n.state == NodeState.Active, "Not active");
        n.state = NodeState.Suspended;
        n.unstakeInitiatedAt = block.timestamp;
        activeNodeCount--;
        emit NodeSuspended(nodeId, "Unstake initiated");
    }

    /**
     * @dev Complete unstake after cooldown and receive stake back.
     */
    function completeUnstake(uint256 nodeId) external nonReentrant {
        Node storage n = nodes[nodeId];
        require(msg.sender == n.operator, "Not operator");
        require(n.state == NodeState.Suspended, "Not in unstake");
        require(n.unstakeInitiatedAt > 0, "Unstake not initiated");
        require(block.timestamp >= n.unstakeInitiatedAt + UNSTAKE_COOLDOWN, "Cooldown not over");

        uint256 stake = n.stake;
        n.stake = 0;
        n.state = NodeState.Exited;
        operatorNodeId[msg.sender] = 0;

        civToken.transfer(msg.sender, stake);
        emit NodeExited(nodeId);
    }

    // ── Epoch Management ──────────────────────────────────────────────────────

    function advanceEpoch() external {
        require(block.timestamp >= epochStartTime + EPOCH_DURATION, "Epoch not over");
        currentEpoch++;
        epochStartTime = block.timestamp;
        emit EpochAdvanced(currentEpoch, REWARD_RATE_PER_EPOCH);
    }

    // ── Tier ─────────────────────────────────────────────────────────────────

    function _computeTier(uint256 stake) internal pure returns (NodeTier) {
        if (stake >= 500_000 * 10**18) return NodeTier.Platinum;
        if (stake >= 50_000  * 10**18) return NodeTier.Gold;
        if (stake >= 10_000  * 10**18) return NodeTier.Silver;
        return NodeTier.Bronze;
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getNode(uint256 nodeId) external view returns (Node memory) {
        return nodes[nodeId];
    }

    function getNodeByOperator(address operator) external view returns (Node memory) {
        uint256 id = operatorNodeId[operator];
        require(id > 0, "No node for operator");
        return nodes[id];
    }

    function isActiveNode(address operator) external view returns (bool) {
        uint256 id = operatorNodeId[operator];
        if (id == 0) return false;
        return nodes[id].state == NodeState.Active;
    }
}
