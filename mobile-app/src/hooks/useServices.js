/**
 * useServices Hook - Convenient access to all CIVITAS services
 * Usage: const { sendCIV, uploadFile, getBalance } = useServices();
 */

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import layer2Service from '../services/layer2Service';

export const useServices = () => {
  const {
    wallet,
    balance,
    isConnected,
    reputation,
    sendCIV,
    createDID,
    issueCredential,
    uploadToIPFS,
    downloadFromIPFS,
    createProposal,
    voteOnProposal,
    refreshData,
    web3Service,
    contractService,
    ipfsService,
    blockchainService,
  } = useApp();

  /**
   * Get current balance
   */
  const getBalance = useCallback(async (address = null) => {
    if (!address && wallet) {
      return balance;
    }
    return await contractService.getCIVBalance(address || wallet?.address);
  }, [wallet, balance]);

  /**
   * Send transaction
   */
  const sendTransaction = useCallback(async (to, amount) => {
    return await sendCIV(to, amount);
  }, [sendCIV]);

  /**
   * Upload file to IPFS with encryption
   */
  const uploadFile = useCallback(async (fileUri, metadata) => {
    return await uploadToIPFS(fileUri, metadata, true);
  }, [uploadToIPFS]);

  /**
   * Download file from IPFS
   */
  const downloadFile = useCallback(async (cid, encryptionKey) => {
    return await downloadFromIPFS(cid, encryptionKey);
  }, [downloadFromIPFS]);

  /**
   * Get user reputation
   */
  const getReputation = useCallback(async (address = null) => {
    if (!address && wallet) {
      return reputation;
    }
    return await contractService.getReputation(address || wallet?.address);
  }, [wallet, reputation]);

  /**
   * Get network statistics
   */
  const getNetworkStats = useCallback(async () => {
    return await blockchainService.getNetworkStats();
  }, []);

  /**
   * Get validators list
   */
  const getValidators = useCallback(async (limit = 20) => {
    return await blockchainService.getValidators(limit);
  }, []);

  /**
   * Get user analytics
   */
  const getUserAnalytics = useCallback(async (address = null) => {
    return await blockchainService.getUserAnalytics(address || wallet?.address);
  }, [wallet]);

  /**
   * Get global analytics
   */
  const getGlobalAnalytics = useCallback(async () => {
    return await blockchainService.getGlobalAnalytics();
  }, []);

  /**
   * Get transaction history
   */
  const getTransactionHistory = useCallback(async (address = null, page = 1) => {
    return await blockchainService.getUserTransactions(
      address || wallet?.address,
      page,
      20
    );
  }, [wallet]);

  /**
   * Create new DID
   */
  const createNewDID = useCallback(async (didData) => {
    return await createDID(didData);
  }, [createDID]);

  /**
   * Issue new credential
   */
  const issueNewCredential = useCallback(async (subjectDID, type, data) => {
    return await issueCredential(subjectDID, type, data);
  }, [issueCredential]);

  /**
   * Verify credential
   */
  const verifyCredential = useCallback(async (credentialId) => {
    return await contractService.verifyCredential(credentialId);
  }, []);

  /**
   * Create governance proposal
   */
  const createNewProposal = useCallback(async (title, description) => {
    return await createProposal(title, description);
  }, [createProposal]);

  /**
   * Vote on governance proposal
   */
  const vote = useCallback(async (proposalId, support) => {
    return await voteOnProposal(proposalId, support);
  }, [voteOnProposal]);

  /**
   * Get proposal details
   */
  const getProposal = useCallback(async (proposalId) => {
    return await contractService.getProposal(proposalId);
  }, []);

  /**
   * Check if user has voted
   */
  const hasVoted = useCallback(async (proposalId, address = null) => {
    return await contractService.hasVoted(proposalId, address || wallet?.address);
  }, [wallet]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    return await refreshData();
  }, [refreshData]);

  /**
   * Check connection status
   */
  const checkConnection = useCallback(() => {
    return isConnected && wallet !== null;
  }, [isConnected, wallet]);

  /**
   * Get carbon offset data
   */
  const getCarbonOffsetData = useCallback(async (address = null) => {
    return await blockchainService.getCarbonOffsetData(address || wallet?.address);
  }, [wallet]);

  // ── Staking ──────────────────────────────────────────────────────────────
  const stakeTokens = useCallback(async (amount) => {
    return await contractService.stakeTokens(amount);
  }, [contractService]);

  const unstakeTokens = useCallback(async (positionId) => {
    return await contractService.unstakeTokens(positionId);
  }, [contractService]);

  const claimStakingRewards = useCallback(async (positionId) => {
    return await contractService.claimStakingRewards(positionId);
  }, [contractService]);

  const getStakerPositions = useCallback(async (address = null) => {
    return await contractService.getStakerPositions(address || wallet?.address);
  }, [wallet, contractService]);

  // ── Airdrop ───────────────────────────────────────────────────────────────
  const claimAirdrop = useCallback(async (amount, merkleProof) => {
    return await contractService.claimAirdrop(amount, merkleProof);
  }, [contractService]);

  const claimRegionalAirdrop = useCallback(async (amount, region, merkleProof) => {
    return await contractService.claimRegionalAirdrop(amount, region, merkleProof);
  }, [contractService]);

  const hasClaimedAirdrop = useCallback(async (address = null) => {
    return await contractService.hasClaimedAirdrop(address || wallet?.address);
  }, [wallet, contractService]);

  const getAirdropRoundInfo = useCallback(async () => {
    return await contractService.getAirdropRoundInfo();
  }, [contractService]);

  // ── Social Recovery ───────────────────────────────────────────────────────
  const registerRecoveryAccount = useCallback(async (guardians, threshold) => {
    return await contractService.registerRecoveryAccount(guardians, threshold);
  }, [contractService]);

  const initiateAccountRecovery = useCallback(async (lostAccount, newOwner) => {
    return await contractService.initiateRecovery(lostAccount, newOwner);
  }, [contractService]);

  const approveAccountRecovery = useCallback(async (lostAccount) => {
    return await contractService.approveRecovery(lostAccount);
  }, [contractService]);

  const executeAccountRecovery = useCallback(async (lostAccount) => {
    return await contractService.executeRecovery(lostAccount);
  }, [contractService]);

  const getRecoveryStatus = useCallback(async (account) => {
    return await contractService.getRecoveryStatus(account);
  }, [contractService]);

  // ── MultiSig Treasury ─────────────────────────────────────────────────────
  const proposeTreasuryETH = useCallback(async (to, amount, description) => {
    return await contractService.proposeTreasuryETH(to, amount, description);
  }, [contractService]);

  const proposeTreasuryToken = useCallback(async (token, to, amount, description) => {
    return await contractService.proposeTreasuryToken(token, to, amount, description);
  }, [contractService]);

  const confirmTreasuryProposal = useCallback(async (proposalId) => {
    return await contractService.confirmTreasuryProposal(proposalId);
  }, [contractService]);

  const executeTreasuryProposal = useCallback(async (proposalId) => {
    return await contractService.executeTreasuryProposal(proposalId);
  }, [contractService]);

  // ── Smart Escrow ──────────────────────────────────────────────────────────
  const createEscrow = useCallback(async (seller, amount, description) => {
    return await contractService.createEscrow(seller, amount, description);
  }, [contractService]);

  const releaseEscrow = useCallback(async (escrowId) => {
    return await contractService.releaseEscrow(escrowId);
  }, [contractService]);

  // ── ZK Verifier ───────────────────────────────────────────────────────────
  const submitZKProof = useCallback(async (proofHash, proofType, proofData) => {
    return await contractService.submitZKProof(proofHash, proofType, proofData);
  }, [contractService]);

  const verifyZKProof = useCallback(async (proofId) => {
    return await contractService.verifyZKProof(proofId);
  }, [contractService]);

  return {
    // Wallet & Balance
    wallet,
    balance,
    isConnected,
    getBalance,
    checkConnection,

    // Transactions
    sendTransaction,
    getTransactionHistory,

    // Identity & Reputation
    reputation,
    getReputation,
    createNewDID,
    issueNewCredential,
    verifyCredential,

    // Storage
    uploadFile,
    downloadFile,

    // Governance
    createNewProposal,
    vote,
    getProposal,
    hasVoted,

    // Analytics
    getNetworkStats,
    getValidators,
    getUserAnalytics,
    getGlobalAnalytics,
    getCarbonOffsetData,

    // Utility
    refresh,

    // Staking
    stakeTokens,
    unstakeTokens,
    claimStakingRewards,
    getStakerPositions,

    // Airdrop
    claimAirdrop,
    claimRegionalAirdrop,
    hasClaimedAirdrop,
    getAirdropRoundInfo,

    // Social Recovery
    registerRecoveryAccount,
    initiateAccountRecovery,
    approveAccountRecovery,
    executeAccountRecovery,
    getRecoveryStatus,

    // MultiSig Treasury
    proposeTreasuryETH,
    proposeTreasuryToken,
    confirmTreasuryProposal,
    executeTreasuryProposal,

    // Smart Escrow
    createEscrow,
    releaseEscrow,

    // ZK Verifier
    submitZKProof,
    verifyZKProof,

    // Layer-2 / zk-Rollup
    queueL2Transaction: (txData) => layer2Service.queueTransaction(txData),
    flushL2Batch:       ()       => layer2Service.flushBatch(),
    getL2BatchStatus:   (id)     => layer2Service.getBatchStatus(id),
    estimateL2Fee:      (txData) => layer2Service.estimateL2Fee(txData),
    getL2Stats:         ()       => layer2Service.getStats(),
    getAllL2Batches:     ()       => layer2Service.getAllBatches(),

    // Direct service access (for advanced usage)
    services: {
      web3: web3Service,
      contracts: contractService,
      ipfs: ipfsService,
      blockchain: blockchainService,
      layer2: layer2Service,
    },
  };
};

export default useServices;
