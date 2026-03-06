import { ethers } from 'ethers';

// Network configurations
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
  }

  async initialize() {
    try {
      if (window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get network info
        const network = await this.provider.getNetwork();
        this.chainId = network.chainId.toString();

        console.log('✅ Web3 initialized:', {
          chainId: this.chainId,
        });

        return true;
      } else {
        console.warn('⚠️ No Web3 wallet detected');
        return false;
      }
    } catch (error) {
      console.error('❌ Web3 initialization failed:', error);
      return false;
    }
  }

  async connectWallet(address) {
    try {
      this.walletAddress = address;
      this.signer = await this.provider.getSigner();

      console.log('✅ Wallet connected:', this.walletAddress);
      return { address: this.walletAddress };
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect a software-generated ethers.Wallet (no MetaMask).
   * The wallet is connected to the local JSON-RPC provider.
   */
  connectSoftwareWallet(ethersWallet) {
    try {
      // Ensure we have a JSON-RPC provider for the local node
      if (!this.provider || this.provider instanceof ethers.BrowserProvider === false) {
        this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      } else {
        // Fallback provider in case BrowserProvider isn't usable without MetaMask
        this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      }
      this.signer = ethersWallet.connect(this.provider);
      this.walletAddress = ethersWallet.address;
      console.log('✅ Software wallet connected:', this.walletAddress);
      return { address: this.walletAddress };
    } catch (error) {
      console.error('❌ Software wallet connection failed:', error);
      throw error;
    }
  }

  async switchToLocalNetwork() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CIVITAS_LOCAL_CONFIG.chainId }],
      });
    } catch (switchError) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CIVITAS_LOCAL_CONFIG],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  getAddress() {
    return this.walletAddress;
  }

  getSigner() {
    return this.signer;
  }

  getProvider() {
    return this.provider;
  }

  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Get balance failed:', error);
      return '0';
    }
  }

  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('❌ Get block number failed:', error);
      return 0;
    }
  }

  async getTransactionReceipt(txHash) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('❌ Get transaction receipt failed:', error);
      return null;
    }
  }

  async sendTransaction(to, value) {
    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
      });
      
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('❌ Send transaction failed:', error);
      throw error;
    }
  }
}

export default Web3Service;
