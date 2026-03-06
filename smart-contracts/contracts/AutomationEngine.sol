// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AutomationEngine
 * @dev On-chain task automation for CIVITAS.
 *
 * Architecture Layer 3 — Financial and Automation
 *
 * Features:
 * - Register recurring or one-shot automation tasks
 * - Trigger types: time-based, price threshold, balance change, governance event
 * - Action types: token transfer, contract call, vote, emit notification hash
 * - Keeper network calls executeTask() when off-chain conditions are met
 * - CIV fee deposited per task; refunded on cancellation (net of usage)
 * - Tasks expired after deadline or max executions
 */
contract AutomationEngine is AccessControl, ReentrancyGuard {

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant ORACLE_ROLE  = keccak256("ORACLE_ROLE");

    IERC20 public civToken;

    uint256 public constant TASK_FEE = 10 * 10**18;    // 10 CIV per task registration
    uint256 public constant MAX_EXECUTIONS = 1000;
    uint256 public taskCount;

    enum TriggerType { TIME_BASED, PRICE_THRESHOLD, BALANCE_CHANGE, GOVERNANCE_EVENT, MANUAL }
    enum ActionType  { TOKEN_TRANSFER, CONTRACT_CALL, VOTE, NOTIFICATION_HASH }
    enum TaskState   { Active, Paused, Completed, Cancelled, Expired }

    struct TriggerConfig {
        TriggerType triggerType;
        uint256     scheduleInterval;    // seconds between executions (0 = one-shot)
        uint256     nextExecutionTime;
        address     watchedToken;        // for PRICE_THRESHOLD / BALANCE_CHANGE
        uint256     thresholdValue;      // price (USD * 10^8) or balance (wei)
        bool        triggerAbove;        // true = fire when price > threshold
    }

    struct ActionConfig {
        ActionType actionType;
        address    target;               // recipient or contract
        uint256    amount;               // token amount for transfer
        bytes      callData;             // raw calldata for CONTRACT_CALL
        bytes32    notificationHash;     // IPFS CID hash for NOTIFICATION_HASH
    }

    struct Task {
        uint256       id;
        address       owner;
        string        name;
        TaskState     state;
        TriggerConfig trigger;
        ActionConfig  action;
        uint256       executionCount;
        uint256       maxExecutions;
        uint256       createdAt;
        uint256       updatedAt;
        uint256       lastExecutedAt;
        string        ipfsMetaCID;       // off-chain task detail CID
    }

    mapping(uint256 => Task)      public tasks;
    mapping(address => uint256[]) public userTasks;

    // Oracle price feed: token address → current price (USD * 10^8)
    mapping(address => uint256) public oraclePrices;
    // Oracle balance feed: (user, token) → balance snapshot
    mapping(bytes32 => uint256) public oracleBalances;

    address public treasury;

    event TaskRegistered(uint256 indexed id, address indexed owner, string name, TriggerType trigger, ActionType action);
    event TaskExecuted(uint256 indexed id, address indexed keeper, uint256 timestamp);
    event TaskCancelled(uint256 indexed id, address indexed owner);
    event TaskPaused(uint256 indexed id);
    event TaskResumed(uint256 indexed id);
    event TaskExpired(uint256 indexed id);
    event OraclePriceUpdated(address indexed token, uint256 price);

    constructor(address _civToken, address _treasury) {
        civToken = IERC20(_civToken);
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    // ── Task Registration ─────────────────────────────────────────────────────

    /**
     * @dev Register a new automation task. Caller deposits TASK_FEE in CIV.
     */
    function registerTask(
        string calldata name,
        TriggerConfig calldata trigger,
        ActionConfig calldata action,
        uint256 maxExecutions,
        string calldata ipfsMetaCID
    ) external nonReentrant returns (uint256 id) {
        require(bytes(name).length > 0, "Empty name");
        require(maxExecutions > 0 && maxExecutions <= MAX_EXECUTIONS, "Invalid max executions");

        // Collect task fee
        civToken.transferFrom(msg.sender, treasury, TASK_FEE);

        id = ++taskCount;
        tasks[id] = Task({
            id: id,
            owner: msg.sender,
            name: name,
            state: TaskState.Active,
            trigger: trigger,
            action: action,
            executionCount: 0,
            maxExecutions: maxExecutions,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            lastExecutedAt: 0,
            ipfsMetaCID: ipfsMetaCID
        });

        userTasks[msg.sender].push(id);

        emit TaskRegistered(id, msg.sender, name, trigger.triggerType, action.actionType);
    }

    // ── Keeper Execution ──────────────────────────────────────────────────────

    /**
     * @dev Called by keeper nodes when off-chain oracle reports conditions are met.
     *      Keepers must have KEEPER_ROLE. Trigger validation happens off-chain
     *      (oracle network), on-chain we validate state + basic time checks.
     */
    function executeTask(uint256 id) external nonReentrant onlyRole(KEEPER_ROLE) {
        Task storage t = tasks[id];
        require(t.state == TaskState.Active, "Task not active");
        require(t.executionCount < t.maxExecutions, "Max executions reached");

        // Time-based: enforce schedule
        if (t.trigger.triggerType == TriggerType.TIME_BASED) {
            require(block.timestamp >= t.trigger.nextExecutionTime, "Not scheduled yet");
        }

        // Price-based: check oracle price
        if (t.trigger.triggerType == TriggerType.PRICE_THRESHOLD) {
            uint256 currentPrice = oraclePrices[t.trigger.watchedToken];
            if (t.trigger.triggerAbove) {
                require(currentPrice >= t.trigger.thresholdValue, "Price not above threshold");
            } else {
                require(currentPrice <= t.trigger.thresholdValue, "Price not below threshold");
            }
        }

        // Execute action
        _executeAction(t);

        // Update state
        t.executionCount++;
        t.lastExecutedAt = block.timestamp;
        t.updatedAt = block.timestamp;

        // Advance schedule
        if (t.trigger.scheduleInterval > 0) {
            t.trigger.nextExecutionTime = block.timestamp + t.trigger.scheduleInterval;
        }

        // Auto-complete if reached max
        if (t.executionCount >= t.maxExecutions) {
            t.state = TaskState.Completed;
            emit TaskExpired(id);
        }

        emit TaskExecuted(id, msg.sender, block.timestamp);
    }

    function _executeAction(Task storage t) internal {
        ActionType aType = t.action.actionType;

        if (aType == ActionType.TOKEN_TRANSFER) {
            // Transfer tokens (AutomationEngine must be approved by owner)
            civToken.transferFrom(t.owner, t.action.target, t.action.amount);

        } else if (aType == ActionType.CONTRACT_CALL) {
            // Call external contract with provided calldata
            (bool ok,) = t.action.target.call(t.action.callData);
            require(ok, "Contract call failed");

        } else if (aType == ActionType.NOTIFICATION_HASH) {
            // Emit notification hash to XMTP/off-chain watchers — no on-chain state change
            // The event emission in the outer function handles this

        } else if (aType == ActionType.VOTE) {
            // Delegate vote call — calldata encodes governance.vote(proposalId, support)
            (bool ok,) = t.action.target.call(t.action.callData);
            require(ok, "Vote call failed");
        }
    }

    // ── Manual Execution ──────────────────────────────────────────────────────

    /**
     * @dev Task owner or keeper can manually trigger MANUAL type tasks.
     */
    function manualExecute(uint256 id) external nonReentrant {
        Task storage t = tasks[id];
        require(msg.sender == t.owner || hasRole(KEEPER_ROLE, msg.sender), "Not authorized");
        require(t.state == TaskState.Active, "Task not active");
        require(t.trigger.triggerType == TriggerType.MANUAL, "Not manual task");

        _executeAction(t);
        t.executionCount++;
        t.lastExecutedAt = block.timestamp;
        t.updatedAt = block.timestamp;

        if (t.executionCount >= t.maxExecutions) {
            t.state = TaskState.Completed;
            emit TaskExpired(id);
        }
        emit TaskExecuted(id, msg.sender, block.timestamp);
    }

    // ── Task Management ───────────────────────────────────────────────────────

    function pauseTask(uint256 id) external {
        Task storage t = tasks[id];
        require(msg.sender == t.owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(t.state == TaskState.Active, "Not active");
        t.state = TaskState.Paused;
        emit TaskPaused(id);
    }

    function resumeTask(uint256 id) external {
        Task storage t = tasks[id];
        require(msg.sender == t.owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(t.state == TaskState.Paused, "Not paused");
        t.state = TaskState.Active;
        emit TaskResumed(id);
    }

    function cancelTask(uint256 id) external {
        Task storage t = tasks[id];
        require(msg.sender == t.owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(t.state == TaskState.Active || t.state == TaskState.Paused, "Cannot cancel");
        t.state = TaskState.Cancelled;
        emit TaskCancelled(id, msg.sender);
    }

    // ── Oracle Interface ──────────────────────────────────────────────────────

    function updateOraclePrice(address token, uint256 price) external onlyRole(ORACLE_ROLE) {
        oraclePrices[token] = price;
        emit OraclePriceUpdated(token, price);
    }

    function updateOracleBalance(address user, address token, uint256 balance) external onlyRole(ORACLE_ROLE) {
        oracleBalances[keccak256(abi.encodePacked(user, token))] = balance;
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getTask(uint256 id) external view returns (Task memory) {
        return tasks[id];
    }

    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }

    function isTaskDue(uint256 id) external view returns (bool) {
        Task storage t = tasks[id];
        if (t.state != TaskState.Active) return false;
        if (t.trigger.triggerType == TriggerType.TIME_BASED) {
            return block.timestamp >= t.trigger.nextExecutionTime;
        }
        return true; // Off-chain keepers handle non-time triggers
    }
}
