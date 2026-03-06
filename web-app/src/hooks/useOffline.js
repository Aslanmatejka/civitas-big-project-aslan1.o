/**
 * useOffline Hook
 * 
 * React hook for offline functionality
 * Provides easy access to offline service features
 */

import { useState, useEffect, useCallback } from 'react';
import offlineService from '../services/offlineService';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [stats, setStats] = useState(null);

  // Update stats
  const updateStats = useCallback(async () => {
    try {
      const newStats = await offlineService.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to get offline stats:', error);
    }
  }, []);

  // Handle offline service events
  useEffect(() => {
    const handleEvent = (event, data) => {
      switch (event) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'sync_started':
          setSyncInProgress(true);
          break;
        case 'sync_completed':
        case 'sync_failed':
          setSyncInProgress(false);
          updateStats();
          break;
        case 'queue_added':
        case 'queue_updated':
        case 'queue_deleted':
          updateStats();
          break;
      }
    };

    offlineService.addListener(handleEvent);
    updateStats();

    return () => {
      offlineService.removeListener(handleEvent);
    };
  }, [updateStats]);

  // Queue a transaction
  const queueTransaction = useCallback(async (transaction) => {
    try {
      const id = await offlineService.queueTransaction(transaction);
      await updateStats();
      return id;
    } catch (error) {
      console.error('Failed to queue transaction:', error);
      throw error;
    }
  }, [updateStats]);

  // Get queued transactions
  const getQueuedTransactions = useCallback(async (status = null) => {
    try {
      return await offlineService.getQueuedTransactions(status);
    } catch (error) {
      console.error('Failed to get queued transactions:', error);
      return [];
    }
  }, []);

  // Cache a message
  const cacheMessage = useCallback(async (message) => {
    try {
      const id = await offlineService.cacheMessage(message);
      await updateStats();
      return id;
    } catch (error) {
      console.error('Failed to cache message:', error);
      throw error;
    }
  }, [updateStats]);

  // Cache a profile
  const cacheProfile = useCallback(async (walletAddress, profile) => {
    try {
      await offlineService.cacheProfile(walletAddress, profile);
    } catch (error) {
      console.error('Failed to cache profile:', error);
    }
  }, []);

  // Get cached profile
  const getCachedProfile = useCallback(async (walletAddress) => {
    try {
      return await offlineService.getCachedProfile(walletAddress);
    } catch (error) {
      console.error('Failed to get cached profile:', error);
      return null;
    }
  }, []);

  // Cache a post
  const cachePost = useCallback(async (post) => {
    try {
      const id = await offlineService.cachePost(post);
      await updateStats();
      return id;
    } catch (error) {
      console.error('Failed to cache post:', error);
      throw error;
    }
  }, [updateStats]);

  // Trigger manual sync
  const syncAll = useCallback(async () => {
    try {
      await offlineService.syncAll();
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }, []);

  // Delete transaction
  const deleteTransaction = useCallback(async (id) => {
    try {
      await offlineService.deleteTransaction(id);
      await updateStats();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  }, [updateStats]);

  return {
    // State
    isOnline,
    syncInProgress,
    stats,
    
    // Methods
    queueTransaction,
    getQueuedTransactions,
    cacheMessage,
    cacheProfile,
    getCachedProfile,
    cachePost,
    syncAll,
    deleteTransaction,
    updateStats
  };
}

export default useOffline;
