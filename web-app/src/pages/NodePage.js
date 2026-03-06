import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { nodeApi } from '../services/api';
import './NodePage.css';

export default function NodePage() {
  const { isConnected, isLoading, connectWallet, wallet } = useApp();
  const [nodeData, setNodeData] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (wallet?.address) {
      loadNodeStatus();
      loadNetworkInfo();
      
      // Poll for updates when node is running or syncing
      const interval = setInterval(() => {
        if (nodeData?.status === 'syncing' || nodeData?.status === 'running') {
          loadNodeStatus();
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [wallet?.address, nodeData?.status]);

  const loadNodeStatus = async () => {
    try {
      const response = await nodeApi.getStatus(wallet.address);
      setNodeData(response.data);
    } catch (error) {
      console.error('Error loading node status:', error);
    }
  };

  const loadNetworkInfo = async () => {
    try {
      const response = await nodeApi.getNetworkInfo();
      setNetworkInfo(response.data);
    } catch (error) {
      console.error('Error loading network info:', error);
    }
  };

  const handleStartNode = async () => {
    setIsProcessing(true);
    try {
      await nodeApi.startNode(wallet.address);
      await loadNodeStatus();
    } catch (error) {
      console.error('Error starting node:', error);
      alert('Failed to start node. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopNode = async () => {
    setIsProcessing(true);
    try {
      await nodeApi.stopNode(wallet.address);
      await loadNodeStatus();
    } catch (error) {
      console.error('Error stopping node:', error);
      alert('Failed to stop node.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!nodeData?.rewards?.pendingRewards || nodeData.rewards.pendingRewards <= 0) {
      alert('No rewards to claim yet!');
      return;
    }

    try {
      const response = await nodeApi.claimRewards(wallet.address);
      alert(`Successfully claimed ${response.data.amount} CIV tokens!`);
      await loadNodeStatus();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards.');
    }
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '0 KB/s';
    const mbps = bytesPerSecond / (1024 * 1024);
    return `${mbps.toFixed(2)} MB/s`;
  };

  const nodeStatus = nodeData?.status || 'stopped';
  const syncProgress = nodeData?.sync?.progress || 0;

  if (isLoading) {
    return (
      <div className="node-page">
        <div className="node-container">
          <div className="not-connected">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="node-page">
        <div className="node-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to manage your node.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="node-page">
      <div className="node-container">
        <div className="node-header">
          <h1>Node Management</h1>
          <p className="subtitle">Run your own CIVITAS node to support the network</p>
        </div>

        <div className="node-status-card">
          <div className="status-info">
            <h3>Node Status</h3>
            <div className={`status-badge ${nodeStatus}`}>
              {nodeStatus === 'running' && '🟢 Running'}
              {nodeStatus === 'syncing' && '🟡 Syncing'}
              {nodeStatus === 'stopped' && '🔴 Stopped'}
            </div>
          </div>
          
          {nodeStatus === 'syncing' && (
            <div className="sync-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${syncProgress}%` }}></div>
              </div>
              <p>Syncing: {syncProgress}% ({nodeData?.sync?.currentBlock?.toLocaleString()} / {nodeData?.sync?.highestBlock?.toLocaleString()} blocks)</p>
            </div>
          )}

          <div className="node-actions">
            {nodeStatus === 'stopped' && (
              <button 
                className="btn btn-primary" 
                onClick={handleStartNode}
                disabled={isProcessing}
              >
                {isProcessing ? 'Starting...' : 'Start Node'}
              </button>
            )}
            {(nodeStatus === 'running' || nodeStatus === 'syncing') && (
              <button 
                className="btn btn-secondary" 
                onClick={handleStopNode}
                disabled={isProcessing}
              >
                {isProcessing ? 'Stopping...' : 'Stop Node'}
              </button>
            )}
          </div>
        </div>

        {nodeStatus === 'running' && nodeData && (
          <>
            <div className="node-stats">
              <h2>Node Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⛓️</div>
                  <div className="stat-value">{nodeData.sync.currentBlock?.toLocaleString()}</div>
                  <div className="stat-label">Blocks Synced</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-value">{nodeData.stats.connectedPeers}</div>
                  <div className="stat-label">Connected Peers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-value">{formatSpeed(nodeData.stats.networkSpeed)}</div>
                  <div className="stat-label">Network Speed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💎</div>
                  <div className="stat-value">{nodeData.rewards.pendingRewards} CIV</div>
                  <div className="stat-label">Pending Rewards</div>
                </div>
              </div>
              
              {nodeData.rewards.pendingRewards > 0 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={handleClaimRewards}
                  >
                    Claim {nodeData.rewards.pendingRewards} CIV Rewards
                  </button>
                </div>
              )}
              
              {nodeData.rewards.totalEarned > 0 && (
                <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
                  Total earned: {nodeData.rewards.totalEarned} CIV
                </div>
              )}
            </div>

            <div className="node-config">
              <h2>Configuration</h2>
              <div className="config-grid">
                <div className="config-item">
                  <span className="config-label">RPC Port:</span>
                  <span className="config-value">{nodeData.config.rpcPort}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">P2P Port:</span>
                  <span className="config-value">{nodeData.config.p2pPort}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Network ID:</span>
                  <span className="config-value">{nodeData.config.networkId}</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Storage Used:</span>
                  <span className="config-value">{nodeData.stats.storageUsed} GB</span>
                </div>
              </div>
            </div>
          </>
        )}

        {networkInfo && (
          <div className="network-info">
            <h2>Network Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Total Nodes:</span>
                <span className="info-value">{networkInfo.totalNodes}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Active Nodes:</span>
                <span className="info-value">{networkInfo.activeNodes}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Block Height:</span>
                <span className="info-value">{networkInfo.totalBlockHeight?.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Block Time:</span>
                <span className="info-value">{networkInfo.averageBlockTime}s</span>
              </div>
            </div>
          </div>
        )}

        <div className="node-info">
          <h3>💡 Why Run a Node?</h3>
          <ul>
            <li>Earn rewards for validating transactions</li>
            <li>Increase network decentralization and security</li>
            <li>Get priority transaction processing</li>
            <li>Support the CIVITAS ecosystem</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
