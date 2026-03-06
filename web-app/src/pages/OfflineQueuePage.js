import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { queueApi } from '../services/api';
import './OfflineQueuePage.css';

export default function OfflineQueuePage() {
  const { isConnected, isLoading, connectWallet, wallet } = useApp();
  const currentAccount = wallet?.address;
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, failed

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load queue and stats
  useEffect(() => {
    if (currentAccount) {
      loadQueue();
      loadStats();
    }
  }, [currentAccount, filter]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!currentAccount) return;
    
    const interval = setInterval(() => {
      loadQueue();
      loadStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentAccount, filter]);

  const loadQueue = async () => {
    try {
      const statusFilter = filter === 'all' ? '' : filter;
      const data = await queueApi.getQueue(currentAccount, statusFilter);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await queueApi.getStats(currentAccount);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmit = async (id) => {
    try {
      setIsProcessing(true);
      await queueApi.submitTransaction(id);
      await loadQueue();
      await loadStats();
    } catch (error) {
      console.error('Error submitting transaction:', error);
      alert('Failed to submit transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    if (!window.confirm('Submit all pending transactions?')) return;

    try {
      setIsProcessing(true);
      const result = await queueApi.processAll(currentAccount);
      alert(`Processed ${result.processed} transactions, ${result.failed} failed`);
      await loadQueue();
      await loadStats();
    } catch (error) {
      console.error('Error processing transactions:', error);
      alert('Failed to process transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this transaction?')) return;

    try {
      await queueApi.cancelTransaction(id);
      await loadQueue();
      await loadStats();
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      alert('Failed to cancel transaction');
    }
  };

  const handleRetry = async (id) => {
    try {
      await queueApi.retryTransaction(id);
      await loadQueue();
      await loadStats();
    } catch (error) {
      console.error('Error retrying transaction:', error);
      alert(error.response?.data?.error || 'Failed to retry transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;

    try {
      await queueApi.deleteTransaction(id);
      await loadQueue();
      await loadStats();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      transfer: '💸',
      vote: '🗳️',
      contract_call: '📝',
      marketplace: '🛒',
      governance: '⚖️',
      other: '📋'
    };
    return icons[type] || '📋';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: '⏳ Pending',
      processing: '⚙️ Processing',
      submitted: '📤 Submitted',
      confirmed: '✅ Confirmed',
      failed: '❌ Failed',
      cancelled: '🚫 Cancelled'
    };
    return badges[status] || status;
  };

  const formatTime = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diff = Math.floor((now - created) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="offline-queue-page">
        <div className="offline-queue-container">
          <div className="not-connected">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="offline-queue-page">
        <div className="offline-queue-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to manage offline transactions.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

  return (
    <div className="offline-queue-page">
      <div className="offline-queue-container">
        <div className="offline-queue-header">
          <h1>📤 Offline Transaction Queue</h1>
          <p className="subtitle">Transactions will be submitted automatically when online</p>
        </div>

        {/* Network Status */}
        <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
          <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢' : '🔴'}
          </div>
          <h3>Network Status: {isOnline ? 'Online' : 'Offline'}</h3>
          <p>
            {isOnline 
              ? 'All queued transactions can be processed' 
              : 'Transactions will be queued until connection is restored'
            }
          </p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="stats-bar">
            <div className="stat-card">
              <h4>{stats.total}</h4>
              <p>Total</p>
            </div>
            <div className="stat-card">
              <h4>{stats.pending}</h4>
              <p>⏳ Pending</p>
            </div>
            <div className="stat-card">
              <h4>{stats.processing}</h4>
              <p>⚙️ Processing</p>
            </div>
            <div className="stat-card">
              <h4>{stats.confirmed}</h4>
              <p>✅ Confirmed</p>
            </div>
            <div className="stat-card">
              <h4>{stats.failed}</h4>
              <p>❌ Failed</p>
            </div>
            <div className="stat-card">
              <h4>{stats.successRate}%</h4>
              <p>Success Rate</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="filter-bar">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Confirmed
          </button>
          <button 
            className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
            onClick={() => setFilter('failed')}
          >
            Failed
          </button>
        </div>

        {/* Queue Section */}
        <div className="queue-section">
          <div className="section-header">
            <h2>Queued Transactions ({transactions.length})</h2>
            {pendingCount > 0 && isOnline && (
              <button 
                className="btn btn-secondary"
                onClick={handleProcessAll}
                disabled={isProcessing}
              >
                {isProcessing ? '⏳ Processing...' : 'Process All'}
              </button>
            )}
          </div>

          {transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.map((tx) => (
                <div key={tx._id} className={`transaction-item status-${tx.status}`}>
                  <div className="tx-icon">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="tx-info">
                    <h3>{tx.type.replace('_', ' ').toUpperCase()}</h3>
                    {tx.description && <p className="tx-description">{tx.description}</p>}
                    {tx.data?.to && <p>To: {tx.data.to}</p>}
                    {tx.data?.amount && <p>Amount: {tx.data.amount} {tx.data.token || 'CIV'}</p>}
                    {tx.data?.proposalId && <p>Proposal: {tx.data.proposalId}</p>}
                    {tx.priority > 0 && <span className="priority-badge">Priority: {tx.priority}</span>}
                    <p className="tx-time">Created {formatTime(tx.createdAt)}</p>
                    {tx.result?.txHash && (
                      <p className="tx-hash">TxHash: {tx.result.txHash.slice(0, 10)}...{tx.result.txHash.slice(-8)}</p>
                    )}
                    {tx.result?.error && (
                      <p className="tx-error">❌ {tx.result.error}</p>
                    )}
                    {tx.retryCount > 0 && (
                      <p className="tx-retries">Retries: {tx.retryCount}/{tx.maxRetries}</p>
                    )}
                  </div>
                  <div className="tx-status">
                    <span className={`status-badge ${tx.status}`}>
                      {getStatusBadge(tx.status)}
                    </span>
                  </div>
                  <div className="tx-actions">
                    {tx.status === 'pending' && isOnline && (
                      <>
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleSubmit(tx._id)}
                          disabled={isProcessing}
                        >
                          Submit Now
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleCancel(tx._id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {tx.status === 'failed' && tx.retryCount < tx.maxRetries && (
                      <button 
                        className="btn btn-warning"
                        onClick={() => handleRetry(tx._id)}
                      >
                        Retry
                      </button>
                    )}
                    {(tx.status === 'confirmed' || tx.status === 'cancelled' || tx.status === 'failed') && (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleDelete(tx._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-queue">
              <div className="empty-icon">📭</div>
              <h3>No Queued Transactions</h3>
              <p>Transactions created while offline will appear here</p>
            </div>
          )}
        </div>

        <div className="info-box">
          <h3>ℹ️ How It Works</h3>
          <ul>
            <li>Create transactions even when offline</li>
            <li>Transactions are queued locally and encrypted</li>
            <li>Auto-submit when connection is restored</li>
            <li>Review and edit queued transactions anytime</li>
            <li>Failed transactions can be retried up to {transactions[0]?.maxRetries || 3} times</li>
            <li>Completed transactions are stored for 30 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
