/**
 * Offline Service for CIVITAS Web App
 * 
 * Provides offline functionality using:
 * - IndexedDB for local data storage
 * - Service Worker for offline detection
 * - Background sync for queued actions
 * - Automatic retry on reconnection
 * 
 * Critical for target users in rural areas with unstable internet
 */

const DB_NAME = 'civitas_offline';
const DB_VERSION = 1;
const STORES = {
  QUEUE: 'transactionQueue',
  MESSAGES: 'offlineMessages',
  PROFILES: 'profileCache',
  POSTS: 'postCache',
  SETTINGS: 'userSettings'
};

class OfflineService {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.syncInProgress = false;
    
    // Set up online/offline event listeners
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Initialize IndexedDB
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Transaction Queue Store
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          const queueStore = db.createObjectStore(STORES.QUEUE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('priority', 'priority', { unique: false });
          queueStore.createIndex('type', 'type', { unique: false });
        }

        // Offline Messages Store
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messageStore = db.createObjectStore(STORES.MESSAGES, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          messageStore.createIndex('recipient', 'recipient', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Profile Cache Store
        if (!db.objectStoreNames.contains(STORES.PROFILES)) {
          const profileStore = db.createObjectStore(STORES.PROFILES, { 
            keyPath: 'walletAddress' 
          });
          profileStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Post Cache Store
        if (!db.objectStoreNames.contains(STORES.POSTS)) {
          const postStore = db.createObjectStore(STORES.POSTS, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          postStore.createIndex('timestamp', 'timestamp', { unique: false });
          postStore.createIndex('synced', 'synced', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        console.log('📦 IndexedDB stores created');
      };
    });
  }

  /**
   * Queue a transaction for later execution
   * @param {Object} transaction - Transaction details
   * @returns {Promise<number>} Transaction ID
   */
  async queueTransaction(transaction) {
    const tx = this.db.transaction([STORES.QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.QUEUE);

    const item = {
      ...transaction,
      status: 'pending',
      timestamp: Date.now(),
      priority: transaction.priority || 5,
      retryCount: 0,
      createdOffline: !this.isOnline
    };

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => {
        console.log(`📥 Queued transaction: ${transaction.type}`);
        this.notifyListeners('queue_added', item);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all queued transactions
   * @param {string} status - Optional filter by status
   * @returns {Promise<Array>} Array of transactions
   */
  async getQueuedTransactions(status = null) {
    const tx = this.db.transaction([STORES.QUEUE], 'readonly');
    const store = tx.objectStore(STORES.QUEUE);

    if (status) {
      const index = store.index('status');
      return this._getAllFromIndex(index, status);
    } else {
      return this._getAllFromStore(store);
    }
  }

  /**
   * Update transaction status
   * @param {number} id - Transaction ID
   * @param {string} status - New status
   * @param {Object} result - Optional result data
   */
  async updateTransactionStatus(id, status, result = null) {
    const tx = this.db.transaction([STORES.QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.QUEUE);

    const transaction = await this._getFromStore(store, id);
    if (!transaction) {
      throw new Error(`Transaction ${id} not found`);
    }

    transaction.status = status;
    transaction.lastUpdated = Date.now();
    if (result) {
      transaction.result = result;
    }

    return new Promise((resolve, reject) => {
      const request = store.put(transaction);
      request.onsuccess = () => {
        console.log(`✏️ Updated transaction ${id}: ${status}`);
        this.notifyListeners('queue_updated', transaction);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a transaction from queue
   * @param {number} id - Transaction ID
   */
  async deleteTransaction(id) {
    const tx = this.db.transaction([STORES.QUEUE], 'readwrite');
    const store = tx.objectStore(STORES.QUEUE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`🗑️ Deleted transaction ${id}`);
        this.notifyListeners('queue_deleted', { id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache a message for offline sending
   * @param {Object} message - Message data
   */
  async cacheMessage(message) {
    const tx = this.db.transaction([STORES.MESSAGES], 'readwrite');
    const store = tx.objectStore(STORES.MESSAGES);

    const item = {
      ...message,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => {
        console.log('📨 Message cached for offline');
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get unsynced messages
   */
  async getUnsyncedMessages() {
    const tx = this.db.transaction([STORES.MESSAGES], 'readonly');
    const store = tx.objectStore(STORES.MESSAGES);
    const messages = await this._getAllFromStore(store);
    return messages.filter(msg => !msg.synced);
  }

  /**
   * Mark message as synced
   * @param {number} id - Message ID
   */
  async markMessageSynced(id) {
    const tx = this.db.transaction([STORES.MESSAGES], 'readwrite');
    const store = tx.objectStore(STORES.MESSAGES);

    const message = await this._getFromStore(store, id);
    if (message) {
      message.synced = true;
      message.syncedAt = Date.now();
      await this._putInStore(store, message);
      console.log(`✅ Message ${id} synced`);
    }
  }

  /**
   * Cache profile data
   * @param {string} walletAddress - Wallet address
   * @param {Object} profile - Profile data
   */
  async cacheProfile(walletAddress, profile) {
    const tx = this.db.transaction([STORES.PROFILES], 'readwrite');
    const store = tx.objectStore(STORES.PROFILES);

    const item = {
      walletAddress,
      ...profile,
      lastUpdated: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached profile
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object|null>} Profile data or null
   */
  async getCachedProfile(walletAddress) {
    const tx = this.db.transaction([STORES.PROFILES], 'readonly');
    const store = tx.objectStore(STORES.PROFILES);
    return this._getFromStore(store, walletAddress);
  }

  /**
   * Cache a social post
   * @param {Object} post - Post data
   */
  async cachePost(post) {
    const tx = this.db.transaction([STORES.POSTS], 'readwrite');
    const store = tx.objectStore(STORES.POSTS);

    const item = {
      ...post,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get unsynced posts
   */
  async getUnsyncedPosts() {
    const tx = this.db.transaction([STORES.POSTS], 'readonly');
    const store = tx.objectStore(STORES.POSTS);
    const index = store.index('synced');
    return this._getAllFromIndex(index, false);
  }

  /**
   * Sync all offline data
   */
  async syncAll() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.warn('⚠️ Cannot sync while offline');
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners('sync_started', {});

    try {
      // Sync messages
      const messages = await this.getUnsyncedMessages();
      console.log(`📨 Syncing ${messages.length} messages...`);
      for (const message of messages) {
        try {
          await this.syncMessage(message);
          await this.markMessageSynced(message.id);
        } catch (error) {
          console.error(`Failed to sync message ${message.id}:`, error);
        }
      }

      // Sync posts
      const posts = await this.getUnsyncedPosts();
      console.log(`📝 Syncing ${posts.length} posts...`);
      for (const post of posts) {
        try {
          await this.syncPost(post);
        } catch (error) {
          console.error(`Failed to sync post ${post.id}:`, error);
        }
      }

      // Sync transactions
      const transactions = await this.getQueuedTransactions('pending');
      console.log(`💸 Syncing ${transactions.length} transactions...`);
      for (const tx of transactions) {
        try {
          await this.syncTransaction(tx);
        } catch (error) {
          console.error(`Failed to sync transaction ${tx.id}:`, error);
        }
      }

      console.log('✅ Sync complete');
      this.notifyListeners('sync_completed', {
        messages: messages.length,
        posts: posts.length,
        transactions: transactions.length
      });

    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.notifyListeners('sync_failed', { error: error.message });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single message (to be implemented with backend API)
   */
  async syncMessage(message) {
    // TODO: Implement actual API call
    // For now, just simulate success
    console.log('Syncing message:', message);
    return true;
  }

  /**
   * Sync a single post (to be implemented with backend API)
   */
  async syncPost(post) {
    // TODO: Implement actual API call
    console.log('Syncing post:', post);
    return true;
  }

  /**
   * Sync a single transaction (to be implemented with backend API)
   */
  async syncTransaction(transaction) {
    // TODO: Implement actual API call
    console.log('Syncing transaction:', transaction);
    return true;
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('🌐 Online');
    this.isOnline = true;
    this.notifyListeners('online', {});
    
    // Auto-sync after 1 second
    setTimeout(() => {
      this.syncAll();
    }, 1000);
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('📴 Offline');
    this.isOnline = false;
    this.notifyListeners('offline', {});
  }

  /**
   * Check if online
   */
  isConnected() {
    return this.isOnline;
  }

  /**
   * Add event listener
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   * @param {Function} listener - Callback function
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Get statistics
   */
  async getStats() {
    const [pending, messages, posts] = await Promise.all([
      this.getQueuedTransactions('pending'),
      this.getUnsyncedMessages(),
      this.getUnsyncedPosts()
    ]);

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingTransactions: pending.length,
      unsyncedMessages: messages.length,
      unsyncedPosts: posts.length,
      totalUnsynced: pending.length + messages.length + posts.length
    };
  }

  /**
   * Clear all offline data (use with caution!)
   */
  async clearAll() {
    const stores = [STORES.QUEUE, STORES.MESSAGES, STORES.POSTS, STORES.PROFILES];
    
    for (const storeName of stores) {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('🗑️ All offline data cleared');
  }

  // Helper methods
  _getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  _getAllFromIndex(index, key) {
    return new Promise((resolve, reject) => {
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  _getFromStore(store, key) {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  _putInStore(store, item) {
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineService = new OfflineService();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    offlineService.initialize().catch(console.error);
  });
} else {
  offlineService.initialize().catch(console.error);
}

export default offlineService;
