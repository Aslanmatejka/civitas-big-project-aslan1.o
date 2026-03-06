/**
 * Contract Service - Smart contract interaction layer
 * Handles all interactions with CIVITAS smart contracts
 */

import { ethers } from 'ethers';
import web3Service from './web3Service';

// Contract ABIs (simplified for mobile - full ABIs in production)
const CIV_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

const DID_REGISTRY_ABI = [
  'function createDID(bytes32 didIdentifier, string didDocument)',
  'function updateDID(bytes32 didIdentifier, string didDocument)',
  'function updateProfile(bytes32 didIdentifier, string profileCID)',
  'function deactivateDID(bytes32 didIdentifier)',
  'function issueCredential(bytes32 didIdentifier, bytes32 credentialHash, uint256 expiresAt)',
  'function revokeCredential(bytes32 didIdentifier, uint256 credentialIndex)',
  'function getDID(bytes32 didIdentifier) view returns (tuple(address controller, string profileCID, string didDocument, uint256 createdAt, uint256 updatedAt, bool active, uint256 reputation))',
  'function getCredentials(bytes32 didIdentifier) view returns (tuple(bytes32 credentialHash, address issuer, uint256 issuedAt, uint256 expiresAt, bool revoked)[])',
  'function verifyDID(bytes32 didIdentifier, uint256 minReputation) view returns (bool)',
  'function hasDID(address account) view returns (bool)',
  'function getDIDByAddress(address account) view returns (bytes32)',
  'function updateReputation(bytes32 didIdentifier, uint256 newReputation)',
  'event DIDCreated(bytes32 indexed didIdentifier, address indexed controller)',
  'event DIDUpdated(bytes32 indexed didIdentifier, string didDocument)',
  'event DIDDeactivated(bytes32 indexed didIdentifier)',
  'event CredentialIssued(bytes32 indexed didIdentifier, bytes32 indexed credentialHash, address indexed issuer)',
  'event ReputationUpdated(bytes32 indexed didIdentifier, uint256 newReputation)',
];

const GOVERNANCE_ABI = [
  'function propose(string title, string description, string ipfsHash) returns (uint256)',
  'function castVote(uint256 proposalId, uint8 support, uint256 tokenAmount, bytes32 didIdentifier)',
  'function executeProposal(uint256 proposalId)',
  'function cancelProposal(uint256 proposalId)',
  'function getProposalState(uint256 proposalId) view returns (uint8)',
  'function proposalCount() view returns (uint256)',
  'function votingPeriod() view returns (uint256)',
  'function getDecayedWeight(uint256 proposalId, uint256 tokenAmount, uint256 reputation) view returns (uint256, uint256, uint256)',
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint256 votingDeadline)',
  'event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 baseWeight, uint256 decayedWeight, uint256 decayFactorBps)',
  'event ProposalExecuted(uint256 indexed proposalId)',
  'event ProposalCanceled(uint256 indexed proposalId)',
];

const WALLET_ABI = [
  'function initialize(address[] owners, uint256 threshold)',
  'function submitTransaction(address to, uint256 value, bytes data) returns (uint256)',
  'function confirmTransaction(uint256 txId)',
  'function executeTransaction(uint256 txId)',
  'function revokeConfirmation(uint256 txId)',
  'function addGuardian(address guardian)',
  'function removeGuardian(address guardian)',
  'function initiateRecovery(address newOwner)',
  'function executeRecovery()',
  'function getTransaction(uint256 txId) view returns (tuple(address to, uint256 value, bytes data, bool executed, uint256 confirmations))',
  'event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value)',
  'event TransactionConfirmed(uint256 indexed txId, address indexed confirmer)',
  'event TransactionExecuted(uint256 indexed txId)',
];

const ESCROW_ABI = [
  'function createEscrowETH(address seller, string description, string ipfsTermsCID, address arbitrator) payable returns (uint256)',
  'function createEscrowCIV(address seller, uint256 amount, string description, string ipfsTermsCID, address arbitrator) returns (uint256)',
  'function markDelivered(uint256 id)',
  'function confirmReceipt(uint256 id)',
  'function claimAutoRefund(uint256 id)',
  'function openDispute(uint256 id)',
  'function resolveDispute(uint256 id, bool buyerWins)',
  'function cancelEscrow(uint256 id)',
  'function registerArbitrator(uint256 stakeAmount)',
  'function getEscrow(uint256 id) view returns (uint256, address, address, uint256, uint8, uint8, string, uint256, uint256, address)',
  'function getUserEscrows(address user) view returns (uint256[])',
  'function approvedArbitrators(address) view returns (bool)',
  'event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, uint256 amount, uint8 paymentType)',
  'event EscrowReleased(uint256 indexed id, address indexed buyer)',
  'event EscrowDisputed(uint256 indexed id, address indexed initiator)',
  'event EscrowResolved(uint256 indexed id, bool buyerWins, address arbitrator)',
];

const NODE_REGISTRY_ABI = [
  'function registerNode(string peerId, string endpoint, string region, uint256 storageCapacityGB, uint256 stakeAmount, string ipfsProfileCID) returns (uint256)',
  'function claimRewards(uint256 nodeId)',
  'function initiateUnstake(uint256 nodeId)',
  'function completeUnstake(uint256 nodeId)',
  'function getNode(uint256 nodeId) view returns (tuple(uint256 id, address operator, string peerId, string endpoint, string region, uint256 storageCapacityGB, uint256 stake, uint8 state, uint8 tier, uint256 uptimeScore, uint256 totalRewardsClaimed, uint256 pendingRewards, uint256 registeredAt, uint256 lastUptimeUpdate, uint256 unstakeInitiatedAt, string ipfsProfileCID))',
  'function getNodeByOperator(address operator) view returns (tuple)',
  'function isActiveNode(address operator) view returns (bool)',
  'function nodeCount() view returns (uint256)',
  'function activeNodeCount() view returns (uint256)',
  'event NodeRegistered(uint256 indexed nodeId, address indexed operator, string peerId, uint8 tier)',
  'event RewardsClaimed(uint256 indexed nodeId, uint256 amount)',
];

const STAKING_ABI = [
  'function stake(uint256 amount)',
  'function initiateUnstake(uint256 amount)',
  'function completeUnstake()',
  'function claimRewards()',
  'function earned(address user) view returns (uint256)',
  'function getReputationMultiplier(address user) view returns (uint256)',
  'function isAntiSybilVerified(address user) view returns (bool)',
  'function getStakerInfo(address user) view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
  'function totalStaked() view returns (uint256)',
  'function stakers(address) view returns (uint256 staked, uint256 pendingRewards, uint256 rewardDebt, uint256 stakedAt, uint256 unstakeInitiatedAt, uint256 unstakePendingAmount)',
  'event Staked(address indexed user, uint256 amount)',
  'event UnstakeInitiated(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
  'event Slashed(address indexed user, uint256 amount, string reason)',
];

const AUTOMATION_ABI = [
  'function registerTask(string name, tuple(uint8 triggerType, uint256 scheduleInterval, uint256 nextExecutionTime, address watchedToken, uint256 thresholdValue, bool triggerAbove) trigger, tuple(uint8 actionType, address target, uint256 amount, bytes callData, bytes32 notificationHash) action, uint256 maxExecutions, string ipfsMetaCID) returns (uint256)',
  'function executeTask(uint256 id)',
  'function manualExecute(uint256 id)',
  'function pauseTask(uint256 id)',
  'function resumeTask(uint256 id)',
  'function cancelTask(uint256 id)',
  'function getTask(uint256 id) view returns (tuple(uint256 id, address owner, string name, uint8 state, tuple triggerConfig, tuple actionConfig, uint256 executionCount, uint256 maxExecutions, uint256 createdAt, uint256 updatedAt, uint256 lastExecutedAt, string ipfsMetaCID))',
  'function getUserTasks(address user) view returns (uint256[])',
  'function isTaskDue(uint256 id) view returns (bool)',
  'event TaskRegistered(uint256 indexed id, address indexed owner, string name, uint8 trigger, uint8 action)',
  'event TaskExecuted(uint256 indexed id, address indexed keeper, uint256 timestamp)',
  'event TaskCancelled(uint256 indexed id, address indexed owner)',
];

const SOCIAL_RECOVERY_ABI = [
  'function registerAccount(address[] guardians, uint256 threshold)',
  'function addGuardian(address guardian)',
  'function removeGuardian(address guardian)',
  'function setThreshold(uint256 newThreshold)',
  'function initiateRecovery(address account, address newOwner)',
  'function approveRecovery(address account)',
  'function executeRecovery(address account)',
  'function cancelRecovery(address account)',
  'function getOwner(address account) view returns (address)',
  'function getAccountConfig(address account) view returns (uint256 threshold, uint256 guardianCount)',
  'function getRecoveryStatus(address account) view returns (address proposedOwner, uint256 initiatedAt, uint256 approvalsCount, uint256 readyAt, bool executed, bool cancelled, bool windowExpired)',
  'event AccountRegistered(address indexed account, address[] guardians, uint256 threshold)',
  'event RecoveryInitiated(address indexed account, address indexed proposedOwner, address indexed initiator)',
  'event RecoveryApproved(address indexed account, address indexed guardian, uint256 approvalsCount)',
  'event RecoveryExecuted(address indexed account, address indexed newOwner)',
  'event RecoveryCancelled(address indexed account, address indexed cancelledBy)',
];

const MULTISIG_TREASURY_ABI = [
  'function proposeETH(address to, uint256 value, string description) returns (uint256)',
  'function proposeToken(address to, address token, uint256 amount, string description) returns (uint256)',
  'function proposeCall(address to, uint256 value, bytes data, string description) returns (uint256)',
  'function confirm(uint256 txId)',
  'function revokeConfirmation(uint256 txId)',
  'function revokeTransaction(uint256 txId)',
  'function execute(uint256 txId)',
  'function pause()',
  'event TxProposed(uint256 indexed txId, address indexed proposer, address to, uint256 value, address token, uint256 tokenAmount)',
  'event TxConfirmed(uint256 indexed txId, address indexed owner, uint256 confirmations)',
  'event TxReady(uint256 indexed txId, uint256 executableAfter)',
  'event TxExecuted(uint256 indexed txId, address indexed executor)',
  'event TxRevoked(uint256 indexed txId, address indexed revoker)',
];

const AIRDROP_ABI = [
  'function createRound(bytes32 merkleRoot, uint256 totalAmount, uint8 mode, bool requireDID) returns (uint256)',
  'function closeRound(uint256 roundId)',
  'function setDIDRegistry(address registry)',
  'function claim(uint256 roundId, uint256 amount, bytes32[] proof)',
  'function claimRegional(uint256 roundId, uint256 amount, bytes32[] proof)',
  'function claimVested()',
  'function sweepUnclaimed(uint256 roundId)',
  'function claimableVested(address user) view returns (uint256)',
  'function roundCount() view returns (uint256)',
  'event RoundCreated(uint256 indexed roundId, bytes32 merkleRoot, uint256 totalAmount, uint8 mode)',
  'event Claimed(uint256 indexed roundId, address indexed claimant, uint256 amount, bool regional)',
  'event VestingClaimed(address indexed claimant, uint256 amount, uint256 remaining)',
  'event UnclamedSwept(uint256 indexed roundId, uint256 amount)',
];

const ZK_VERIFIER_ABI = [
  'function verifyAndRecord(uint8 proofType, tuple(tuple(uint256 X, uint256 Y) A, tuple(uint256[2] X, uint256[2] Y) B, tuple(uint256 X, uint256 Y) C) proof, uint256[] publicInputs, uint256 validityDuration) returns (bool)',
  'function adminVerify(address user, uint8 proofType, uint256 validityDuration)',
  'function revokeCredential(address user, uint8 proofType)',
  'function hasValidCredential(address user, uint8 proofType) view returns (bool)',
  'function hasCredentials(address user, uint8[] proofTypes) view returns (bool[])',
  'function isKeyRegistered(uint8 proofType) view returns (bool)',
  'function verifiedCredentials(address, uint8) view returns (bool)',
  'function verificationTimestamp(address, uint8) view returns (uint256)',
  'function verificationExpiry(address, uint8) view returns (uint256)',
  'event ProofVerified(address indexed user, uint8 indexed proofType, bool valid, uint256 expiry)',
  'event CredentialRevoked(address indexed user, uint8 indexed proofType)',
];

// Contract addresses (Hardhat localhost deployment)
const CONTRACT_ADDRESSES = {
  CIV_TOKEN: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  DID_REGISTRY: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  GOVERNANCE: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  WALLET_FACTORY: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  SMART_ESCROW: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  NODE_REGISTRY: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  STAKING_POOL: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  AUTOMATION_ENGINE: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  SOCIAL_RECOVERY: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  MULTISIG_TREASURY: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  AIRDROP_DISTRIBUTOR: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
  ZK_VERIFIER: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
};

class ContractService {
  constructor() {
    this.contracts = {};
  }

  /**
   * Initialize all contract instances
   */
  async initialize() {
    try {
      const provider = web3Service.getProvider();
      const signer = web3Service.getSigner();

      if (!provider) {
        throw new Error('Web3 provider not initialized');
      }

      // Initialize contracts with signer (for write operations) or provider (read-only)
      const contractProvider = signer || provider;

      this.contracts = {
        civToken: new ethers.Contract(CONTRACT_ADDRESSES.CIV_TOKEN, CIV_TOKEN_ABI, contractProvider),
        didRegistry: new ethers.Contract(CONTRACT_ADDRESSES.DID_REGISTRY, DID_REGISTRY_ABI, contractProvider),
        governance: new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE, GOVERNANCE_ABI, contractProvider),
        smartEscrow: new ethers.Contract(CONTRACT_ADDRESSES.SMART_ESCROW, ESCROW_ABI, contractProvider),
        nodeRegistry: new ethers.Contract(CONTRACT_ADDRESSES.NODE_REGISTRY, NODE_REGISTRY_ABI, contractProvider),
        stakingPool: new ethers.Contract(CONTRACT_ADDRESSES.STAKING_POOL, STAKING_ABI, contractProvider),
        automationEngine: new ethers.Contract(CONTRACT_ADDRESSES.AUTOMATION_ENGINE, AUTOMATION_ABI, contractProvider),
        socialRecovery: new ethers.Contract(CONTRACT_ADDRESSES.SOCIAL_RECOVERY, SOCIAL_RECOVERY_ABI, contractProvider),
        multisigTreasury: new ethers.Contract(CONTRACT_ADDRESSES.MULTISIG_TREASURY, MULTISIG_TREASURY_ABI, contractProvider),
        airdropDistributor: new ethers.Contract(CONTRACT_ADDRESSES.AIRDROP_DISTRIBUTOR, AIRDROP_ABI, contractProvider),
        zkVerifier: new ethers.Contract(CONTRACT_ADDRESSES.ZK_VERIFIER, ZK_VERIFIER_ABI, contractProvider),
        // Wallet contract will be user-specific
      };

      console.log('✅ Contracts initialized');
      return true;
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
      return false;
    }
  }

  // ========== CIV TOKEN OPERATIONS ==========

  /**
   * Get CIV token balance
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Balance in CIV
   */
  async getCIVBalance(address) {
    try {
      const balance = await this.contracts.civToken.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Get CIV balance failed:', error);
      return '0';
    }
  }

  /**
   * Transfer CIV tokens
   * @param {string} to - Recipient address
   * @param {string} amount - Amount in CIV
   * @returns {Promise<object>} Transaction receipt
   */
  async transferCIV(to, amount) {
    try {
      const tx = await this.contracts.civToken.transfer(to, ethers.parseEther(amount));
      console.log('📤 CIV transfer sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ CIV transfer confirmed:', receipt.hash);
      
      return {
        hash: receipt.hash,
        from: receipt.from,
        to,
        amount,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ CIV transfer failed:', error);
      throw error;
    }
  }

  /**
   * Approve CIV token spending
   * @param {string} spender - Spender address
   * @param {string} amount - Amount in CIV
   * @returns {Promise<object>} Transaction receipt
   */
  async approveCIV(spender, amount) {
    try {
      const tx = await this.contracts.civToken.approve(spender, ethers.parseEther(amount));
      const receipt = await tx.wait();
      return { hash: receipt.hash, status: 'success' };
    } catch (error) {
      console.error('❌ CIV approval failed:', error);
      throw error;
    }
  }

  /**
   * Get CIV token allowance
   * @param {string} owner - Owner address
   * @param {string} spender - Spender address
   * @returns {Promise<string>} Allowance in CIV
   */
  async getCIVAllowance(owner, spender) {
    try {
      const allowance = await this.contracts.civToken.allowance(owner, spender);
      return ethers.formatEther(allowance);
    } catch (error) {
      console.error('❌ Get allowance failed:', error);
      return '0';
    }
  }

  // ========== DID OPERATIONS ==========

  /**
   * Create a new DID (Decentralized Identifier)
   * @param {object} didData - DID document data
   * @returns {Promise<object>} {didId, txHash}
   */
  async createDID(didData) {
    try {
      const didDocument = JSON.stringify(didData);
      const tx = await this.contracts.didRegistry.createDID(didDocument);
      console.log('📤 DID creation sent:', tx.hash);
      
      const receipt = await tx.wait();
      
      // Extract DID ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contracts.didRegistry.interface.parseLog(log);
          return parsed.name === 'DIDCreated';
        } catch {
          return false;
        }
      });

      const didId = event ? this.contracts.didRegistry.interface.parseLog(event).args.didId : null;

      console.log('✅ DID created:', didId);

      return {
        didId,
        txHash: receipt.hash,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ DID creation failed:', error);
      throw error;
    }
  }

  /**
   * Resolve DID to get DID document
   * @param {string} didId - DID identifier
   * @returns {Promise<object>} DID document
   */
  async resolveDID(didId) {
    try {
      const [document, owner, timestamp, isActive] = await this.contracts.didRegistry.resolveDID(didId);
      
      return {
        document: JSON.parse(document),
        owner,
        timestamp: Number(timestamp),
        isActive,
      };
    } catch (error) {
      console.error('❌ DID resolution failed:', error);
      return null;
    }
  }

  /**
   * Issue a verifiable credential
   * @param {string} subjectDID - Subject's DID
   * @param {string} credentialType - Type of credential
   * @param {object} credentialData - Credential data
   * @returns {Promise<object>} {credentialId, txHash}
   */
  async issueCredential(subjectDID, credentialType, credentialData) {
    try {
      const dataString = JSON.stringify(credentialData);
      const tx = await this.contracts.didRegistry.issueCredential(
        subjectDID,
        credentialType,
        dataString
      );
      
      const receipt = await tx.wait();
      
      // Extract credential ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contracts.didRegistry.interface.parseLog(log);
          return parsed.name === 'CredentialIssued';
        } catch {
          return false;
        }
      });

      const credentialId = event ? this.contracts.didRegistry.interface.parseLog(event).args.credentialId : null;

      console.log('✅ Credential issued:', credentialId);

      return {
        credentialId,
        txHash: receipt.hash,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ Credential issuance failed:', error);
      throw error;
    }
  }

  /**
   * Verify a credential
   * @param {string} credentialId - Credential ID
   * @returns {Promise<object>} Credential verification result
   */
  async verifyCredential(credentialId) {
    try {
      const [isValid, issuer, subjectDID, credType, credData, timestamp] = 
        await this.contracts.didRegistry.verifyCredential(credentialId);
      
      return {
        isValid,
        issuer,
        subjectDID,
        credentialType: credType,
        credentialData: JSON.parse(credData),
        timestamp: Number(timestamp),
      };
    } catch (error) {
      console.error('❌ Credential verification failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Get user reputation score
   * @param {string} address - User address
   * @returns {Promise<number>} Reputation score (0-1000)
   */
  async getReputation(address) {
    try {
      const reputation = await this.contracts.didRegistry.getReputation(address);
      return Number(reputation);
    } catch (error) {
      console.error('❌ Get reputation failed:', error);
      return 0;
    }
  }

  // ========== GOVERNANCE OPERATIONS ==========

  /**
   * Create a governance proposal
   * @param {string} title - Proposal title
   * @param {string} description - Proposal description
   * @param {object} callData - Encoded call data for execution
   * @param {number} executionDelay - Delay in seconds
   * @returns {Promise<object>} {proposalId, txHash}
   */
  async createProposal(title, description, callData = '0x', executionDelay = 86400) {
    try {
      const tx = await this.contracts.governance.createProposal(
        title,
        description,
        callData,
        executionDelay
      );
      
      const receipt = await tx.wait();
      
      // Extract proposal ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contracts.governance.interface.parseLog(log);
          return parsed.name === 'ProposalCreated';
        } catch {
          return false;
        }
      });

      const proposalId = event ? this.contracts.governance.interface.parseLog(event).args.proposalId : null;

      console.log('✅ Proposal created:', proposalId);

      return {
        proposalId: Number(proposalId),
        txHash: receipt.hash,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ Proposal creation failed:', error);
      throw error;
    }
  }

  /**
   * Vote on a proposal
   * @param {number} proposalId - Proposal ID
   * @param {boolean} support - True for yes, false for no
   * @param {number} weight - Voting weight (quadratic)
   * @returns {Promise<object>} Transaction receipt
   */
  async voteOnProposal(proposalId, support, weight = 1) {
    try {
      const tx = await this.contracts.governance.vote(proposalId, support, weight);
      const receipt = await tx.wait();
      
      console.log('✅ Vote cast:', proposalId, support);
      
      return {
        txHash: receipt.hash,
        proposalId,
        support,
        weight,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ Voting failed:', error);
      throw error;
    }
  }

  /**
   * Get proposal details
   * @param {number} proposalId - Proposal ID
   * @returns {Promise<object>} Proposal details
   */
  async getProposal(proposalId) {
    try {
      const proposal = await this.contracts.governance.getProposal(proposalId);
      
      return {
        title: proposal.title,
        description: proposal.description,
        proposer: proposal.proposer,
        startTime: Number(proposal.startTime),
        endTime: Number(proposal.endTime),
        forVotes: Number(proposal.forVotes),
        againstVotes: Number(proposal.againstVotes),
        status: Number(proposal.status),
        callData: proposal.callData,
        executionDelay: Number(proposal.executionDelay),
      };
    } catch (error) {
      console.error('❌ Get proposal failed:', error);
      return null;
    }
  }

  /**
   * Check if user has voted on proposal
   * @param {number} proposalId - Proposal ID
   * @param {string} address - Voter address
   * @returns {Promise<boolean>}
   */
  async hasVoted(proposalId, address) {
    try {
      return await this.contracts.governance.hasVoted(proposalId, address);
    } catch (error) {
      console.error('❌ Check vote status failed:', error);
      return false;
    }
  }

  /**
   * Get voting power of address
   * @param {string} address - Voter address
   * @returns {Promise<number>} Voting power
   */
  async getVotingPower(address) {
    try {
      const power = await this.contracts.governance.getVotingPower(address);
      return Number(power);
    } catch (error) {
      console.error('❌ Get voting power failed:', error);
      return 0;
    }
  }

  // ========== MULTI-SIG WALLET OPERATIONS ==========

  /**
   * Initialize user's multi-sig wallet contract
   * @param {string} walletAddress - User's wallet contract address
   * @returns {Contract} Wallet contract instance
   */
  getWalletContract(walletAddress) {
    const signer = web3Service.getSigner();
    return new ethers.Contract(walletAddress, WALLET_ABI, signer);
  }

  /**
   * Submit transaction to multi-sig wallet
   * @param {string} walletAddress - Wallet contract address
   * @param {string} to - Destination address
   * @param {string} value - Amount in CIV
   * @param {string} data - Transaction data
   * @returns {Promise<object>} {txId, txHash}
   */
  async submitWalletTransaction(walletAddress, to, value, data = '0x') {
    try {
      const wallet = this.getWalletContract(walletAddress);
      const tx = await wallet.submitTransaction(to, ethers.parseEther(value), data);
      const receipt = await tx.wait();
      
      // Extract transaction ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = wallet.interface.parseLog(log);
          return parsed.name === 'TransactionSubmitted';
        } catch {
          return false;
        }
      });

      const txId = event ? wallet.interface.parseLog(event).args.txId : null;

      return {
        txId: Number(txId),
        txHash: receipt.hash,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ Submit wallet transaction failed:', error);
      throw error;
    }
  }

  /**
   * Confirm multi-sig transaction
   * @param {string} walletAddress - Wallet contract address
   * @param {number} txId - Transaction ID
   * @returns {Promise<object>} Transaction receipt
   */
  async confirmWalletTransaction(walletAddress, txId) {
    try {
      const wallet = this.getWalletContract(walletAddress);
      const tx = await wallet.confirmTransaction(txId);
      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash,
        txId,
        status: 'success',
      };
    } catch (error) {
      console.error('❌ Confirm transaction failed:', error);
      throw error;
    }
  }
  // ========== SMART ESCROW ==========

  async createEscrow(seller, amount, description) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.smartEscrow.createEscrow(seller, amountWei, description, { value: amountWei });
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ createEscrow failed:', error); throw error; }
  }

  async releaseEscrow(escrowId) {
    try {
      const tx = await this.contracts.smartEscrow.releaseEscrow(escrowId);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ releaseEscrow failed:', error); throw error; }
  }

  async getEscrow(escrowId) {
    try {
      return await this.contracts.smartEscrow.getEscrow(escrowId);
    } catch (error) { console.error('❌ getEscrow failed:', error); throw error; }
  }

  // ========== NODE REGISTRY ==========

  async registerNode(nodeUrl, nodeType) {
    try {
      const tx = await this.contracts.nodeRegistry.registerNode(nodeUrl, nodeType);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ registerNode failed:', error); throw error; }
  }

  async getActiveNodes() {
    try {
      return await this.contracts.nodeRegistry.getActiveNodes();
    } catch (error) { console.error('❌ getActiveNodes failed:', error); throw error; }
  }

  // ========== STAKING POOL ==========

  async stakeTokens(amount) {
    try {
      await this.approveCIV(CONTRACT_ADDRESSES.STAKING_POOL, amount);
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.stakingPool.stake(amountWei);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ stakeTokens failed:', error); throw error; }
  }

  async unstakeTokens(positionId) {
    try {
      const tx = await this.contracts.stakingPool.unstake(positionId);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ unstakeTokens failed:', error); throw error; }
  }

  async claimStakingRewards(positionId) {
    try {
      const tx = await this.contracts.stakingPool.claimRewards(positionId);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ claimRewards failed:', error); throw error; }
  }

  async getStakerPositions(address) {
    try {
      return await this.contracts.stakingPool.getStakerPositions(address);
    } catch (error) { console.error('❌ getStakerPositions failed:', error); throw error; }
  }

  // ========== AUTOMATION ENGINE ==========

  async createAutomationTask(name, callData, intervalSeconds, maxExecutions) {
    try {
      const tx = await this.contracts.automationEngine.createTask(name, callData, intervalSeconds, maxExecutions);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ createAutomationTask failed:', error); throw error; }
  }

  async cancelAutomationTask(taskId) {
    try {
      const tx = await this.contracts.automationEngine.cancelTask(taskId);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ cancelAutomationTask failed:', error); throw error; }
  }

  async getUserTasks(address) {
    try {
      return await this.contracts.automationEngine.getUserTasks(address);
    } catch (error) { console.error('❌ getUserTasks failed:', error); throw error; }
  }

  // ========== SOCIAL RECOVERY ==========

  async registerRecoveryAccount(guardians, threshold) {
    try {
      const tx = await this.contracts.socialRecovery.registerAccount(guardians, threshold);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ registerRecoveryAccount failed:', error); throw error; }
  }

  async initiateRecovery(lostAccount, newOwner) {
    try {
      const tx = await this.contracts.socialRecovery.initiateRecovery(lostAccount, newOwner);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ initiateRecovery failed:', error); throw error; }
  }

  async approveRecovery(lostAccount) {
    try {
      const tx = await this.contracts.socialRecovery.approveRecovery(lostAccount);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ approveRecovery failed:', error); throw error; }
  }

  async executeRecovery(lostAccount) {
    try {
      const tx = await this.contracts.socialRecovery.executeRecovery(lostAccount);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ executeRecovery failed:', error); throw error; }
  }

  async getRecoveryStatus(account) {
    try {
      return await this.contracts.socialRecovery.getRecoveryStatus(account);
    } catch (error) { console.error('❌ getRecoveryStatus failed:', error); throw error; }
  }

  // ========== MULTISIG TREASURY ==========

  async proposeTreasuryETH(to, amount, description) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.multisigTreasury.proposeETH(to, amountWei, description);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ proposeTreasuryETH failed:', error); throw error; }
  }

  async proposeTreasuryToken(token, to, amount, description) {
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 18);
      const tx = await this.contracts.multisigTreasury.proposeToken(token, to, amountWei, description);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ proposeTreasuryToken failed:', error); throw error; }
  }

  async confirmTreasuryProposal(proposalId) {
    try {
      const tx = await this.contracts.multisigTreasury.confirmProposal(proposalId);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ confirmTreasuryProposal failed:', error); throw error; }
  }

  async executeTreasuryProposal(proposalId) {
    try {
      const tx = await this.contracts.multisigTreasury.executeProposal(proposalId);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ executeTreasuryProposal failed:', error); throw error; }
  }

  // ========== AIRDROP DISTRIBUTOR ==========

  async claimAirdrop(amount, merkleProof) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.airdropDistributor.claimAirdrop(amountWei, merkleProof);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ claimAirdrop failed:', error); throw error; }
  }

  async claimRegionalAirdrop(amount, region, merkleProof) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.airdropDistributor.claimRegionalAirdrop(amountWei, region, merkleProof);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ claimRegionalAirdrop failed:', error); throw error; }
  }

  async hasClaimedAirdrop(address) {
    try {
      return await this.contracts.airdropDistributor.hasClaimed(address);
    } catch (error) { console.error('❌ hasClaimedAirdrop failed:', error); throw error; }
  }

  async getAirdropRoundInfo() {
    try {
      return await this.contracts.airdropDistributor.getRoundInfo();
    } catch (error) { console.error('❌ getAirdropRoundInfo failed:', error); throw error; }
  }

  // ========== ZK VERIFIER ==========

  async submitZKProof(proofHash, proofType, proofData) {
    try {
      const tx = await this.contracts.zkVerifier.submitProof(proofHash, proofType, proofData);
      const receipt = await tx.wait();
      return { txHash: receipt.hash, status: 'success' };
    } catch (error) { console.error('❌ submitZKProof failed:', error); throw error; }
  }

  async verifyZKProof(proofId) {
    try {
      return await this.contracts.zkVerifier.verifyProof(proofId);
    } catch (error) { console.error('❌ verifyZKProof failed:', error); throw error; }
  }
}

// Export singleton instance
const contractService = new ContractService();
export default contractService;
