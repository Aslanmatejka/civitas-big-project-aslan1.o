/**
 * App Context - Global state management
 * Provides wallet, user data, and services across the entire app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import web3Service from '../services/web3Service';
import contractService from '../services/contractService';
import ipfsService from '../services/ipfsService';
import blockchainService from '../services/blockchainService';
import layer2Service from '../services/layer2Service';

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  // User & Wallet State
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Network State
  const [networkStats, setNetworkStats] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // DID & Identity State
  const [did, setDid] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [reputation, setReputation] = useState(0);

  /**
   * Initialize app (check for existing wallet, load data)
   */
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing CIVITAS app...');

      // Initialize Web3
      await web3Service.initialize();

      // Try to restore wallet
      const restored = await web3Service.restoreWallet();

      if (restored) {
        await onWalletConnected();
      }

      // Initialize contracts
      await contractService.initialize();

      // Load network stats
      await loadNetworkStats();

      setIsLoading(false);
      console.log('✅ App initialized');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setIsLoading(false);
    }
  };

  /**
   * Handle wallet connection
   */
  const onWalletConnected = async () => {
    try {
      const address = web3Service.getAddress();
      
      if (!address) {
        return;
      }

      setIsConnected(true);

      // Initialize Layer-2 service with the wallet signer
      try {
        const signer = web3Service.getSigner ? web3Service.getSigner() : null;
        await layer2Service.init(signer);
        console.log('[L2] Layer-2 service ready');
      } catch (l2Err) {
        console.warn('[L2] Non-critical init error:', l2Err.message);
      }

      // Create wallet object
      const walletData = {
        address,
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      };
      setWallet(walletData);

      // Load user data
      await loadUserData(address);

      console.log('✅ Wallet connected:', address);
    } catch (error) {
      console.error('❌ Wallet connection handling failed:', error);
    }
  };

  /**
   * Load user data (balance, reputation, DID, etc.)
   */
  const loadUserData = async (address) => {
    try {
      // Load balance
      const [civBalance, nativeBalance] = await Promise.all([
        contractService.getCIVBalance(address),
        web3Service.getBalance(address),
      ]);

      setBalance(civBalance);

      // Load reputation
      const rep = await contractService.getReputation(address);
      setReputation(rep);

      // Load user analytics
      const analytics = await blockchainService.getUserAnalytics(address);

      // Load stored DID from AsyncStorage
      const storedDid = await AsyncStorage.getItem(`did_${address}`);
      if (storedDid) {
        setDid(JSON.parse(storedDid));
      }

      // Load credentials
      const storedCredentials = await AsyncStorage.getItem(`credentials_${address}`);
      if (storedCredentials) {
        setCredentials(JSON.parse(storedCredentials));
      }

      // Update user state
      setUser({
        address,
        balance: civBalance,
        nativeBalance,
        reputation: rep,
        analytics,
      });

      console.log('✅ User data loaded');
    } catch (error) {
      console.error('❌ Load user data failed:', error);
    }
  };

  /**
   * Load network statistics
   */
  const loadNetworkStats = async () => {
    try {
      const stats = await blockchainService.getNetworkStats();
      setNetworkStats(stats);
    } catch (error) {
      console.error('❌ Load network stats failed:', error);
    }
  };

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    if (wallet?.address) {
      await Promise.all([
        loadUserData(wallet.address),
        loadNetworkStats(),
      ]);
    }
  }, [wallet]);

  /**
   * Create new wallet
   */
  const createWallet = async () => {
    try {
      const newWallet = await web3Service.createWallet();
      await onWalletConnected();
      return newWallet;
    } catch (error) {
      console.error('❌ Create wallet failed:', error);
      throw error;
    }
  };

  /**
   * Import wallet from mnemonic
   */
  const importWallet = async (mnemonic) => {
    try {
      await web3Service.connectWallet(mnemonic);
      await onWalletConnected();
      return true;
    } catch (error) {
      console.error('❌ Import wallet failed:', error);
      throw error;
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = async () => {
    try {
      await web3Service.disconnect();
      setWallet(null);
      setUser(null);
      setBalance('0');
      setIsConnected(false);
      setDid(null);
      setCredentials([]);
      setReputation(0);
      console.log('✅ Wallet disconnected');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
    }
  };

  /**
   * Send CIV tokens
   */
  const sendCIV = async (to, amount) => {
    try {
      const receipt = await contractService.transferCIV(to, amount);
      
      // Refresh balance
      if (wallet?.address) {
        await loadUserData(wallet.address);
      }

      return receipt;
    } catch (error) {
      console.error('❌ Send CIV failed:', error);
      throw error;
    }
  };

  /**
   * Create DID
   */
  const createDID = async (didData) => {
    try {
      const result = await contractService.createDID(didData);
      
      // Store DID locally
      const didObject = {
        id: result.didId,
        document: didData,
        txHash: result.txHash,
        createdAt: Date.now(),
      };
      
      await AsyncStorage.setItem(`did_${wallet.address}`, JSON.stringify(didObject));
      setDid(didObject);

      return result;
    } catch (error) {
      console.error('❌ Create DID failed:', error);
      throw error;
    }
  };

  /**
   * Issue credential
   */
  const issueCredential = async (subjectDID, credentialType, credentialData) => {
    try {
      const result = await contractService.issueCredential(
        subjectDID,
        credentialType,
        credentialData
      );

      // Add to credentials list
      const credential = {
        id: result.credentialId,
        type: credentialType,
        data: credentialData,
        issuedAt: Date.now(),
        txHash: result.txHash,
      };

      const updatedCredentials = [...credentials, credential];
      setCredentials(updatedCredentials);
      
      await AsyncStorage.setItem(
        `credentials_${wallet.address}`,
        JSON.stringify(updatedCredentials)
      );

      return result;
    } catch (error) {
      console.error('❌ Issue credential failed:', error);
      throw error;
    }
  };

  /**
   * Upload file to IPFS
   */
  const uploadToIPFS = async (fileUri, metadata, encrypted = true) => {
    try {
      return await ipfsService.uploadFile(fileUri, metadata, encrypted);
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      throw error;
    }
  };

  /**
   * Download file from IPFS
   */
  const downloadFromIPFS = async (cid, encryptionKey = null) => {
    try {
      return await ipfsService.downloadFile(cid, encryptionKey);
    } catch (error) {
      console.error('❌ IPFS download failed:', error);
      throw error;
    }
  };

  /**
   * Create governance proposal
   */
  const createProposal = async (title, description) => {
    try {
      return await contractService.createProposal(title, description);
    } catch (error) {
      console.error('❌ Create proposal failed:', error);
      throw error;
    }
  };

  /**
   * Vote on proposal
   */
  const voteOnProposal = async (proposalId, support) => {
    try {
      return await contractService.voteOnProposal(proposalId, support);
    } catch (error) {
      console.error('❌ Vote failed:', error);
      throw error;
    }
  };

  /**
   * Update online status
   */
  const updateOnlineStatus = (online) => {
    setIsOnline(online);
    console.log(`📡 Network status: ${online ? 'Online' : 'Offline'}`);
  };

  // Context value
  const value = {
    // State
    user,
    wallet,
    balance,
    isConnected,
    isLoading,
    networkStats,
    isOnline,
    did,
    credentials,
    reputation,

    // Actions
    createWallet,
    importWallet,
    disconnectWallet,
    sendCIV,
    createDID,
    issueCredential,
    uploadToIPFS,
    downloadFromIPFS,
    createProposal,
    voteOnProposal,
    refreshData,
    updateOnlineStatus,

    // Services (direct access if needed)
    web3Service,
    contractService,
    ipfsService,
    blockchainService,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  
  return context;
};

export default AppContext;
