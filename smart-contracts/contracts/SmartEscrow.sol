// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SmartEscrow
 * @dev P2P escrow contract for CIVITAS marketplace and payments.
 *
 * Architecture Layer 3 — Financial and Automation
 *
 * Features:
 * - Trustless P2P escrow for goods and services
 * - Native ETH and CIV token support
 * - Dispute resolution via community arbitrators
 * - Escape clause: auto-refund after timeout with no seller action
 * - Platform fee burned / sent to treasury
 * - Reputation-weighted arbitration
 */
contract SmartEscrow is Ownable, ReentrancyGuard {

    IERC20 public civToken;

    uint256 public constant PLATFORM_FEE_BPS = 100; // 1%
    uint256 public constant ARBITRATION_TIMEOUT = 7 days;
    uint256 public constant AUTO_RELEASE_TIMEOUT = 14 days;
    uint256 public constant MIN_ARBITRATOR_STAKE = 1000 * 10**18; // 1000 CIV

    address public treasury;
    uint256 public escrowCount;

    enum EscrowState { Pending, Active, Delivered, Disputed, Released, Refunded, Cancelled }
    enum PaymentType { ETH, CIV }

    struct Escrow {
        uint256 id;
        address payable buyer;
        address payable seller;
        uint256 amount;           // wei or token units
        PaymentType paymentType;
        EscrowState state;
        string description;
        string ipfsTermsCID;      // IPFS CID of off-chain terms
        uint256 createdAt;
        uint256 deliveredAt;
        uint256 autoReleaseAt;    // Escape clause deadline
        address arbitrator;
        bool buyerApproved;
        bool sellerApproved;
    }

    mapping(uint256 => Escrow) public escrows;
    // approved arbitrators → stake
    mapping(address => uint256) public arbitratorStakes;
    mapping(address => bool)    public approvedArbitrators;

    // buyer/seller → escrow IDs
    mapping(address => uint256[]) public userEscrows;

    event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, uint256 amount, PaymentType paymentType);
    event EscrowDelivered(uint256 indexed id, address indexed seller);
    event EscrowReleased(uint256 indexed id, address indexed buyer);
    event EscrowDisputed(uint256 indexed id, address indexed initiator);
    event EscrowResolved(uint256 indexed id, bool buyerWins, address arbitrator);
    event EscrowRefunded(uint256 indexed id);
    event EscrowCancelled(uint256 indexed id);
    event ArbitratorRegistered(address indexed arbitrator, uint256 stake);
    event ArbitratorRemoved(address indexed arbitrator);

    constructor(address _civToken, address _treasury) Ownable(msg.sender) {
        civToken = IERC20(_civToken);
        treasury = _treasury;
    }

    // ── Arbitrator Management ─────────────────────────────────────────────────

    /**
     * @dev Register as an arbitrator by staking CIV tokens.
     *      Arbitrators must maintain MIN_ARBITRATOR_STAKE.
     */
    function registerArbitrator(uint256 stakeAmount) external nonReentrant {
        require(stakeAmount >= MIN_ARBITRATOR_STAKE, "Insufficient stake");
        require(!approvedArbitrators[msg.sender], "Already an arbitrator");

        civToken.transferFrom(msg.sender, address(this), stakeAmount);
        arbitratorStakes[msg.sender] = stakeAmount;
        approvedArbitrators[msg.sender] = true;

        emit ArbitratorRegistered(msg.sender, stakeAmount);
    }

    /**
     * @dev Owner can remove a malicious arbitrator and slash their stake.
     */
    function slashArbitrator(address arbitrator) external onlyOwner {
        require(approvedArbitrators[arbitrator], "Not an arbitrator");
        uint256 stake = arbitratorStakes[arbitrator];
        arbitratorStakes[arbitrator] = 0;
        approvedArbitrators[arbitrator] = false;
        // Slashed stake goes to treasury
        civToken.transfer(treasury, stake);
        emit ArbitratorRemoved(arbitrator);
    }

    // ── Escrow Lifecycle ──────────────────────────────────────────────────────

    /**
     * @dev Create an ETH-based escrow. Buyer deposits ETH.
     */
    function createEscrowETH(
        address payable seller,
        string calldata description,
        string calldata ipfsTermsCID,
        address arbitrator
    ) external payable nonReentrant returns (uint256 id) {
        require(msg.value > 0, "No ETH sent");
        require(seller != address(0) && seller != msg.sender, "Invalid seller");
        if (arbitrator != address(0)) {
            require(approvedArbitrators[arbitrator], "Arbitrator not approved");
        }

        id = ++escrowCount;
        escrows[id] = Escrow({
            id: id,
            buyer: payable(msg.sender),
            seller: seller,
            amount: msg.value,
            paymentType: PaymentType.ETH,
            state: EscrowState.Active,
            description: description,
            ipfsTermsCID: ipfsTermsCID,
            createdAt: block.timestamp,
            deliveredAt: 0,
            autoReleaseAt: block.timestamp + AUTO_RELEASE_TIMEOUT,
            arbitrator: arbitrator,
            buyerApproved: false,
            sellerApproved: false
        });

        userEscrows[msg.sender].push(id);
        userEscrows[seller].push(id);

        emit EscrowCreated(id, msg.sender, seller, msg.value, PaymentType.ETH);
    }

    /**
     * @dev Create a CIV token-based escrow.
     */
    function createEscrowCIV(
        address payable seller,
        uint256 amount,
        string calldata description,
        string calldata ipfsTermsCID,
        address arbitrator
    ) external nonReentrant returns (uint256 id) {
        require(amount > 0, "No amount");
        require(seller != address(0) && seller != msg.sender, "Invalid seller");
        if (arbitrator != address(0)) {
            require(approvedArbitrators[arbitrator], "Arbitrator not approved");
        }

        civToken.transferFrom(msg.sender, address(this), amount);

        id = ++escrowCount;
        escrows[id] = Escrow({
            id: id,
            buyer: payable(msg.sender),
            seller: seller,
            amount: amount,
            paymentType: PaymentType.CIV,
            state: EscrowState.Active,
            description: description,
            ipfsTermsCID: ipfsTermsCID,
            createdAt: block.timestamp,
            deliveredAt: 0,
            autoReleaseAt: block.timestamp + AUTO_RELEASE_TIMEOUT,
            arbitrator: arbitrator,
            buyerApproved: false,
            sellerApproved: false
        });

        userEscrows[msg.sender].push(id);
        userEscrows[seller].push(id);

        emit EscrowCreated(id, msg.sender, seller, amount, PaymentType.CIV);
    }

    /**
     * @dev Seller marks order as delivered.
     */
    function markDelivered(uint256 id) external {
        Escrow storage e = escrows[id];
        require(msg.sender == e.seller, "Not seller");
        require(e.state == EscrowState.Active, "Wrong state");
        e.state = EscrowState.Delivered;
        e.deliveredAt = block.timestamp;
        emit EscrowDelivered(id, msg.sender);
    }

    /**
     * @dev Buyer confirms receipt → releases funds to seller minus platform fee.
     */
    function confirmReceipt(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        require(msg.sender == e.buyer, "Not buyer");
        require(e.state == EscrowState.Delivered || e.state == EscrowState.Active, "Wrong state");
        _release(id);
    }

    /**
     * @dev Escape clause: auto-release if seller never marked delivered and timeout passed.
     *      Refunds buyer. Any party can call.
     */
    function claimAutoRefund(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        require(e.state == EscrowState.Active, "Not active");
        require(block.timestamp >= e.autoReleaseAt, "Timeout not reached");
        _refund(id);
    }

    /**
     * @dev Open a dispute. Either party can dispute after delivery.
     */
    function openDispute(uint256 id) external {
        Escrow storage e = escrows[id];
        require(msg.sender == e.buyer || msg.sender == e.seller, "Not party");
        require(e.state == EscrowState.Delivered || e.state == EscrowState.Active, "Wrong state");
        require(e.arbitrator != address(0), "No arbitrator assigned");
        e.state = EscrowState.Disputed;
        emit EscrowDisputed(id, msg.sender);
    }

    /**
     * @dev Arbitrator resolves the dispute.
     * @param buyerWins true → refund buyer; false → release to seller
     */
    function resolveDispute(uint256 id, bool buyerWins) external nonReentrant {
        Escrow storage e = escrows[id];
        require(msg.sender == e.arbitrator, "Not arbitrator");
        require(e.state == EscrowState.Disputed, "Not disputed");

        if (buyerWins) {
            _refund(id);
        } else {
            _release(id);
        }
        emit EscrowResolved(id, buyerWins, msg.sender);
    }

    /**
     * @dev Cancel escrow if still pending (before seller accepts).
     */
    function cancelEscrow(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        require(msg.sender == e.buyer, "Not buyer");
        require(e.state == EscrowState.Active, "Cannot cancel");
        _refund(id);
        e.state = EscrowState.Cancelled;
        emit EscrowCancelled(id);
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    function _release(uint256 id) internal {
        Escrow storage e = escrows[id];
        e.state = EscrowState.Released;
        uint256 fee = (e.amount * PLATFORM_FEE_BPS) / 10000;
        uint256 net = e.amount - fee;

        if (e.paymentType == PaymentType.ETH) {
            (bool feeOk,) = treasury.call{value: fee}("");
            require(feeOk, "Fee transfer failed");
            (bool ok,) = e.seller.call{value: net}("");
            require(ok, "Seller transfer failed");
        } else {
            civToken.transfer(treasury, fee);
            civToken.transfer(e.seller, net);
        }
        emit EscrowReleased(id, e.buyer);
    }

    function _refund(uint256 id) internal {
        Escrow storage e = escrows[id];
        e.state = EscrowState.Refunded;
        if (e.paymentType == PaymentType.ETH) {
            (bool ok,) = e.buyer.call{value: e.amount}("");
            require(ok, "Refund failed");
        } else {
            civToken.transfer(e.buyer, e.amount);
        }
        emit EscrowRefunded(id);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getEscrow(uint256 id) external view returns (
        uint256, address, address, uint256, PaymentType, EscrowState,
        string memory, uint256, uint256, address
    ) {
        Escrow storage e = escrows[id];
        return (
            e.id, e.buyer, e.seller, e.amount, e.paymentType, e.state,
            e.description, e.createdAt, e.autoReleaseAt, e.arbitrator
        );
    }

    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
    }

    function updateTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    receive() external payable {}
}
