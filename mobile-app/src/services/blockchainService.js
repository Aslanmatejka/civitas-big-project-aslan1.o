/**
 * Blockchain Service - General blockchain queries and operations
 * Handles network statistics, block data, validator info, and analytics
 */

import web3Service from './web3Service';
import contractService from './contractService';

// API endpoints for blockchain data
const BLOCKCHAIN_API = {
  explorer: 'https://api.explorer.civitas.network',
  validators: 'https://api.validators.civitas.network',
  analytics: 'https://api.analytics.civitas.network',
};

class BlockchainService {
  constructor() {
    this.cache = {
      networkStats: null,
      validators: null,
      lastUpdate: 0,
    };
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Get network statistics
   * @returns {Promise<object>} Network stats
   */
  async getNetworkStats() {
    try {
      // Check cache first
      if (this.cache.networkStats && Date.now() - this.cache.lastUpdate < this.cacheTimeout) {
        return this.cache.networkStats;
      }

      const [blockNumber, gasPrice, networkInfo] = await Promise.all([
        web3Service.getBlockNumber(),
        web3Service.getGasPrice(),
        web3Service.getNetworkInfo(),
      ]);

      // Fetch additional stats from API
      const response = await fetch(`${BLOCKCHAIN_API.analytics}/network-stats`);
      const apiStats = response.ok ? await response.json() : {};

      const stats = {
        blockNumber,
        gasPrice: parseFloat(gasPrice).toFixed(2),
        blockTime: apiStats.avgBlockTime || '5.2s',
        tps: apiStats.transactionsPerSecond || 0,
        totalTransactions: apiStats.totalTransactions || 0,
        activeValidators: apiStats.activeValidators || 247,
        totalStaked: apiStats.totalStaked || '125M CIV',
        networkUptime: apiStats.uptime || '99.9%',
        chainId: networkInfo?.chainId || 'unknown',
      };

      // Update cache
      this.cache.networkStats = stats;
      this.cache.lastUpdate = Date.now();

      return stats;
    } catch (error) {
      console.error('❌ Get network stats failed:', error);
      
      // Return mock data in case of error (dev/offline mode)
      return {
        blockNumber: 1234567,
        gasPrice: '0.1',
        blockTime: '5.2s',
        tps: 450,
        totalTransactions: 2450000,
        activeValidators: 247,
        totalStaked: '125M CIV',
        networkUptime: '99.9%',
        chainId: 'CIV',
      };
    }
  }

  /**
   * Get validator list with details
   * @param {number} limit - Number of validators to fetch
   * @returns {Promise<Array>} Validator list
   */
  async getValidators(limit = 20) {
    try {
      const response = await fetch(`${BLOCKCHAIN_API.validators}/list?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch validators');
      }

      const validators = await response.json();

      return validators.map(v => ({
        address: v.address,
        name: v.moniker || 'Unknown',
        stake: v.tokens || '0',
        commission: v.commission || '10%',
        apr: v.apr || '12%',
        uptime: v.uptime || '99.9%',
        status: v.status || 'active',
        delegators: v.delegatorCount || 0,
      }));
    } catch (error) {
      console.error('❌ Get validators failed:', error);
      
      // Return mock data
      return [
        {
          address: '0x1234...5678',
          name: 'CIVITAS Foundation',
          stake: '1,200,000',
          commission: '10%',
          apr: '12%',
          uptime: '99.99%',
          status: 'active',
          delegators: 1247,
        },
        {
          address: '0x2345...6789',
          name: 'Southeast Asia Nodes',
          stake: '850,000',
          commission: '8%',
          apr: '13%',
          uptime: '99.95%',
          status: 'active',
          delegators: 892,
        },
        {
          address: '0x3456...7890',
          name: 'Latin America Collective',
          stake: '720,000',
          commission: '7%',
          apr: '14%',
          uptime: '99.9%',
          status: 'active',
          delegators: 654,
        },
      ];
    }
  }

  /**
   * Get transaction details
   * @param {string} txHash - Transaction hash
   * @returns {Promise<object>} Transaction details
   */
  async getTransaction(txHash) {
    try {
      const provider = web3Service.getProvider();
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        throw new Error('Transaction not found');
      }

      const receipt = await provider.getTransactionReceipt(txHash);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasPrice: tx.gasPrice.toString(),
        gasUsed: receipt?.gasUsed.toString() || '0',
        blockNumber: tx.blockNumber,
        status: receipt?.status === 1 ? 'success' : 'failed',
        timestamp: null, // Would need to fetch block for timestamp
      };
    } catch (error) {
      console.error('❌ Get transaction failed:', error);
      return null;
    }
  }

  /**
   * Get user transaction history
   * @param {string} address - Wallet address
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<object>} {transactions, totalCount}
   */
  async getUserTransactions(address, page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${BLOCKCHAIN_API.explorer}/address/${address}/transactions?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();

      return {
        transactions: data.transactions || [],
        totalCount: data.total || 0,
        page,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.error('❌ Get user transactions failed:', error);
      return {
        transactions: [],
        totalCount: 0,
        page: 1,
        hasMore: false,
      };
    }
  }

  /**
   * Get user analytics
   * @param {string} address - Wallet address
   * @returns {Promise<object>} User analytics
   */
  async getUserAnalytics(address) {
    try {
      const response = await fetch(`${BLOCKCHAIN_API.analytics}/user/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analytics = await response.json();

      return {
        totalTransactions: analytics.txCount || 0,
        totalVolume: analytics.volume || '0',
        firstSeen: analytics.firstTx || null,
        lastActive: analytics.lastTx || null,
        governanceParticipation: analytics.governanceVotes || 0,
        reputation: await contractService.getReputation(address),
        ranking: analytics.userRank || null,
      };
    } catch (error) {
      console.error('❌ Get user analytics failed:', error);
      
      // Return mock data
      return {
        totalTransactions: 142,
        totalVolume: '1,247 CIV',
        firstSeen: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
        lastActive: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        governanceParticipation: 8,
        reputation: 750,
        ranking: 'Top 30%',
      };
    }
  }

  /**
   * Get global analytics (for AnalyticsScreen)
   * @returns {Promise<object>} Global analytics
   */
  async getGlobalAnalytics() {
    try {
      const response = await fetch(`${BLOCKCHAIN_API.analytics}/global`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch global analytics');
      }

      const analytics = await response.json();

      return {
        totalUsers: analytics.users || 2400000,
        totalVolume: analytics.volume || '58M',
        totalTransactions: analytics.transactions || 450000,
        countriesActive: analytics.countries || 147,
        carbonSaved: analytics.carbonSaved || '142kg',
        treesPlanted: analytics.treesPlanted || 1247,
        regionalDistribution: analytics.regions || {
          Africa:        28,
          'SE Asia':     24,
          'South Asia':  20,
          'Latin America': 16,
          MENA:          8,
          Others:        4,
        },
        weeklyVolume: analytics.weeklyVolume || [
          { day: 'Mon', value: 42000 },
          { day: 'Tue', value: 38000 },
          { day: 'Wed', value: 45000 },
          { day: 'Thu', value: 52000 },
          { day: 'Fri', value: 48000 },
          { day: 'Sat', value: 35000 },
          { day: 'Sun', value: 40000 },
        ],
      };
    } catch (error) {
      console.error('❌ Get global analytics failed:', error);
      
      // Return mock data
      return {
        totalUsers: 2400000,
        totalVolume: '58M',
        totalTransactions: 450000,
        countriesActive: 147,
        carbonSaved: '142kg',
        treesPlanted: 1247,
        regionalDistribution: {
          Africa:        28,
          'SE Asia':     24,
          'South Asia':  20,
          'Latin America': 16,
          MENA:          8,
          Others:        4,
        },
        weeklyVolume: [
          { day: 'Mon', value: 42000 },
          { day: 'Tue', value: 38000 },
          { day: 'Wed', value: 45000 },
          { day: 'Thu', value: 52000 },
          { day: 'Fri', value: 48000 },
          { day: 'Sat', value: 35000 },
          { day: 'Sun', value: 40000 },
        ],
      };
    }
  }

  /**
   * Get gas price recommendations
   * @returns {Promise<object>} Gas price tiers {slow, standard, fast}
   */
  async getGasPrices() {
    try {
      const response = await fetch(`${BLOCKCHAIN_API.analytics}/gas-prices`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gas prices');
      }

      const prices = await response.json();

      return {
        slow: prices.slow || '0.5',
        standard: prices.standard || '1.0',
        fast: prices.fast || '2.0',
        unit: 'Gwei',
      };
    } catch (error) {
      console.error('❌ Get gas prices failed:', error);
      
      // Return default values
      return {
        slow: '0.5',
        standard: '1.0',
        fast: '2.0',
        unit: 'Gwei',
      };
    }
  }

  /**
   * Search for address, transaction, or block
   * @param {string} query - Search query
   * @returns {Promise<object>} Search result {type, data}
   */
  async search(query) {
    try {
      const response = await fetch(`${BLOCKCHAIN_API.explorer}/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        return { type: 'not_found', data: null };
      }

      const result = await response.json();

      return {
        type: result.type, // 'address', 'transaction', 'block'
        data: result.data,
      };
    } catch (error) {
      console.error('❌ Search failed:', error);
      return { type: 'error', data: null };
    }
  }

  /**
   * Get block details
   * @param {number} blockNumber - Block number
   * @returns {Promise<object>} Block details
   */
  async getBlock(blockNumber) {
    try {
      const provider = web3Service.getProvider();
      const block = await provider.getBlock(blockNumber);

      if (!block) {
        return null;
      }

      return {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactions: block.transactions.length,
        gasUsed: block.gasUsed.toString(),
        gasLimit: block.gasLimit.toString(),
        miner: block.miner,
      };
    } catch (error) {
      console.error('❌ Get block failed:', error);
      return null;
    }
  }

  /**
   * Get carbon offset data
   * @param {string} address - User address (optional)
   * @returns {Promise<object>} Carbon offset stats
   */
  async getCarbonOffsetData(address = null) {
    try {
      const endpoint = address
        ? `${BLOCKCHAIN_API.analytics}/carbon/user/${address}`
        : `${BLOCKCHAIN_API.analytics}/carbon/global`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch carbon data');
      }

      const data = await response.json();

      return {
        carbonSaved: data.carbonSaved || '142kg',
        treesEquivalent: data.treesEquivalent || 8,
        monthlyCarbon: data.monthlyCarbon || '32kg',
        lifetimeCarbon: data.lifetimeCarbon || '142kg',
        treesPlanted: data.treesPlanted || 1247,
        co2PerYear: data.co2PerYear || '42 tons',
        communitiesBenefited: data.communities || 12,
      };
    } catch (error) {
      console.error('❌ Get carbon data failed:', error);
      
      // Return mock data
      return {
        carbonSaved: '142kg',
        treesEquivalent: 8,
        monthlyCarbon: '32kg',
        lifetimeCarbon: '142kg',
        treesPlanted: 1247,
        co2PerYear: '42 tons',
        communitiesBenefited: 12,
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      networkStats: null,
      validators: null,
      lastUpdate: 0,
    };
    console.log('🗑️ Cache cleared');
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
