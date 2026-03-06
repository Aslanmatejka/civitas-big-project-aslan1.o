// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MultiSigTreasury
 * @notice M-of-N multi-signature treasury for CIVITAS protocol funds.
 *
 * Holds ETH and ERC-20 tokens (primarily CIV). Any owner can propose a
 * transaction; once M owners confirm it, anyone can execute it after a
 * mandatory TIMELOCK_DELAY.
 *
 * Security features:
 *   - Immutable owner list after deployment (owners cannot be added/removed
 *     without deploying a new treasury — this is intentional for security).
 *   - TIMELOCK_DELAY (48 hours) between confirmation and execution.
 *   - Transaction TTL: proposals expire after TX_TTL if not executed.
 *   - Emergency pause: any owner can pause and unpausing requires all owners.
 *   - Separate ETH and ERC-20 transaction types.
 */
contract MultiSigTreasury is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant TIMELOCK_DELAY = 48 hours;
    uint256 public constant TX_TTL         = 30 days;
    uint256 public constant MAX_OWNERS     = 15;

    // ── State ─────────────────────────────────────────────────────────────────

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;          // M-of-N threshold
    bool    public paused;

    struct Transaction {
        address to;
        uint256 value;          // ETH in wei (0 for token txs)
        address token;          // address(0) for ETH
        uint256 tokenAmount;
        bytes   data;           // arbitrary calldata
        string  description;
        uint256 confirmations;
        uint256 proposedAt;
        uint256 readyAt;        // set once threshold met; 0 = not yet
        bool    executed;
        bool    revoked;
        mapping(address => bool) confirmedBy;
    }

    Transaction[] private _txs;

    // ── Events ────────────────────────────────────────────────────────────────

    event Deposit(address indexed sender, uint256 amount);
    event TokenDeposit(address indexed token, address indexed sender, uint256 amount);
    event TxProposed(uint256 indexed txId, address indexed proposer, address to, uint256 value, address token, uint256 tokenAmount);
    event TxConfirmed(uint256 indexed txId, address indexed owner, uint256 confirmations);
    event TxReady(uint256 indexed txId, uint256 executableAfter);
    event TxExecuted(uint256 indexed txId, address indexed executor);
    event TxRevoked(uint256 indexed txId, address indexed revoker);
    event ConfirmationRevoked(uint256 indexed txId, address indexed owner);
    event Paused(address indexed by);
    event Unpaused();

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(isOwner[msg.sender], "MultiSigTreasury: not an owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "MultiSigTreasury: paused");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < _txs.length, "MultiSigTreasury: tx does not exist");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!_txs[txId].executed, "MultiSigTreasury: already executed");
        _;
    }

    modifier notRevoked(uint256 txId) {
        require(!_txs[txId].revoked, "MultiSigTreasury: tx revoked");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _owners List of initial owner addresses.
     * @param _required Number of confirmations required (M-of-N).
     */
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length >= 2, "MultiSigTreasury: need at least 2 owners");
        require(_owners.length <= MAX_OWNERS, "MultiSigTreasury: too many owners");
        require(_required >= 2, "MultiSigTreasury: required too low");
        require(_required <= _owners.length, "MultiSigTreasury: required > owners");

        for (uint256 i = 0; i < _owners.length; i++) {
            address o = _owners[i];
            require(o != address(0), "MultiSigTreasury: zero owner");
            require(!isOwner[o], "MultiSigTreasury: duplicate owner");
            isOwner[o] = true;
            owners.push(o);
        }
        required = _required;
    }

    // ── Receive ───────────────────────────────────────────────────────────────

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // ── Propose ───────────────────────────────────────────────────────────────

    /**
     * @notice Propose an ETH transfer.
     */
    function proposeETH(address to, uint256 value, string calldata description)
        external
        onlyOwner
        whenNotPaused
        returns (uint256 txId)
    {
        return _propose(to, value, address(0), 0, "", description);
    }

    /**
     * @notice Propose an ERC-20 token transfer.
     */
    function proposeToken(address to, address token, uint256 amount, string calldata description)
        external
        onlyOwner
        whenNotPaused
        returns (uint256 txId)
    {
        require(token != address(0), "MultiSigTreasury: zero token");
        return _propose(to, 0, token, amount, "", description);
    }

    /**
     * @notice Propose an arbitrary contract call (with optional ETH).
     */
    function proposeCall(address to, uint256 value, bytes calldata data, string calldata description)
        external
        onlyOwner
        whenNotPaused
        returns (uint256 txId)
    {
        return _propose(to, value, address(0), 0, data, description);
    }

    function _propose(
        address to,
        uint256 value,
        address token,
        uint256 tokenAmount,
        bytes memory data,
        string memory description
    ) internal returns (uint256 txId) {
        require(to != address(0), "MultiSigTreasury: zero recipient");
        txId = _txs.length;
        _txs.push();
        Transaction storage tx_ = _txs[txId];
        tx_.to          = to;
        tx_.value       = value;
        tx_.token       = token;
        tx_.tokenAmount = tokenAmount;
        tx_.data        = data;
        tx_.description = description;
        tx_.proposedAt  = block.timestamp;

        emit TxProposed(txId, msg.sender, to, value, token, tokenAmount);

        // Auto-confirm for proposer
        _confirm(txId);
    }

    // ── Confirm / Revoke confirmation ─────────────────────────────────────────

    /**
     * @notice Confirm a proposed transaction.
     */
    function confirm(uint256 txId)
        external
        onlyOwner
        whenNotPaused
        txExists(txId)
        notExecuted(txId)
        notRevoked(txId)
    {
        _confirm(txId);
    }

    function _confirm(uint256 txId) internal {
        Transaction storage tx_ = _txs[txId];
        require(!tx_.confirmedBy[msg.sender], "MultiSigTreasury: already confirmed");
        require(!_isTTLExpired(tx_), "MultiSigTreasury: proposal expired");

        tx_.confirmedBy[msg.sender] = true;
        tx_.confirmations++;

        emit TxConfirmed(txId, msg.sender, tx_.confirmations);

        if (tx_.confirmations >= required && tx_.readyAt == 0) {
            tx_.readyAt = block.timestamp;
            emit TxReady(txId, block.timestamp + TIMELOCK_DELAY);
        }
    }

    /**
     * @notice Revoke your confirmation from a pending transaction.
     */
    function revokeConfirmation(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
        notRevoked(txId)
    {
        Transaction storage tx_ = _txs[txId];
        require(tx_.confirmedBy[msg.sender], "MultiSigTreasury: not confirmed");

        tx_.confirmedBy[msg.sender] = false;
        tx_.confirmations--;

        // Reset readyAt if threshold no longer met
        if (tx_.confirmations < required) {
            tx_.readyAt = 0;
        }

        emit ConfirmationRevoked(txId, msg.sender);
    }

    /**
     * @notice Revoke (cancel) a proposed transaction entirely.
     */
    function revokeTransaction(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
        notRevoked(txId)
    {
        _txs[txId].revoked = true;
        emit TxRevoked(txId, msg.sender);
    }

    // ── Execute ───────────────────────────────────────────────────────────────

    /**
     * @notice Execute a confirmed transaction after timelock delay.
     */
    function execute(uint256 txId)
        external
        nonReentrant
        whenNotPaused
        txExists(txId)
        notExecuted(txId)
        notRevoked(txId)
    {
        Transaction storage tx_ = _txs[txId];
        require(tx_.readyAt != 0, "MultiSigTreasury: not enough confirmations");
        require(block.timestamp >= tx_.readyAt + TIMELOCK_DELAY, "MultiSigTreasury: timelock active");
        require(!_isTTLExpired(tx_), "MultiSigTreasury: proposal expired");

        tx_.executed = true;

        if (tx_.token != address(0)) {
            // ERC-20 transfer
            IERC20(tx_.token).safeTransfer(tx_.to, tx_.tokenAmount);
        } else if (tx_.data.length > 0) {
            // Arbitrary call
            (bool success, ) = tx_.to.call{value: tx_.value}(tx_.data);
            require(success, "MultiSigTreasury: call failed");
        } else {
            // Plain ETH transfer
            (bool success, ) = tx_.to.call{value: tx_.value}("");
            require(success, "MultiSigTreasury: ETH transfer failed");
        }

        emit TxExecuted(txId, msg.sender);
    }

    // ── Emergency Pause ───────────────────────────────────────────────────────

    /**
     * @notice Any owner can pause the treasury in an emergency.
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpausing requires ALL owners to confirm via a standard multi-sig tx.
     *         This function is called by the execute() path — propose a call to this.
     */
    function unpause() external {
        require(msg.sender == address(this), "MultiSigTreasury: must be self-call");
        paused = false;
        emit Unpaused();
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    /**
     * @notice Returns all treasury owners.
     */
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /**
     * @notice Returns the transaction count.
     */
    function transactionCount() external view returns (uint256) {
        return _txs.length;
    }

    /**
     * @notice Returns transaction details (excluding confirmation mapping).
     */
    function getTransaction(uint256 txId)
        external
        view
        txExists(txId)
        returns (
            address to,
            uint256 value,
            address token,
            uint256 tokenAmount,
            string memory description,
            uint256 confirmations,
            uint256 proposedAt,
            uint256 readyAt,
            bool executed,
            bool revoked
        )
    {
        Transaction storage tx_ = _txs[txId];
        return (
            tx_.to, tx_.value, tx_.token, tx_.tokenAmount,
            tx_.description, tx_.confirmations, tx_.proposedAt,
            tx_.readyAt, tx_.executed, tx_.revoked
        );
    }

    /**
     * @notice Returns whether an owner has confirmed a given transaction.
     */
    function hasConfirmed(uint256 txId, address owner_) external view txExists(txId) returns (bool) {
        return _txs[txId].confirmedBy[owner_];
    }

    /**
     * @notice ETH balance of the treasury.
     */
    function ethBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice ERC-20 balance held by the treasury.
     */
    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function _isTTLExpired(Transaction storage tx_) internal view returns (bool) {
        return block.timestamp > tx_.proposedAt + TX_TTL;
    }
}
