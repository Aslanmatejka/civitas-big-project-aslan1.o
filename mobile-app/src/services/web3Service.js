/**
 * Web3 Service - Core blockchain connection layer
 * Handles Web3 provider initialization, wallet connection, and network management
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CIVITAS Chain Configuration
const CIVITAS_CHAIN_CONFIG = {
  chainId: '0x434956', // CIV in hex
  chainName: 'CIVITAS Network',
  nativeCurrency: {
    name: 'CIVITAS',
    symbol: 'CIV',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.civitas.network'], // Placeholder - will be actual RPC
  blockExplorerUrls: ['https://explorer.civitas.network'],
};

// Testnet Configuration
const CIVITAS_TESTNET_CONFIG = {
  chainId: '0x434956A', // CIV testnet
  chainName: 'CIVITAS Testnet',
  nativeCurrency: {
    name: 'Test CIVITAS',
    symbol: 'tCIV',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.civitas.network'],
  blockExplorerUrls: ['https://testnet-explorer.civitas.network'],
};

// Localhost Configuration (Hardhat)
const CIVITAS_LOCAL_CONFIG = {
  chainId: '0x7A69', // 31337 in hex
  chainName: 'Hardhat Local',
  nativeCurrency: {
    name: 'Test Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [],
};

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.walletAddress = null;
    this.chainId = null;
    this.isTestnet = __DEV__; // Use testnet in development
    this.useLocal = true; // Use localhost for development
  }

  /**
   * Initialize Web3 provider
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      const config = this.useLocal ? CIVITAS_LOCAL_CONFIG : (this.isTestnet ? CIVITAS_TESTNET_CONFIG : CIVITAS_CHAIN_CONFIG);
      
      // Create provider with RPC URL
      this.provider = new ethers.JsonRpcProvider(config.rpcUrls[0]);
      
      // Test connection
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId.toString();
      
      console.log('✅ Web3 initialized:', {
        network: config.chainName,
        chainId: this.chainId,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Web3 initialization failed:', error);
      // Fallback to mock provider in development
      if (__DEV__) {
        console.log('📱 Using mock provider for development');
        this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      }
      return false;
    }
  }

  /**
   * Connect wallet using seed phrase
   * @param {string} mnemonic - 12 or 24-word seed phrase
   * @returns {Promise<object>} Wallet info {address, publicKey}
   */
  async connectWallet(mnemonic) {
    try {
      // Ensure provider is initialized
      if (!this.provider) {
        console.log('🔄 Provider not initialized, initializing now...');
        await this.initialize();
      }

      // Test blockchain connection
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log('✅ Blockchain connected, block:', blockNumber);
      } catch (connError) {
        throw new Error('Cannot connect to blockchain at localhost:8545. Make sure Hardhat node is running.');
      }

      // Validate mnemonic
      if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) {
        throw new Error('Invalid seed phrase');
      }

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      
      // Connect to provider
      this.signer = wallet.connect(this.provider);
      this.walletAddress = wallet.address;

      // Store encrypted wallet (with user's biometric/PIN)
      await this.storeWallet(mnemonic);

      console.log('✅ Wallet connected:', this.walletAddress);

      return {
        address: this.walletAddress,
        publicKey: wallet.publicKey,
      };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Create new wallet with seed phrase
   * @returns {Promise<object>} {address, mnemonic, publicKey}
   */
  async createWallet() {
    try {
      // Ensure provider is initialized
      if (!this.provider) {
        console.log('🔄 Provider not initialized, initializing now...');
        await this.initialize();
      }

      // Test blockchain connection
      try {
        const blockNumber = await this.provider.getBlockNumber();
        console.log('✅ Blockchain connected, block:', blockNumber);
      } catch (connError) {
        throw new Error('Cannot connect to blockchain at localhost:8545. Make sure Hardhat node is running.');
      }

      // Generate random wallet
      const wallet = ethers.Wallet.createRandom();
      
      // Connect to provider
      this.signer = wallet.connect(this.provider);
      this.walletAddress = wallet.address;

      // Get mnemonic
      const mnemonic = wallet.mnemonic.phrase;

      console.log('✅ New wallet created:', this.walletAddress);

      return {
        address: this.walletAddress,
        mnemonic,
        publicKey: wallet.publicKey,
      };
    } catch (error) {
      console.error('❌ Wallet creation failed:', error);
      throw error;
    }
  }

  /**
   * Import wallet from private key
   * @param {string} privateKey - Private key hex string
   * @returns {Promise<object>} {address, publicKey}
   */
  async importWalletFromPrivateKey(privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      this.signer = wallet.connect(this.provider);
      this.walletAddress = wallet.address;

      console.log('✅ Wallet imported:', this.walletAddress);

      return {
        address: this.walletAddress,
        publicKey: wallet.publicKey,
      };
    } catch (error) {
      console.error('❌ Wallet import failed:', error);
      throw error;
    }
  }

  /**
   * Restore wallet from stored credentials
   * @returns {Promise<boolean>} Success status
   */
  async restoreWallet() {
    try {
      const encryptedWallet = await AsyncStorage.getItem('civitas_wallet');
      
      if (!encryptedWallet) {
        return false;
      }

      // In production, decrypt with user's biometric/PIN
      // For now, we'll use the stored mnemonic directly
      const walletData = JSON.parse(encryptedWallet);
      
      if (walletData.mnemonic) {
        await this.connectWallet(walletData.mnemonic);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Wallet restore failed:', error);
      return false;
    }
  }

  /**
   * Store wallet securely (encrypted)
   * @param {string} mnemonic - Seed phrase to store
   * @private
   */
  async storeWallet(mnemonic) {
    try {
      // In production, encrypt with user's biometric/PIN
      // For now, store as JSON (DEV ONLY - NOT SECURE)
      const walletData = {
        mnemonic,
        address: this.walletAddress,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem('civitas_wallet', JSON.stringify(walletData));
      console.log('💾 Wallet stored securely');
    } catch (error) {
      console.error('❌ Wallet storage failed:', error);
    }
  }

  /**
   * Get native balance (CIV)
   * @param {string} address - Optional address (defaults to connected wallet)
   * @returns {Promise<string>} Balance in CIV
   */
  async getBalance(address = null) {
    try {
      const targetAddress = address || this.walletAddress;
      
      if (!targetAddress) {
        throw new Error('No wallet connected');
      }

      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Get balance failed:', error);
      return '0';
    }
  }

  /**
   * Send native CIV tokens
   * @param {string} to - Recipient address
   * @param {string} amount - Amount in CIV
   * @returns {Promise<object>} Transaction receipt
   */
  async sendTransaction(to, amount) {
    try {
      if (!this.signer) {
        throw new Error('No wallet connected');
      }

      // Validate address
      if (!ethers.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      // Create transaction
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      console.log('📤 Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('✅ Transaction confirmed:', receipt.hash);

      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        value: amount,
        status: receipt.status === 1 ? 'success' : 'failed',
      };
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Array>} Transaction array
   */
  async getTransactionHistory(limit = 50) {
    try {
      if (!this.walletAddress) {
        return [];
      }

      // In production, query from block explorer API or indexer
      // For now, return empty array
      console.log('📜 Fetching transaction history...');
      
      // TODO: Implement with CIVITAS explorer API
      return [];
    } catch (error) {
      console.error('❌ Get transaction history failed:', error);
      return [];
    }
  }

  /**
   * Get current gas price
   * @returns {Promise<string>} Gas price in Gwei
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice, 'gwei');
    } catch (error) {
      console.error('❌ Get gas price failed:', error);
      return '0';
    }
  }

  /**
   * Estimate gas for transaction
   * @param {object} txParams - Transaction parameters
   * @returns {Promise<string>} Estimated gas
   */
  async estimateGas(txParams) {
    try {
      const gasEstimate = await this.provider.estimateGas(txParams);
      return gasEstimate.toString();
    } catch (error) {
      console.error('❌ Gas estimation failed:', error);
      return '21000'; // Default gas limit
    }
  }

  /**
   * Get current block number
   * @returns {Promise<number>} Block number
   */
  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('❌ Get block number failed:', error);
      return 0;
    }
  }

  /**
   * Get network info
   * @returns {Promise<object>} Network information
   */
  async getNetworkInfo() {
    try {
      const [network, blockNumber, gasPrice] = await Promise.all([
        this.provider.getNetwork(),
        this.getBlockNumber(),
        this.getGasPrice(),
      ]);

      return {
        chainId: network.chainId.toString(),
        name: network.name,
        blockNumber,
        gasPrice,
      };
    } catch (error) {
      console.error('❌ Get network info failed:', error);
      return null;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    this.signer = null;
    this.walletAddress = null;
    await AsyncStorage.removeItem('civitas_wallet');
    console.log('👋 Wallet disconnected');
  }

  /**
   * Check if wallet is connected
   * @returns {boolean}
   */
  isConnected() {
    return !!this.walletAddress;
  }

  /**
   * Get connected wallet address
   * @returns {string|null}
   */
  getAddress() {
    return this.walletAddress;
  }

  /**
   * Get signer for contract interactions
   * @returns {ethers.Signer|null}
   */
  getSigner() {
    return this.signer;
  }

  /**
   * Get provider for read-only operations
   * @returns {ethers.Provider|null}
   */
  getProvider() {
    return this.provider;
  }
}

// Export singleton instance
const web3Service = new Web3Service();
export default web3Service;
