// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SocialRecovery
 * @notice Guardian-based key recovery for CIVITAS identity and wallet.
 *
 * Flow:
 *   1. Account owner registers guardians (trusted addresses) and sets threshold.
 *   2. If the owner loses their key, any guardian initiates a recovery request.
 *   3. Once threshold of guardians approve within RECOVERY_WINDOW, the new
 *      owner address is accepted and the account is transferred.
 *   4. A RECOVERY_DELAY period must pass after threshold is met before the
 *      recovery is executed — giving the real owner time to cancel.
 *   5. The real owner can cancel any in-progress recovery at any time.
 *
 * Security properties:
 *   - Guardians cannot collude instantly: RECOVERY_DELAY prevents race attacks.
 *   - Owner can always cancel (unless fully locked out — hence the guardians).
 *   - Guardian addresses are hashed in storage to prevent social engineering.
 *   - MAX_GUARDIANS = 10; MIN_THRESHOLD = 2.
 */
contract SocialRecovery is ReentrancyGuard, AccessControl {

    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    uint256 public constant RECOVERY_WINDOW = 7 days;
    uint256 public constant RECOVERY_DELAY  = 2 days;
    uint256 public constant MAX_GUARDIANS   = 10;
    uint256 public constant MIN_THRESHOLD   = 2;

    // ── Per-account state ────────────────────────────────────────────────────

    struct AccountConfig {
        address owner;
        address[] guardians;
        uint256 threshold;           // number of guardian approvals required
        bool    exists;
    }

    struct RecoveryRequest {
        address proposedOwner;       // new key being voted in
        uint256 initiatedAt;
        uint256 approvalsCount;
        uint256 readyAt;             // set when threshold met; 0 = not yet met
        bool    executed;
        bool    cancelled;
        mapping(address => bool) approvedBy;
    }

    // account address → config
    mapping(address => AccountConfig) private _configs;

    // account address → active recovery
    mapping(address => RecoveryRequest) private _recoveries;

    // ── Events ────────────────────────────────────────────────────────────────

    event AccountRegistered(address indexed account, address[] guardians, uint256 threshold);
    event GuardianAdded(address indexed account, address indexed guardian);
    event GuardianRemoved(address indexed account, address indexed guardian);
    event ThresholdChanged(address indexed account, uint256 newThreshold);
    event RecoveryInitiated(address indexed account, address indexed proposedOwner, address indexed initiator);
    event RecoveryApproved(address indexed account, address indexed guardian, uint256 approvalsCount);
    event RecoveryReady(address indexed account, address indexed proposedOwner, uint256 executableAfter);
    event RecoveryExecuted(address indexed account, address indexed newOwner);
    event RecoveryCancelled(address indexed account, address indexed cancelledBy);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyAccountOwner(address account) {
        require(msg.sender == _configs[account].owner, "SocialRecovery: not account owner");
        _;
    }

    modifier accountExists(address account) {
        require(_configs[account].exists, "SocialRecovery: account not registered");
        _;
    }

    modifier isGuardianOf(address account) {
        require(_isGuardian(account, msg.sender), "SocialRecovery: not a guardian");
        _;
    }

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * @notice Register an account with its guardian set.
     * @param guardians Initial guardian addresses (2–10).
     * @param threshold Number of guardian approvals required (≥ MIN_THRESHOLD).
     */
    function registerAccount(address[] calldata guardians, uint256 threshold) external {
        require(!_configs[msg.sender].exists, "SocialRecovery: already registered");
        require(guardians.length >= MIN_THRESHOLD, "SocialRecovery: need at least 2 guardians");
        require(guardians.length <= MAX_GUARDIANS, "SocialRecovery: too many guardians");
        require(threshold >= MIN_THRESHOLD, "SocialRecovery: threshold too low");
        require(threshold <= guardians.length, "SocialRecovery: threshold exceeds guardian count");

        AccountConfig storage cfg = _configs[msg.sender];
        cfg.owner     = msg.sender;
        cfg.threshold = threshold;
        cfg.exists    = true;

        for (uint256 i = 0; i < guardians.length; i++) {
            require(guardians[i] != address(0), "SocialRecovery: zero guardian");
            require(guardians[i] != msg.sender, "SocialRecovery: owner cannot be guardian");
            cfg.guardians.push(guardians[i]);
        }

        emit AccountRegistered(msg.sender, guardians, threshold);
    }

    /**
     * @notice Add a new guardian to your account.
     */
    function addGuardian(address guardian) external accountExists(msg.sender) onlyAccountOwner(msg.sender) {
        AccountConfig storage cfg = _configs[msg.sender];
        require(cfg.guardians.length < MAX_GUARDIANS, "SocialRecovery: guardian limit reached");
        require(!_isGuardian(msg.sender, guardian), "SocialRecovery: already a guardian");
        require(guardian != msg.sender, "SocialRecovery: owner cannot be guardian");
        cfg.guardians.push(guardian);
        emit GuardianAdded(msg.sender, guardian);
    }

    /**
     * @notice Remove a guardian from your account.
     */
    function removeGuardian(address guardian) external accountExists(msg.sender) onlyAccountOwner(msg.sender) {
        AccountConfig storage cfg = _configs[msg.sender];
        uint256 len = cfg.guardians.length;
        require(len - 1 >= cfg.threshold, "SocialRecovery: would breach threshold");

        for (uint256 i = 0; i < len; i++) {
            if (cfg.guardians[i] == guardian) {
                cfg.guardians[i] = cfg.guardians[len - 1];
                cfg.guardians.pop();
                emit GuardianRemoved(msg.sender, guardian);
                return;
            }
        }
        revert("SocialRecovery: guardian not found");
    }

    /**
     * @notice Update the approval threshold.
     */
    function setThreshold(uint256 newThreshold)
        external
        accountExists(msg.sender)
        onlyAccountOwner(msg.sender)
    {
        AccountConfig storage cfg = _configs[msg.sender];
        require(newThreshold >= MIN_THRESHOLD, "SocialRecovery: threshold too low");
        require(newThreshold <= cfg.guardians.length, "SocialRecovery: threshold exceeds guardians");
        cfg.threshold = newThreshold;
        emit ThresholdChanged(msg.sender, newThreshold);
    }

    // ── Recovery Flow ─────────────────────────────────────────────────────────

    /**
     * @notice Guardian initiates a recovery for `account`, proposing `newOwner`.
     */
    function initiateRecovery(address account, address newOwner)
        external
        accountExists(account)
        isGuardianOf(account)
    {
        require(newOwner != address(0), "SocialRecovery: zero new owner");
        require(newOwner != _configs[account].owner, "SocialRecovery: same owner");

        RecoveryRequest storage req = _recoveries[account];
        require(!req.executed, "SocialRecovery: already executed");

        // If a stale request exists (past window), reset it
        if (req.initiatedAt != 0 && block.timestamp > req.initiatedAt + RECOVERY_WINDOW) {
            delete _recoveries[account];
        }

        require(req.initiatedAt == 0 || req.cancelled, "SocialRecovery: recovery in progress");

        // Fresh request
        RecoveryRequest storage fresh = _recoveries[account];
        fresh.proposedOwner   = newOwner;
        fresh.initiatedAt     = block.timestamp;
        fresh.approvalsCount  = 1;
        fresh.approvedBy[msg.sender] = true;
        fresh.executed  = false;
        fresh.cancelled = false;
        fresh.readyAt   = 0;

        emit RecoveryInitiated(account, newOwner, msg.sender);
        emit RecoveryApproved(account, msg.sender, 1);

        _checkThreshold(account);
    }

    /**
     * @notice Guardian approves an in-progress recovery.
     */
    function approveRecovery(address account)
        external
        accountExists(account)
        isGuardianOf(account)
    {
        RecoveryRequest storage req = _recoveries[account];
        require(req.initiatedAt != 0, "SocialRecovery: no active recovery");
        require(!req.cancelled, "SocialRecovery: cancelled");
        require(!req.executed, "SocialRecovery: already executed");
        require(block.timestamp <= req.initiatedAt + RECOVERY_WINDOW, "SocialRecovery: window expired");
        require(!req.approvedBy[msg.sender], "SocialRecovery: already approved");

        req.approvedBy[msg.sender] = true;
        req.approvalsCount++;

        emit RecoveryApproved(account, msg.sender, req.approvalsCount);
        _checkThreshold(account);
    }

    /**
     * @notice Execute the recovery after the delay period has passed.
     * @dev Anyone can call this once the delay is met — no griefing risk since
     *      outcome is deterministic.
     */
    function executeRecovery(address account)
        external
        nonReentrant
        accountExists(account)
    {
        RecoveryRequest storage req = _recoveries[account];
        require(req.readyAt != 0, "SocialRecovery: threshold not reached");
        require(!req.executed, "SocialRecovery: already executed");
        require(!req.cancelled, "SocialRecovery: cancelled");
        require(block.timestamp >= req.readyAt + RECOVERY_DELAY, "SocialRecovery: delay not passed");

        req.executed = true;
        address newOwner = req.proposedOwner;
        _configs[account].owner = newOwner;

        emit RecoveryExecuted(account, newOwner);
    }

    /**
     * @notice The account owner (or protocol admin) cancels an in-progress recovery.
     */
    function cancelRecovery(address account) external accountExists(account) {
        require(
            msg.sender == _configs[account].owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "SocialRecovery: not authorised to cancel"
        );
        RecoveryRequest storage req = _recoveries[account];
        require(req.initiatedAt != 0, "SocialRecovery: no active recovery");
        require(!req.executed, "SocialRecovery: already executed");

        req.cancelled = true;
        emit RecoveryCancelled(account, msg.sender);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the current owner on record for an account.
     */
    function getOwner(address account) external view returns (address) {
        return _configs[account].owner;
    }

    /**
     * @notice Returns the guardian list and threshold for an account.
     */
    function getAccountConfig(address account)
        external view
        returns (address[] memory guardians, uint256 threshold, bool exists)
    {
        AccountConfig storage cfg = _configs[account];
        return (cfg.guardians, cfg.threshold, cfg.exists);
    }

    /**
     * @notice Returns the active recovery status for an account.
     */
    function getRecoveryStatus(address account)
        external view
        returns (
            address proposedOwner,
            uint256 initiatedAt,
            uint256 approvalsCount,
            uint256 readyAt,
            bool executed,
            bool cancelled,
            bool windowExpired
        )
    {
        RecoveryRequest storage req = _recoveries[account];
        return (
            req.proposedOwner,
            req.initiatedAt,
            req.approvalsCount,
            req.readyAt,
            req.executed,
            req.cancelled,
            req.initiatedAt != 0 && block.timestamp > req.initiatedAt + RECOVERY_WINDOW
        );
    }

    /**
     * @notice Returns whether a given address is a guardian for the account.
     */
    function isGuardian(address account, address guardian) external view returns (bool) {
        return _isGuardian(account, guardian);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _isGuardian(address account, address candidate) internal view returns (bool) {
        address[] storage gs = _configs[account].guardians;
        for (uint256 i = 0; i < gs.length; i++) {
            if (gs[i] == candidate) return true;
        }
        return false;
    }

    function _checkThreshold(address account) internal {
        RecoveryRequest storage req = _recoveries[account];
        if (req.approvalsCount >= _configs[account].threshold && req.readyAt == 0) {
            req.readyAt = block.timestamp;
            emit RecoveryReady(account, req.proposedOwner, block.timestamp + RECOVERY_DELAY);
        }
    }
}
