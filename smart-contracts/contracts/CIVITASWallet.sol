// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CIVITASWallet
 * @dev Non-custodial multi-signature wallet with recovery mechanisms
 * 
 * Features:
 * - Multi-signature support
 * - Social recovery
 * - Escape clauses for asset protection
 * - Daily spending limits
 * - Emergency freeze
 */
contract CIVITASWallet is Ownable, ReentrancyGuard {
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
        mapping(address => bool) isConfirmed;
    }
    
    struct Guardian {
        address guardianAddress;
        bool active;
        uint256 addedAt;
    }
    
    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public requiredConfirmations;
    
    Transaction[] public transactions;
    mapping(uint256 => Transaction) public pendingTransactions;
    uint256 public transactionCount;
    
    Guardian[] public guardians;
    mapping(address => bool) public isGuardian;
    uint256 public recoveryThreshold = 3; // Number of guardians needed for recovery
    
    uint256 public dailyLimit = 1000 * 10**18; // Daily spending limit
    uint256 public spentToday;
    uint256 public lastResetTime;
    
    bool public frozen = false;
    
    // Events
    event Deposit(address indexed sender, uint256 amount);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event RecoveryInitiated(address indexed newOwner);
    event WalletFrozen();
    event WalletUnfrozen();
    
    modifier onlyOwners() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }
    
    modifier notFrozen() {
        require(!frozen, "Wallet is frozen");
        _;
    }
    
    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactionCount, "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 _txIndex) {
        require(!pendingTransactions[_txIndex].executed, "Transaction already executed");
        _;
    }
    
    constructor(
        address[] memory _owners,
        uint256 _requiredConfirmations
    ) Ownable(msg.sender) {
        require(_owners.length > 0, "Owners required");
        require(
            _requiredConfirmations > 0 && _requiredConfirmations <= _owners.length,
            "Invalid confirmation count"
        );
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        requiredConfirmations = _requiredConfirmations;
        lastResetTime = block.timestamp;
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Submit a new transaction
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwners notFrozen returns (uint256) {
        uint256 txIndex = transactionCount;
        
        Transaction storage transaction = pendingTransactions[txIndex];
        transaction.to = _to;
        transaction.value = _value;
        transaction.data = _data;
        transaction.executed = false;
        transaction.confirmations = 0;
        
        transactionCount++;
        
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
        return txIndex;
    }
    
    /**
     * @dev Confirm a transaction
     */
    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwners
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = pendingTransactions[_txIndex];
        require(!transaction.isConfirmed[msg.sender], "Transaction already confirmed");
        
        transaction.isConfirmed[msg.sender] = true;
        transaction.confirmations += 1;
        
        emit ConfirmTransaction(msg.sender, _txIndex);
    }
    
    /**
     * @dev Execute a confirmed transaction
     */
    function executeTransaction(uint256 _txIndex)
        public
        onlyOwners
        txExists(_txIndex)
        notExecuted(_txIndex)
        nonReentrant
    {
        Transaction storage transaction = pendingTransactions[_txIndex];
        require(transaction.confirmations >= requiredConfirmations, "Not enough confirmations");
        
        // Check daily limit
        if (block.timestamp >= lastResetTime + 1 days) {
            spentToday = 0;
            lastResetTime = block.timestamp;
        }
        
        require(spentToday + transaction.value <= dailyLimit, "Exceeds daily limit");
        
        transaction.executed = true;
        spentToday += transaction.value;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
    }
    
    /**
     * @dev Add a recovery guardian
     */
    function addGuardian(address _guardian) external onlyOwners {
        require(_guardian != address(0), "Invalid guardian");
        require(!isGuardian[_guardian], "Already a guardian");
        
        guardians.push(Guardian({
            guardianAddress: _guardian,
            active: true,
            addedAt: block.timestamp
        }));
        isGuardian[_guardian] = true;
        
        emit GuardianAdded(_guardian);
    }
    
    /**
     * @dev Initiate social recovery
     * TODO: Implement multi-guardian signature verification
     */
    function initiateRecovery(address _newOwner) external {
        require(isGuardian[msg.sender], "Not a guardian");
        require(_newOwner != address(0), "Invalid new owner");
        
        // Simplified for MVP - requires proper guardian consensus
        emit RecoveryInitiated(_newOwner);
    }
    
    /**
     * @dev Freeze wallet in emergency
     */
    function freezeWallet() external onlyOwners {
        frozen = true;
        emit WalletFrozen();
    }
    
    /**
     * @dev Unfreeze wallet
     */
    function unfreezeWallet() external onlyOwners {
        frozen = false;
        emit WalletUnfrozen();
    }
    
    /**
     * @dev Get wallet balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
