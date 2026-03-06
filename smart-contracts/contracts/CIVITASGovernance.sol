// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CIVITASGovernance
 * @dev DAO Governance contract for CIVITAS
 * 
 * Features:
 * - Proposal creation and voting
 * - Quadratic voting to prevent whale dominance
 * - Reputation-weighted voting (on-chain lookup via DIDRegistry)
 * - Treasury management
 * - Anti-whale mechanisms
 */

/// @dev Minimal interface for reading DID reputation on-chain.
interface IDIDRegistryGov {
    struct DIDDocument {
        address controller;
        string didDocument;
        string profileCID;
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
        uint256 reputation;
    }
    function getDID(bytes32 didIdentifier) external view returns (DIDDocument memory);
}

contract CIVITASGovernance is Ownable, ReentrancyGuard {
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string ipfsHash; // Detailed proposal on IPFS
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalState state;
        mapping(address => Vote) votes;
    }
    
    struct Vote {
        bool hasVoted;
        uint8 support; // 0 = Against, 1 = For, 2 = Abstain
        uint256 weight; // Quadratic voting weight
        uint256 reputation; // Reputation at time of vote
    }
    
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Executed
    }
    
    // ── Vote Decay constants ──────────────────────────────────────────────
    // Early votes carry full quadratic weight; votes cast in the last fraction
    // of the window are discounted down to DECAY_FLOOR (20%).
    //
    //   timeLeft   = votingDeadline - block.timestamp
    //   decayFactor = DECAY_FLOOR_BPS + timeLeft * (10000 - DECAY_FLOOR_BPS) / votingPeriod
    //   decayedWeight = baseWeight * decayFactor / 10000
    //
    // E.g. vote cast at t=0 → decay = 10000 (100%).  vote at deadline → decay = 2000 (20%).
    uint256 public constant DECAY_FLOOR_BPS = 2000; // 20%  minimum weight

    // ── State variables ───────────────────────────────────────────────────────
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 1000 * 10**18; // Minimum CIV to propose
    uint256 public quorumPercentage = 4; // 4% quorum required

    // ── External contract references ──────────────────────────────────────────
    IERC20 public civToken;
    IDIDRegistryGov public didRegistry;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 votingDeadline
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 baseWeight,
        uint256 decayedWeight,
        uint256 decayFactorBps
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Set the CIV token reference (owner-only, one-time or update)
     */
    function setCIVToken(address _civToken) external onlyOwner {
        require(_civToken != address(0), "Invalid token address");
        civToken = IERC20(_civToken);
    }

    /**
     * @dev Set the DID Registry reference (owner-only)
     */
    function setDIDRegistry(address _didRegistry) external onlyOwner {
        require(_didRegistry != address(0), "Invalid registry address");
        didRegistry = IDIDRegistryGov(_didRegistry);
    }
    
    /**
     * @dev Create a new proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param ipfsHash IPFS hash containing full proposal details
     */
    function propose(
        string memory title,
        string memory description,
        string memory ipfsHash
    ) external nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        // Enforce minimum CIV token balance to create proposals
        if (address(civToken) != address(0)) {
            require(
                civToken.balanceOf(msg.sender) >= proposalThreshold,
                "Insufficient CIV balance to propose"
            );
        }
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.ipfsHash = ipfsHash;
        newProposal.createdAt = block.timestamp;
        newProposal.votingDeadline = block.timestamp + votingPeriod;
        newProposal.state = ProposalState.Active;
        
        emit ProposalCreated(proposalId, msg.sender, title, newProposal.votingDeadline);
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal with quadratic weighting + time-decay.
     *
     * baseWeight    = sqrt(tokenAmount) * reputation / 1000
     * decayFactor   = DECAY_FLOOR_BPS + timeLeft * (10000 - DECAY_FLOOR_BPS) / votingPeriod
     * decayedWeight = baseWeight * decayFactor / 10000
     *
     * @param proposalId  The proposal to vote on.
     * @param support     Vote choice (0 = Against, 1 = For, 2 = Abstain).
     * @param tokenAmount Amount of CIV tokens committed for quadratic weight.
     * @param didIdentifier Voter's DID identifier for on-chain reputation lookup.
     *                      Pass bytes32(0) to fall back to a default reputation of 500.
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        uint256 tokenAmount,
        bytes32 didIdentifier
    ) external nonReentrant {
        require(proposalId <= proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Proposal not active");
        require(block.timestamp <= proposal.votingDeadline, "Voting period ended");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");
        require(support <= 2, "Invalid vote");

        // ── Look up reputation on-chain via DIDRegistry ──────────────────────
        uint256 reputation = 500; // default baseline
        if (address(didRegistry) != address(0) && didIdentifier != bytes32(0)) {
            IDIDRegistryGov.DIDDocument memory doc = didRegistry.getDID(didIdentifier);
            if (doc.active && doc.controller == msg.sender) {
                reputation = doc.reputation;
            }
        }

        // ── Quadratic base weight ────────────────────────────────────────────
        uint256 baseWeight = _sqrt(tokenAmount) * reputation / 1000;

        // ── Time-decay factor ────────────────────────────────────────────────
        uint256 timeLeft = proposal.votingDeadline > block.timestamp
            ? proposal.votingDeadline - block.timestamp
            : 0;
        uint256 decayFactorBps = DECAY_FLOOR_BPS
            + (timeLeft * (10000 - DECAY_FLOOR_BPS)) / votingPeriod;
        // Clamp to [DECAY_FLOOR_BPS, 10000]
        if (decayFactorBps > 10000) decayFactorBps = 10000;

        uint256 voteWeight = baseWeight * decayFactorBps / 10000;

        proposal.votes[msg.sender] = Vote({
            hasVoted:   true,
            support:    support,
            weight:     voteWeight,
            reputation: reputation
        });

        if (support == 0) {
            proposal.againstVotes += voteWeight;
        } else if (support == 1) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.abstainVotes += voteWeight;
        }

        emit VoteCast(msg.sender, proposalId, support, baseWeight, voteWeight, decayFactorBps);
    }

    /**
     * @dev Preview what vote weight a user would receive right now for a proposal.
     * @param proposalId  The proposal ID.
     * @param tokenAmount Token amount the voter intends to commit.
     * @param reputation  Voter's current reputation score.
     * @return baseWeight     Quadratic weight before decay.
     * @return decayedWeight  Final weight after applying time-decay.
     * @return decayFactorBps Decay factor in basis points (10000 = no decay, 2000 = floor).
     */
    function getDecayedWeight(
        uint256 proposalId,
        uint256 tokenAmount,
        uint256 reputation
    ) external view returns (uint256 baseWeight, uint256 decayedWeight, uint256 decayFactorBps) {
        require(proposalId <= proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];

        baseWeight = _sqrt(tokenAmount) * reputation / 1000;

        uint256 timeLeft = proposal.votingDeadline > block.timestamp
            ? proposal.votingDeadline - block.timestamp
            : 0;
        decayFactorBps = DECAY_FLOOR_BPS
            + (timeLeft * (10000 - DECAY_FLOOR_BPS)) / votingPeriod;
        if (decayFactorBps > 10000) decayFactorBps = 10000;

        decayedWeight = baseWeight * decayFactorBps / 10000;
    }
    
    /**
     * @dev Execute a successful proposal
     * @param proposalId The proposal to execute
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId <= proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Proposal not active");
        require(block.timestamp > proposal.votingDeadline, "Voting still active");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        // Quorum check: totalVotes must be ≥ quorumPercentage% of a reference supply.
        // For now we use a simple minimum-vote threshold (quorumPercentage interpreted
        // as the minimum number of weighted votes required).
        // TODO: Replace with `totalVotes * 10000 >= quorumPercentage * totalSupply`
        //       once CIVToken reference is wired into the contract.
        uint256 quorum = quorumPercentage;
        
        if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
            proposal.state = ProposalState.Succeeded;
            // TODO: Execute proposal actions
            emit ProposalExecuted(proposalId);
        } else {
            proposal.state = ProposalState.Defeated;
        }
    }
    
    /**
     * @dev Cancel a proposal (only by proposer or governance)
     * @param proposalId The proposal to cancel
     */
    function cancelProposal(uint256 proposalId) external {
        require(proposalId <= proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );
        require(proposal.state == ProposalState.Active, "Proposal not active");
        
        proposal.state = ProposalState.Canceled;
        emit ProposalCanceled(proposalId);
    }
    
    /**
     * @dev Get proposal state
     * @param proposalId The proposal ID
     */
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        require(proposalId <= proposalCount, "Invalid proposal");
        return proposals[proposalId].state;
    }
    
    /**
     * @dev Update voting period (governance only)
     * @param newPeriod New voting period in seconds
     */
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 days && newPeriod <= 30 days, "Invalid period");
        votingPeriod = newPeriod;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * @dev Integer square root (Babylonian method).
     */
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
