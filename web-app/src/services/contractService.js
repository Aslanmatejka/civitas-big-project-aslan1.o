import { ethers } from 'ethers';

// Contract ABIs
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

// ── New contract ABIs (Layer 2, 3, 4) ─────────────────────────────────────────

const SMART_ESCROW_ABI = [
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

const AUTOMATION_ENGINE_ABI = [
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
  'event NodeRegistered(uint256 indexed id, address indexed operator, string peerId, uint256 stake)',
  'event RewardsClaimed(uint256 indexed id, address indexed operator, uint256 amount)',
];

const STAKING_POOL_ABI = [
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

const CIVITAS_WALLET_ABI = [
  'function submitTransaction(address _to, uint256 _value, bytes _data)',
  'function confirmTransaction(uint256 _txIndex)',
  'function executeTransaction(uint256 _txIndex)',
  'function addGuardian(address _guardian)',
  'function initiateRecovery(address _newOwner)',
  'function freezeWallet()',
  'function unfreezeWallet()',
  'function getBalance() view returns (uint256)',
  'function isFrozen() view returns (bool)',
  'function owners(uint256) view returns (address)',
  'event WalletFrozen()',
  'event WalletUnfrozen()',
  'event RecoveryInitiated(address indexed newOwner)',
  'event ExecuteTransaction(address indexed owner, uint256 indexed txIndex)',
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
  'event RecoveryReady(address indexed account, address indexed proposedOwner, uint256 executableAfter)',
  'event RecoveryExecuted(address indexed account, address indexed newOwner)',
  'event RecoveryCancelled(address indexed account, address indexed cancelledBy)',
];

const MULTI_SIG_TREASURY_ABI = [
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

const AIRDROP_DISTRIBUTOR_ABI = [
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

// ZK proof type constants (mirrors ZKVerifier.sol)
export const ZK_PROOF_TYPES = {
  AGE_OVER_18:            0,
  INCOME_ABOVE_THRESHOLD: 1,
  KYC_PASSED:             2,
  CITIZENSHIP:            3,
  ACCREDITED_INVESTOR:    4,
  IDENTITY_HASH:          5,
};

// Contract addresses (Hardhat localhost deployment)
// After running `npm run deploy`, these are written to web-app/.env.contracts
// Override with VITE_* env vars in production.
const CONTRACT_ADDRESSES = {
  CIV_TOKEN:            import.meta.env.VITE_CIVTOKEN_ADDRESS              || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  DID_REGISTRY:         import.meta.env.VITE_DIDREGISTRY_ADDRESS            || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  GOVERNANCE:           import.meta.env.VITE_CIVITASGOVERNANCE_ADDRESS      || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  CIVITAS_WALLET:       import.meta.env.VITE_CIVITASWALLET_ADDRESS          || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  SMART_ESCROW:         import.meta.env.VITE_SMARTESCROW_ADDRESS            || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  AUTOMATION_ENGINE:    import.meta.env.VITE_AUTOMATIONENGINE_ADDRESS       || '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  NODE_REGISTRY:        import.meta.env.VITE_NODEREGISTRY_ADDRESS           || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  STAKING_POOL:         import.meta.env.VITE_STAKINGPOOL_ADDRESS            || '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  ZK_VERIFIER:          import.meta.env.VITE_ZKVERIFIER_ADDRESS             || '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
  SOCIAL_RECOVERY:      import.meta.env.VITE_SOCIALRECOVERY_ADDRESS         || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  MULTI_SIG_TREASURY:   import.meta.env.VITE_MULTISIGTREASURY_ADDRESS       || '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  AIRDROP_DISTRIBUTOR:  import.meta.env.VITE_AIRDROPDISTRIBUTOR_ADDRESS     || '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
};

class ContractService {
  constructor() {
    this.contracts = {};
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    try {
      if (window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        console.log('✅ Contract service initialized');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Contract service initialization failed:', error);
      return false;
    }
  }

  async setSigner(signer) {
    this.signer = signer;
    
    // Initialize contracts with signer
    this.contracts = {
      civToken:          new ethers.Contract(CONTRACT_ADDRESSES.CIV_TOKEN,           CIV_TOKEN_ABI,           signer),
      didRegistry:       new ethers.Contract(CONTRACT_ADDRESSES.DID_REGISTRY,        DID_REGISTRY_ABI,        signer),
      governance:        new ethers.Contract(CONTRACT_ADDRESSES.GOVERNANCE,          GOVERNANCE_ABI,          signer),
      civitasWallet:     new ethers.Contract(CONTRACT_ADDRESSES.CIVITAS_WALLET,      CIVITAS_WALLET_ABI,      signer),
      smartEscrow:       new ethers.Contract(CONTRACT_ADDRESSES.SMART_ESCROW,        SMART_ESCROW_ABI,        signer),
      automationEngine:  new ethers.Contract(CONTRACT_ADDRESSES.AUTOMATION_ENGINE,   AUTOMATION_ENGINE_ABI,   signer),
      nodeRegistry:      new ethers.Contract(CONTRACT_ADDRESSES.NODE_REGISTRY,       NODE_REGISTRY_ABI,       signer),
      stakingPool:       new ethers.Contract(CONTRACT_ADDRESSES.STAKING_POOL,        STAKING_POOL_ABI,        signer),
      zkVerifier:        new ethers.Contract(CONTRACT_ADDRESSES.ZK_VERIFIER,         ZK_VERIFIER_ABI,         signer),
      socialRecovery:    new ethers.Contract(CONTRACT_ADDRESSES.SOCIAL_RECOVERY,     SOCIAL_RECOVERY_ABI,     signer),
      multiSigTreasury:  new ethers.Contract(CONTRACT_ADDRESSES.MULTI_SIG_TREASURY,  MULTI_SIG_TREASURY_ABI,  signer),
      airdropDistributor:new ethers.Contract(CONTRACT_ADDRESSES.AIRDROP_DISTRIBUTOR, AIRDROP_DISTRIBUTOR_ABI, signer),
    };

    console.log('✅ Contracts initialized with signer');
  }

  // CIV Token Methods
  async getCIVBalance(address) {
    try {
      if (!this.signer) {
        this.signer = await this.provider.getSigner();
        await this.setSigner(this.signer);
      }

      const balance = await this.contracts.civToken.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Get CIV balance failed:', error);
      return '0';
    }
  }

  async transferCIV(from, to, amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.contracts.civToken.transfer(to, amountWei);
      await tx.wait();
      
      console.log('✅ CIV transfer successful:', tx.hash);
      return tx;
    } catch (error) {
      console.error('❌ Transfer CIV failed:', error);
      throw error;
    }
  }

  // DID Methods
  async createDID(userAddress, didDocument) {
    try {
      const didIdentifier = ethers.id(userAddress.toLowerCase());
      const tx = await this.contracts.didRegistry.createDID(didIdentifier, JSON.stringify(didDocument));
      const receipt = await tx.wait();
      
      console.log('✅ DID created:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ Create DID failed:', error);
      throw error;
    }
  }

  async resolveDID(didId) {
    try {
      const result = await this.contracts.didRegistry.getDID(didId);
      return {
        controller: result.controller,
        profileCID: result.profileCID,
        document: result.didDocument,
        createdAt: result.createdAt.toString(),
        updatedAt: result.updatedAt.toString(),
        active: result.active,
        reputation: Number(result.reputation),
      };
    } catch (error) {
      console.error('❌ Resolve DID failed:', error);
      return null;
    }
  }

  // Governance Methods
  async getReputation(address) {
    try {
      if (this.contracts.didRegistry) {
        const didId = await this.contracts.didRegistry.getDIDByAddress(address);
        if (didId && didId !== ethers.ZeroHash) {
          const did = await this.contracts.didRegistry.getDID(didId);
          return Number(did.reputation);
        }
      }
      return 0;
    } catch (error) {
      console.error('❌ Get reputation failed:', error);
      return 0;
    }
  }

  async createProposal(userAddress, title, description, ipfsHash = '') {
    try {
      const tx = await this.contracts.governance.propose(title, description, ipfsHash);
      const receipt = await tx.wait();
      
      console.log('✅ Proposal created:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ Create proposal failed:', error);
      throw error;
    }
  }

  async vote(userAddress, proposalId, support, tokenAmount = 0, didIdentifier = ethers.ZeroHash) {
    try {
      const voteSupport = support ? 1 : 0; // 0=Against, 1=For, 2=Abstain
      const amount = ethers.parseEther(tokenAmount.toString());
      const tx = await this.contracts.governance.castVote(proposalId, voteSupport, amount, didIdentifier);
      await tx.wait();
      
      console.log('✅ Vote submitted:', tx.hash);
      return tx;
    } catch (error) {
      console.error('❌ Vote failed:', error);
      throw error;
    }
  }

  async getProposal(proposalId) {
    try {
      // Proposals are now cached in backend; on-chain only stores state
      const state = await this.contracts.governance.getProposalState(proposalId);
      return { id: proposalId.toString(), state: Number(state) };
    } catch (error) {
      console.error('❌ Get proposal failed:', error);
      return null;
    }
  }

  async getProposalVotes(proposalId) {
    try {
      // Vote tallies are emitted as events; backend caches them
      return { forVotes: '0', againstVotes: '0' };
    } catch (error) {
      console.error('❌ Get proposal votes failed:', error);
      return { forVotes: '0', againstVotes: '0' };
    }
  }

  async hasVoted(proposalId, address) {
    try {
      // Check via backend or events — on-chain mapping is internal
      return false;
    } catch (error) {
      console.error('❌ Check has voted failed:', error);
      return false;
    }
  }

  // ── SmartEscrow Methods ───────────────────────────────────────────────────

  async createEscrowETH(seller, description, ipfsTermsCID, arbitrator, ethAmount) {
    try {
      const value = ethers.parseEther(ethAmount.toString());
      const tx = await this.contracts.smartEscrow.createEscrowETH(
        seller, description, ipfsTermsCID, arbitrator || ethers.ZeroAddress, { value }
      );
      const receipt = await tx.wait();
      console.log('✅ ETH Escrow created:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('❌ Create ETH escrow failed:', error);
      throw error;
    }
  }

  async createEscrowCIV(seller, amount, description, ipfsTermsCID, arbitrator) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      await this.contracts.civToken.approve(CONTRACT_ADDRESSES.SMART_ESCROW, amountWei);
      const tx = await this.contracts.smartEscrow.createEscrowCIV(
        seller, amountWei, description, ipfsTermsCID, arbitrator || ethers.ZeroAddress
      );
      const receipt = await tx.wait();
      console.log('✅ CIV Escrow created:', receipt.hash);
      return receipt;
    } catch (error) {
      console.error('❌ Create CIV escrow failed:', error);
      throw error;
    }
  }

  async confirmEscrowReceipt(escrowId) {
    try {
      const tx = await this.contracts.smartEscrow.confirmReceipt(escrowId);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Confirm receipt failed:', error);
      throw error;
    }
  }

  async getUserEscrows(address) {
    try {
      return await this.contracts.smartEscrow.getUserEscrows(address);
    } catch (error) {
      console.error('❌ Get user escrows failed:', error);
      return [];
    }
  }

  // ── StakingPool Methods ───────────────────────────────────────────────────

  async stakeCIV(amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      await this.contracts.civToken.approve(CONTRACT_ADDRESSES.STAKING_POOL, amountWei);
      const tx = await this.contracts.stakingPool.stake(amountWei);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Stake CIV failed:', error);
      throw error;
    }
  }

  async getStakerInfo(address) {
    try {
      const info = await this.contracts.stakingPool.getStakerInfo(address);
      return {
        staked:               ethers.formatEther(info[0]),
        pendingRewards:       ethers.formatEther(info[1]),
        stakedAt:             Number(info[2]),
        unstakeInitiatedAt:   Number(info[3]),
        unstakePendingAmount: ethers.formatEther(info[4]),
        reputationMultiplier: Number(info[5]) / 100,
      };
    } catch (error) {
      console.error('❌ Get staker info failed:', error);
      return null;
    }
  }

  async isAntiSybilVerified(address) {
    try {
      return await this.contracts.stakingPool.isAntiSybilVerified(address);
    } catch (error) {
      return false;
    }
  }

  // ── ZKVerifier Methods ────────────────────────────────────────────────────

  async hasValidCredential(address, proofType) {
    try {
      return await this.contracts.zkVerifier.hasValidCredential(address, proofType);
    } catch (error) {
      console.error('❌ ZK credential check failed:', error);
      return false;
    }
  }

  async getUserCredentials(address) {
    try {
      const types = [0, 1, 2, 3, 4, 5];
      const results = await this.contracts.zkVerifier.hasCredentials(address, types);
      return Object.fromEntries(
        Object.entries(ZK_PROOF_TYPES).map(([name, idx]) => [name, results[idx]])
      );
    } catch (error) {
      console.error('❌ Get user credentials failed:', error);
      return {};
    }
  }

  // ── NodeRegistry Methods ──────────────────────────────────────────────────

  async getNodeByOperator(address) {
    try {
      const node = await this.contracts.nodeRegistry.getNodeByOperator(address);
      return {
        id:               Number(node.id),
        peerId:           node.peerId,
        endpoint:         node.endpoint,
        region:           node.region,
        storageCapacityGB: Number(node.storageCapacityGB),
        stake:            ethers.formatEther(node.stake),
        state:            Number(node.state),
        uptimeScore:      Number(node.uptimeScore) / 100,
        pendingRewards:   ethers.formatEther(node.pendingRewards),
        totalRewardsClaimed: ethers.formatEther(node.totalRewardsClaimed),
      };
    } catch (error) {
      return null;
    }
  }

  async isActiveNode(address) {
    try {
      return await this.contracts.nodeRegistry.isActiveNode(address);
    } catch (error) {
      return false;
    }
  }

  // ── AutomationEngine Methods ──────────────────────────────────────────────

  async getUserTasks(address) {
    try {
      return await this.contracts.automationEngine.getUserTasks(address);
    } catch (error) {
      console.error('❌ Get user tasks failed:', error);
      return [];
    }
  }

  // ── SocialRecovery Methods ────────────────────────────────────────────────

  async registerRecoveryAccount(guardians, threshold) {
    try {
      const tx = await this.contracts.socialRecovery.registerAccount(guardians, threshold);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Register recovery account failed:', error);
      throw error;
    }
  }

  async initiateRecovery(account, newOwner) {
    try {
      const tx = await this.contracts.socialRecovery.initiateRecovery(account, newOwner);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Initiate recovery failed:', error);
      throw error;
    }
  }

  async approveRecovery(account) {
    try {
      const tx = await this.contracts.socialRecovery.approveRecovery(account);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Approve recovery failed:', error);
      throw error;
    }
  }

  async executeRecovery(account) {
    try {
      const tx = await this.contracts.socialRecovery.executeRecovery(account);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Execute recovery failed:', error);
      throw error;
    }
  }

  async getRecoveryStatus(account) {
    try {
      const [active, proposedOwner, approvals, executableAfter] =
        await this.contracts.socialRecovery.getRecoveryStatus(account);
      return { active, proposedOwner, approvals: Number(approvals), executableAfter: Number(executableAfter) };
    } catch (error) {
      return { active: false, proposedOwner: null, approvals: 0, executableAfter: 0 };
    }
  }

  async getAccountConfig(account) {
    try {
      const [threshold, guardianCount] =
        await this.contracts.socialRecovery.getAccountConfig(account);
      return { threshold: Number(threshold), guardianCount: Number(guardianCount) };
    } catch (error) {
      return { threshold: 0, guardianCount: 0 };
    }
  }

  // ── MultiSigTreasury Methods ──────────────────────────────────────────────

  async proposeTreasuryETH(to, value, description) {
    try {
      const tx = await this.contracts.multiSigTreasury.proposeETH(to, ethers.parseEther(String(value)), description);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Propose treasury ETH failed:', error);
      throw error;
    }
  }

  async proposeTreasuryToken(to, token, amount, description) {
    try {
      const tx = await this.contracts.multiSigTreasury.proposeToken(to, token, ethers.parseEther(String(amount)), description);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Propose treasury token failed:', error);
      throw error;
    }
  }

  async confirmTreasuryTx(txId) {
    try {
      const tx = await this.contracts.multiSigTreasury.confirm(txId);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Confirm treasury tx failed:', error);
      throw error;
    }
  }

  async executeTreasuryTx(txId) {
    try {
      const tx = await this.contracts.multiSigTreasury.execute(txId);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Execute treasury tx failed:', error);
      throw error;
    }
  }

  // ── AirdropDistributor Methods ────────────────────────────────────────────

  async claimAirdrop(roundId, amount, proof) {
    try {
      const tx = await this.contracts.airdropDistributor.claim(roundId, ethers.parseEther(String(amount)), proof);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Claim airdrop failed:', error);
      throw error;
    }
  }

  async claimRegionalAirdrop(roundId, amount, proof) {
    try {
      const tx = await this.contracts.airdropDistributor.claimRegional(roundId, ethers.parseEther(String(amount)), proof);
      return await tx.wait();
    } catch (error) {
      console.error('❌ Claim regional airdrop failed:', error);
      throw error;
    }
  }

  async claimVestedAirdrop() {
    try {
      const tx = await this.contracts.airdropDistributor.claimVested();
      return await tx.wait();
    } catch (error) {
      console.error('❌ Claim vested airdrop failed:', error);
      throw error;
    }
  }

  async getClaimableVested(address) {
    try {
      const amount = await this.contracts.airdropDistributor.claimableVested(address);
      return ethers.formatEther(amount);
    } catch (error) {
      return '0';
    }
  }

  async getAirdropRoundCount() {
    try {
      return Number(await this.contracts.airdropDistributor.roundCount());
    } catch (error) {
      return 0;
    }
  }

  // ── CIVITASWallet Methods ─────────────────────────────────────────────────

  async getWalletBalance() {
    try {
      const balance = await this.contracts.civitasWallet.getBalance();
      return ethers.formatEther(balance);
    } catch (error) {
      return '0';
    }
  }

  async isWalletFrozen() {
    try {
      return await this.contracts.civitasWallet.isFrozen();
    } catch (error) {
      return false;
    }
  }

  async freezeWallet() {
    try {
      const tx = await this.contracts.civitasWallet.freezeWallet();
      return await tx.wait();
    } catch (error) {
      console.error('❌ Freeze wallet failed:', error);
      throw error;
    }
  }

  async unfreezeWallet() {
    try {
      const tx = await this.contracts.civitasWallet.unfreezeWallet();
      return await tx.wait();
    } catch (error) {
      console.error('❌ Unfreeze wallet failed:', error);
      throw error;
    }
  }

  // ── Marketplace convenience wrappers ──────────────────────────────────────

  /**
   * Purchase an item by creating an ETH escrow with the seller.
   * Called by AppContext.purchaseListing.
   */
  async purchaseItem(buyerAddress, listingId, priceEth) {
    try {
      console.log(`📤 Creating escrow for listing ${listingId}, price: ${priceEth} ETH`);
      const receipt = await this.createEscrowETH(
        buyerAddress,                    // seller will be set by backend; use buyer as placeholder
        `Marketplace purchase: listing #${listingId}`,
        '',                              // ipfsTermsCID
        ethers.ZeroAddress,              // no arbitrator
        priceEth
      );
      return receipt;
    } catch (error) {
      console.error('❌ Purchase item failed:', error);
      throw error;
    }
  }

  /**
   * Release escrow by confirming receipt.
   * Called by AppContext.completeOrder.
   */
  async releaseEscrow(userAddress, escrowId) {
    try {
      console.log(`📤 Releasing escrow #${escrowId}`);
      return await this.confirmEscrowReceipt(escrowId);
    } catch (error) {
      console.error('❌ Release escrow failed:', error);
      throw error;
    }
  }
}

export default ContractService;

// ── Singleton instance for named imports ────────────────────────────────────
const _instance = new ContractService();

// Social Recovery
export const registerRecoveryAccount = (...args) => _instance.registerRecoveryAccount(...args);
export const initiateRecovery        = (...args) => _instance.initiateRecovery(...args);
export const approveRecovery         = (...args) => _instance.approveRecovery(...args);
export const executeRecovery         = (...args) => _instance.executeRecovery(...args);
export const getRecoveryStatus       = (...args) => _instance.getRecoveryStatus(...args);
export const getAccountConfig        = (...args) => _instance.getAccountConfig(...args);

// MultiSig Treasury
export const proposeTreasuryETH   = (...args) => _instance.proposeTreasuryETH(...args);
export const proposeTreasuryToken = (...args) => _instance.proposeTreasuryToken(...args);
export const confirmTreasuryTx    = (...args) => _instance.confirmTreasuryTx(...args);
export const executeTreasuryTx    = (...args) => _instance.executeTreasuryTx(...args);
