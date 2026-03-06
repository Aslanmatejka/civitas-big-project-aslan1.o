import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import Web3Service from '../services/web3Service';
import ContractService from '../services/contractService';
import walletService from '../services/walletService';
import { walletApi, identityApi, governanceApi, marketplaceApi, profileApi, dashboardApi, communityApi, analyticsApi } from '../services/api';
import xmtpService from '../services/xmtpService';
import layer2Service from '../services/layer2Service';
import WalletSetupModal from '../components/WalletSetupModal';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('0');
  const [reputation, setReputation] = useState(0);
  const [networkStats, setNetworkStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [did, setDid] = useState(null);
  const [isXMTPReady, setIsXMTPReady] = useState(false);

  // Wallet setup modal state
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [walletSetupLoading, setWalletSetupLoading] = useState(false);
  const [walletSetupStep, setWalletSetupStep] = useState('');
  const [pendingMnemonic, setPendingMnemonic] = useState('');

  // Stable service instances — must NOT be recreated on re-render or
  // the provider/signer state set during initialize() would be lost.
  const web3Service = useMemo(() => new Web3Service(), []);
  const contractService = useMemo(() => new ContractService(), []);

  useEffect(() => {
    initializeApp();
    setupEventListeners();
    
    return () => {
      // Cleanup event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const setupEventListeners = () => {
    if (!window.ethereum) return;

    // Handle account changes
    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnectWallet();
      } else if (accounts[0].toLowerCase() !== wallet?.address?.toLowerCase()) {
        // User switched accounts
        try {
          await web3Service.connectWallet(accounts[0]);
          setWallet({ address: accounts[0] });
          setIsConnected(true);
          localStorage.setItem('walletAddress', accounts[0]);
          await loadUserData(accounts[0]);
          console.log('✅ Account switched to:', accounts[0]);
        } catch (error) {
          console.error('❌ Failed to switch account:', error);
        }
      }
    });

    // Handle chain changes
    window.ethereum.on('chainChanged', async (chainId) => {
      console.log('⚠️ Chain changed to:', chainId);
      // Re-initialize services
      await web3Service.initialize();
      await contractService.initialize();
      if (wallet?.address) {
        await loadUserData(wallet.address);
      }
    });
  };

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing CIVITAS Web App...');
      await web3Service.initialize();
      await contractService.initialize();
      
      // Check if wallet was previously connected
      const savedAddress = localStorage.getItem('walletAddress');
      if (savedAddress && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Failed to restore wallet:', error);
        }
      }

      setIsLoading(false);
      console.log('✅ App initialized');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask or another Web3 wallet to use this app.');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      await web3Service.connectWallet(address);
      
      setWallet({ address });
      setIsConnected(true);
      localStorage.setItem('walletAddress', address);

      await loadUserData(address);

      // Register wallet with backend
      try {
        const balance = await contractService.getCIVBalance(address);
        await walletApi.connectWallet(address, balance, address.slice(0, 8));
        
        // Initialize XMTP for decentralized messaging
        try {
          const signer = web3Service.getSigner();
          await xmtpService.initialize(signer);
          setIsXMTPReady(true);
          console.log('✅ XMTP messaging initialized');
        } catch (xmtpError) {
          console.warn('⚠️ XMTP initialization failed:', xmtpError.message);
          setIsXMTPReady(false);
        }

        // Initialize Layer-2 / zk-Rollup service
        try {
          const signer = web3Service.getSigner();
          await layer2Service.init(signer);
          console.log('✅ Layer-2 service initialized');
        } catch (l2Error) {
          console.warn('⚠️ Layer-2 init failed (non-critical):', l2Error.message);
        }
        
        console.log('✅ Wallet registered with backend');
      } catch (backendError) {
        console.warn('⚠️ Backend registration failed (backend may be offline):', backendError.message);
      }

      console.log('✅ Wallet connected:', address);
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    const address = wallet?.address;
    
    setWallet(null);
    setIsConnected(false);
    setBalance('0');
    setReputation(0);
    setIsXMTPReady(false);
    localStorage.removeItem('walletAddress');
    
    // Disconnect from backend
    if (address) {
      try {
        await walletApi.disconnectWallet(address);
        await xmtpService.disconnect();
        console.log('✅ Wallet disconnected from backend');
      } catch (backendError) {
        console.warn('⚠️ Backend disconnect failed:', backendError.message);
      }
    }
    
    console.log('✅ Wallet disconnected');
  };

  // ── Software wallet helpers ───────────────────────────────────────────────

  /**
   * Called by WalletSetupModal when user clicks "Create New Wallet".
   * If password is null it means the user just opened the modal — generate
   * the mnemonic and surface it; the actual encryption happens on confirm.
   */
  const generateNewWallet = async (password) => {
    if (password === null) {
      // Phase 1: just generate and show the mnemonic
      const { mnemonic } = walletService.createRandomWallet();
      setPendingMnemonic(mnemonic);
      return;
    }
    // Phase 2: user confirmed backup and entered password — encrypt + connect
    await _connectSoftwareWallet(
      walletService.importFromMnemonic(pendingMnemonic).wallet,
      password
    );
    setPendingMnemonic('');
  };

  const importWalletFromSeed = async (phrase, password) => {
    const { wallet: ethersWallet } = walletService.importFromMnemonic(phrase);
    await _connectSoftwareWallet(ethersWallet, password);
  };

  const importWalletFromKey = async (key, password) => {
    const { wallet: ethersWallet } = walletService.importFromPrivateKey(key);
    await _connectSoftwareWallet(ethersWallet, password);
  };

  const _connectSoftwareWallet = async (ethersWallet, password) => {
    try {
      setWalletSetupLoading(true);
      setWalletSetupStep('Encrypting wallet…');
      walletService.validatePassword(password);
      await walletService.encryptAndSave(ethersWallet, password, (progress) => {
        setWalletSetupStep(`Encrypting wallet… ${Math.round(progress * 100)}%`);
      });

      setWalletSetupStep('Connecting to network…');
      web3Service.connectSoftwareWallet(ethersWallet);
      await contractService.initialize();

      const address = ethersWallet.address;
      setWallet({ address, type: 'software' });
      setIsConnected(true);
      localStorage.setItem('walletAddress', address);

      await loadUserData(address);

      try {
        const bal = await contractService.getCIVBalance(address);
        await walletApi.connectWallet(address, bal, address.slice(0, 8));
      } catch (e) {
        console.warn('⚠️ Backend registration skipped:', e.message);
      }

      setShowWalletSetup(false);
      setWalletSetupLoading(false);
      console.log('✅ Software wallet connected:', address);
    } catch (error) {
      setWalletSetupLoading(false);
      setWalletSetupStep('');
      throw error;
    }
  };

  /** Try to restore a saved software wallet on page load (requires re-auth via unlock flow) */
  const hasSavedSoftwareWallet = () => walletService.hasStoredWallet() && walletService.isSoftwareWallet();

  const loadUserData = async (address) => {
    try {
      const [civBalance, rep] = await Promise.all([
        contractService.getCIVBalance(address),
        contractService.getReputation(address),
      ]);

      setBalance(civBalance);
      setReputation(rep);

      // Load DID if exists
      const storedDid = localStorage.getItem(`did_${address}`);
      if (storedDid) {
        setDid(JSON.parse(storedDid));
      }
    } catch (error) {
      console.error('❌ Load user data failed:', error);
    }
  };

  const refreshData = useCallback(async () => {
    if (wallet?.address) {
      await loadUserData(wallet.address);
    }
  }, [wallet]);

  const sendCIV = async (toAddress, amount) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      const tx = await contractService.transferCIV(wallet.address, toAddress, amount);
      
      // Record transaction in backend
      try {
        await walletApi.recordTransaction(wallet.address, {
          txHash: tx.hash || tx.transactionHash,
          to: toAddress,
          amount: amount,
          tokenSymbol: 'CIV',
          type: 'send',
          status: 'pending',
          metadata: {
            description: 'CIV Token Transfer'
          }
        });
        console.log('✅ Transaction recorded in backend');
      } catch (backendError) {
        console.warn('⚠️ Failed to record transaction in backend:', backendError.message);
      }
      
      await refreshData();
      return tx;
    } catch (error) {
      console.error('❌ Send CIV failed:', error);
      throw error;
    }
  };

  const createDID = async (didDocument) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      // Create DID on blockchain
      const didId = await contractService.createDID(wallet.address, didDocument);
      
      const newDid = {
        id: didId,
        document: didDocument,
        owner: wallet.address,
      };
      
      setDid(newDid);
      localStorage.setItem(`did_${wallet.address}`, JSON.stringify(newDid));
      
      // Register DID in backend
      try {
        await identityApi.createDID(wallet.address, didId, didDocument);
        console.log('✅ DID registered with backend');
      } catch (backendError) {
        console.warn('⚠️ Backend DID registration failed:', backendError.message);
        // Continue anyway - blockchain DID creation succeeded
      }
      
      return didId;
    } catch (error) {
      console.error('❌ Create DID failed:', error);
      throw error;
    }
  };

  // Load identity data from backend
  const loadIdentity = async (identifier) => {
    try {
      const response = await identityApi.getIdentity(identifier);
      return response.data.identity;
    } catch (error) {
      console.error('❌ Load identity failed:', error);
      return null;
    }
  };

  // Update reputation factor
  const updateReputation = async (factor, change, reason) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      const response = await identityApi.updateReputation(
        wallet.address,
        factor,
        change,
        reason
      );
      
      if (response.data.reputation) {
        setReputation(response.data.reputation.total);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Update reputation failed:', error);
      throw error;
    }
  };

  // Get credentials
  const getCredentials = async () => {
    try {
      if (!wallet?.address) return [];
      
      const response = await identityApi.getCredentials(wallet.address);
      return response.data.credentials || [];
    } catch (error) {
      console.error('❌ Get credentials failed:', error);
      return [];
    }
  };

  // Get activity log
  const getActivityLog = async (limit = 50) => {
    try {
      if (!wallet?.address) return [];
      
      const response = await identityApi.getActivityLog(wallet.address, limit);
      return response.data.activities || [];
    } catch (error) {
      console.error('❌ Get activity log failed:', error);
      return [];
    }
  };

  // Governance functions
  const getProposals = async (status = null) => {
    try {
      const response = await governanceApi.getProposals(status);
      return response.data.proposals || [];
    } catch (error) {
      console.error('❌ Get proposals failed:', error);
      return [];
    }
  };

  const voteOnProposal = async (proposalId, voteType) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      // Map voteType: 'for', 'against', 'abstain'
      const support = voteType === 'for' ? 1 : voteType === 'against' ? 0 : 2;
      
      // Submit blockchain transaction
      const tx = await contractService.vote(wallet.address, proposalId, support);
      
      // Record vote in backend
      try {
        await governanceApi.submitVote({
          proposalId,
          voterAddress: wallet.address,
          voteType,
          transactionHash: tx.hash || tx
        });
        console.log('✅ Vote recorded in backend');
      } catch (backendError) {
        console.warn('⚠️ Backend vote recording failed:', backendError.message);
      }
      
      await refreshData();
      return tx;
    } catch (error) {
      console.error('❌ Vote failed:', error);
      throw error;
    }
  };

  const createProposal = async (proposalData) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      const response = await governanceApi.createProposal({
        ...proposalData,
        proposerAddress: wallet.address
      });
      
      return response.data.proposal;
    } catch (error) {
      console.error('❌ Create proposal failed:', error);
      throw error;
    }
  };

  const getUserVotes = async () => {
    try {
      if (!wallet?.address) return [];
      
      const response = await governanceApi.getUserVotes(wallet.address);
      return response.data.votes || [];
    } catch (error) {
      console.error('❌ Get user votes failed:', error);
      return [];
    }
  };

  // ===============================
  // MARKETPLACE FUNCTIONS
  // ===============================

  const createListing = async (listingData) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      const response = await marketplaceApi.createListing({
        ...listingData,
        sellerAddress: wallet.address
      });
      
      console.log('✅ Listing created');
      return response.data.listing;
    } catch (error) {
      console.error('❌ Create listing failed:', error);
      throw error;
    }
  };

  const getListings = async (filters = {}) => {
    try {
      const response = await marketplaceApi.getListings(filters);
      return response.data.listings || [];
    } catch (error) {
      console.error('❌ Get listings failed:', error);
      return [];
    }
  };

  const getUserListings = async () => {
    try {
      if (!wallet?.address) return [];
      
      const response = await marketplaceApi.getListings({ 
        seller: wallet.address,
        status: 'active'
      });
      return response.data.listings || [];
    } catch (error) {
      console.error('❌ Get user listings failed:', error);
      return [];
    }
  };

  const purchaseListing = async (listingId) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      // Get listing details
      const listingResponse = await marketplaceApi.getListing(listingId);
      const listing = listingResponse.data.listing;
      
      // Submit blockchain transaction
      console.log('📤 Submitting purchase transaction...');
      const tx = await contractService.purchaseItem(
        wallet.address, 
        listingId, 
        listing.price
      );
      
      // Record order in backend
      try {
        const response = await marketplaceApi.createOrder({
          listingId,
          buyerAddress: wallet.address,
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber
        });
        
        console.log('✅ Purchase recorded in backend');
        await refreshData();
        return response.data.order;
      } catch (backendError) {
        console.warn('⚠️ Backend order recording failed, but blockchain transaction succeeded:', backendError);
        return { transactionHash: tx.hash };
      }
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      throw error;
    }
  };

  const getUserOrders = async (type = 'all') => {
    try {
      if (!wallet?.address) return [];
      
      const response = await marketplaceApi.getOrders(wallet.address, type);
      return response.data.orders || [];
    } catch (error) {
      console.error('❌ Get orders failed:', error);
      return [];
    }
  };

  const completeOrder = async (orderId) => {
    try {
      if (!wallet?.address) throw new Error('Wallet not connected');
      
      // Call smart contract to release escrow
      console.log('📤 Releasing escrow...');
      const tx = await contractService.releaseEscrow(wallet.address, orderId);
      
      // Update backend
      const response = await marketplaceApi.completeOrder(
        orderId,
        wallet.address,
        tx.hash
      );
      
      console.log('✅ Order completed');
      return response.data.order;
    } catch (error) {
      console.error('❌ Complete order failed:', error);
      throw error;
    }
  };

  // ===============================
  // PROFILE FUNCTIONS
  // ===============================

  const getAggregatedProfile = async () => {
    try {
      if (!wallet?.address) return null;
      
      const response = await profileApi.getAggregatedProfile(wallet.address);
      return response.data.profile;
    } catch (error) {
      console.error('❌ Get profile failed:', error);
      return null;
    }
  };

  // ===============================
  // DASHBOARD FUNCTIONS
  // ===============================

  const getPlatformStats = async () => {
    try {
      const response = await dashboardApi.getPlatformStats();
      return response.data.stats;
    } catch (error) {
      console.error('❌ Get platform stats failed:', error);
      return null;
    }
  };

  const getUserDashboard = async () => {
    try {
      if (!wallet?.address) return null;
      
      const response = await dashboardApi.getUserDashboard(wallet.address);
      return response.data.dashboard;
    } catch (error) {
      console.error('❌ Get user dashboard failed:', error);
      return null;
    }
  };

  const getActivityFeed = async (limit = 20) => {
    try {
      const response = await dashboardApi.getActivityFeed(limit);
      return response.data.activity || [];
    } catch (error) {
      console.error('❌ Get activity feed failed:', error);
      return [];
    }
  };

  // ===============================
  // COMMUNITY FUNCTIONS
  // ===============================

  const createPost = async (content, mediaUrl = null, mediaType = null, tags = [], visibility = 'public') => {
    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      const response = await communityApi.createPost(
        wallet.address,
        content,
        mediaUrl,
        mediaType,
        tags,
        visibility
      );

      if (response.data?.success) {
        return response.data.post;
      }
      return null;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  };

  const getPosts = async (authorAddress = null, tag = null, sortBy = 'recent', limit = 20, skip = 0) => {
    try {
      const response = await communityApi.getPosts(
        wallet?.address,
        authorAddress,
        tag,
        sortBy,
        limit,
        skip
      );

      if (response.data?.success) {
        return response.data.posts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  };

  const likePost = async (postId) => {
    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      const response = await communityApi.likePost(postId, wallet.address, 'like');
      return response.data?.success || false;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  };

  const unlikePost = async (postId) => {
    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      const response = await communityApi.likePost(postId, wallet.address, 'unlike');
      return response.data?.success || false;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  };

  const createComment = async (postId, content, parentCommentId = null) => {
    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      const response = await communityApi.createComment(
        postId,
        wallet.address,
        content,
        parentCommentId
      );

      if (response.data?.success) {
        return response.data.comment;
      }
      return null;
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  };

  const getComments = async (postId, limit = 50, skip = 0) => {
    try {
      const response = await communityApi.getComments(postId, limit, skip);
      if (response.data?.success) {
        return response.data.comments;
      }
      return [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const followUser = async (followingAddress) => {
    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      const response = await communityApi.followUser(wallet.address, followingAddress);
      return response.data?.success || false;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  };

  const unfollowUser = async (followingAddress) => {
    try {
      if (!wallet?.address) {
        throw new Error('Wallet not connected');
      }

      const response = await communityApi.unfollowUser(wallet.address, followingAddress);
      return response.data?.success || false;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  };

  const getSocialStats = async (userAddress) => {
    try {
      const response = await communityApi.getSocialStats(userAddress || wallet?.address);
      if (response.data?.success) {
        return response.data.stats;
      }
      return { followers: 0, following: 0, posts: 0, totalLikes: 0 };
    } catch (error) {
      console.error('Error fetching social stats:', error);
      return { followers: 0, following: 0, posts: 0, totalLikes: 0 };
    }
  };

  // ===============================
  // ANALYTICS FUNCTIONS
  // ===============================

  const getAnalyticsOverview = async (timeframe = '30d') => {
    try {
      const response = await analyticsApi.getOverview(timeframe);
      if (response.data?.success) {
        return response.data.overview;
      }
      return null;
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      return null;
    }
  };

  const getTransactionTimeSeries = async (period = '30d', interval = 'day') => {
    try {
      const response = await analyticsApi.getTransactionTimeSeries(period, interval);
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching transaction timeseries:', error);
      return [];
    }
  };

  const getUserTimeSeries = async (period = '30d') => {
    try {
      const response = await analyticsApi.getUserTimeSeries(period);
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user timeseries:', error);
      return [];
    }
  };

  const getGovernanceTimeSeries = async (period = '30d') => {
    try {
      const response = await analyticsApi.getGovernanceTimeSeries(period);
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching governance timeseries:', error);
      return [];
    }
  };

  const getMarketplaceTimeSeries = async (period = '30d') => {
    try {
      const response = await analyticsApi.getMarketplaceTimeSeries(period);
      if (response.data?.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching marketplace timeseries:', error);
      return [];
    }
  };

  const getLeaderboards = async () => {
    try {
      const [reputation, voters, sellers] = await Promise.all([
        analyticsApi.getReputationLeaderboard(10),
        analyticsApi.getVotersLeaderboard(10),
        analyticsApi.getSellersLeaderboard(10)
      ]);

      return {
        reputation: reputation.data?.leaderboard || [],
        voters: voters.data?.leaderboard || [],
        sellers: sellers.data?.leaderboard || []
      };
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      return { reputation: [], voters: [], sellers: [] };
    }
  };

  const getCategoryAnalytics = async () => {
    try {
      const [governance, marketplace, reputationDist] = await Promise.all([
        analyticsApi.getGovernanceCategories(),
        analyticsApi.getMarketplaceCategories(),
        analyticsApi.getReputationDistribution()
      ]);

      return {
        governance: governance.data?.categories || [],
        marketplace: marketplace.data?.categories || [],
        reputationDistribution: reputationDist.data?.distribution || []
      };
    } catch (error) {
      console.error('Error fetching category analytics:', error);
      return { governance: [], marketplace: [], reputationDistribution: [] };
    }
  };

  const getSocialEngagement = async (period = '30d') => {
    try {
      const response = await analyticsApi.getSocialEngagement(period);
      if (response.data?.success) {
        return response.data.engagement;
      }
      return null;
    } catch (error) {
      console.error('Error fetching social engagement:', error);
      return null;
    }
  };

  const value = {
    wallet,
    isConnected,
    balance,
    reputation,
    networkStats,
    isLoading,
    did,
    isXMTPReady,
    connectWallet,
    disconnectWallet,
    // Wallet generation / import
    showWalletSetup,
    setShowWalletSetup,
    walletSetupLoading,
    walletSetupStep,
    pendingMnemonic,
    generateNewWallet,
    importWalletFromSeed,
    importWalletFromKey,
    hasSavedSoftwareWallet,
    refreshData,
    sendCIV,
    createDID,
    voteOnProposal,
    createProposal,
    getProposals,
    getUserVotes,
    loadIdentity,
    updateReputation,
    getCredentials,
    getActivityLog,
    createListing,
    getListings,
    getUserListings,
    purchaseListing,
    getUserOrders,
    completeOrder,
    getAggregatedProfile,
    getPlatformStats,
    getUserDashboard,
    getActivityFeed,
    createPost,
    getPosts,
    likePost,
    unlikePost,
    createComment,
    getComments,
    followUser,
    unfollowUser,
    getSocialStats,
    getAnalyticsOverview,
    getTransactionTimeSeries,
    getUserTimeSeries,
    getGovernanceTimeSeries,
    getMarketplaceTimeSeries,
    getLeaderboards,
    getCategoryAnalytics,
    getSocialEngagement,
    web3Service,
    contractService,
    layer2Service,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {showWalletSetup && (
        <WalletSetupModal
          hasMetaMask={!!window.ethereum}
          isLoading={walletSetupLoading}
          loadingStep={walletSetupStep}
          generatedMnemonic={pendingMnemonic}
          onMetaMask={() => { setShowWalletSetup(false); connectWallet(); }}
          onCreateWallet={generateNewWallet}
          onImportSeed={importWalletFromSeed}
          onImportKey={importWalletFromKey}
          onClose={() => { setShowWalletSetup(false); setPendingMnemonic(''); }}
        />
      )}
    </AppContext.Provider>
  );
};
