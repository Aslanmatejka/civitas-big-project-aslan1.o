/**
 * node.js — CIVITAS Node Operations API
 * Fully in-memory — no MongoDB dependency.
 * Manages CIVITAS network node lifecycle: status, start/stop, rewards, config.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// ── Persisted node store ──────────────────────────────────────────────────────
// key: walletAddress (lowercase) → node object
const nodeData = store.collection('nodes');

function defaultNode(walletAddress) {
  return {
    walletAddress,
    status: 'stopped',
    config: {
      rpcPort: 8545,
      p2pPort: 30303,
      networkId: 31337,
      storageLimit: 100
    },
    sync: {
      progress: 0,
      startingBlock: 0,
      currentBlock: 0,
      highestBlock: 145234
    },
    stats: {
      connectedPeers: 0,
      networkSpeed: 0,
      storageUsed: 0,
      blocksValidated: 0,
      transactionsProcessed: 0
    },
    rewards: {
      totalEarned: 0,
      pendingRewards: 0,
      lastClaimed: null,
      claimHistory: []
    },
    health: {
      uptime: 0,
      lastOnline: null,
      blocksValidated: 0,
      errorsInLast24h: 0
    },
    startedAt: null
  };
}

function getNode(walletAddress) {
  const key = walletAddress?.toLowerCase();
  if (!key) return null;
  if (!nodeData[key]) {
    nodeData[key] = defaultNode(walletAddress);
  }
  return nodeData[key];
}

// Simulate gradual sync using a plain JS timer (no DB needed)
function simulateSyncProgress(walletAddress) {
  const key = walletAddress.toLowerCase();
  let progress = 0;

  const interval = setInterval(() => {
    progress += 5;
    const node = nodeData[key];
    if (!node || node.status !== 'syncing') {
      clearInterval(interval);
      return;
    }

    node.sync.progress = progress;
    node.sync.currentBlock = Math.floor((progress / 100) * node.sync.highestBlock);
    node.stats.connectedPeers  = Math.floor(Math.random() * 20) + 30;
    node.stats.networkSpeed    = Math.floor(Math.random() * 1_000_000) + 1_500_000;
    node.stats.storageUsed     = Math.floor((progress / 100) * 12.4 * 10) / 10;

    if (progress >= 100) {
      node.status = 'running';
      node.sync.progress = 100;
      node.sync.currentBlock = node.sync.highestBlock;
      node.rewards.pendingRewards = 150;
      clearInterval(interval);
    }

    nodeData[key] = node;
  }, 300);
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /status?walletAddress=0x...
router.get('/status', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  res.json(getNode(walletAddress));
});

// POST /start
router.post('/start', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const node = getNode(walletAddress);
  node.status = 'syncing';
  node.startedAt = new Date();
  node.sync.progress = 0;
  node.sync.startingBlock = 0;
  node.sync.currentBlock = 0;
  node.sync.highestBlock = 145234;
  nodeData[walletAddress.toLowerCase()] = node;

  simulateSyncProgress(walletAddress);
  res.json({ message: 'Node started', node });
});

// POST /stop
router.post('/stop', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const node = getNode(walletAddress);
  if (node.status === 'stopped') {
    return res.status(400).json({ error: 'Node is already stopped' });
  }

  if (node.startedAt) {
    const uptime = Math.floor((Date.now() - new Date(node.startedAt).getTime()) / 1000);
    node.health.uptime += uptime;
  }
  node.status = 'stopped';
  node.health.lastOnline = new Date();
  nodeData[walletAddress.toLowerCase()] = node;

  res.json({ message: 'Node stopped', node });
});

// PUT /config
router.put('/config', (req, res) => {
  const { walletAddress, config } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const node = getNode(walletAddress);
  node.config = { ...node.config, ...config };
  nodeData[walletAddress.toLowerCase()] = node;

  res.json(node);
});

// POST /rewards/claim
router.post('/rewards/claim', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const node = getNode(walletAddress);
  if (node.rewards.pendingRewards <= 0) {
    return res.status(400).json({ error: 'No rewards to claim' });
  }

  const claimedAmount = node.rewards.pendingRewards;
  const txHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  node.rewards.claimHistory.push({ amount: claimedAmount, timestamp: new Date(), txHash });
  node.rewards.totalEarned += claimedAmount;
  node.rewards.pendingRewards = 0;
  node.rewards.lastClaimed = new Date();
  nodeData[walletAddress.toLowerCase()] = node;

  res.json({ message: 'Rewards claimed successfully', amount: claimedAmount, txHash, node });
});

// GET /stats?walletAddress=0x...
router.get('/stats', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const node = getNode(walletAddress);
  res.json({
    status: node.status,
    sync: node.sync,
    stats: node.stats,
    rewards: node.rewards,
    health: node.health,
    config: node.config
  });
});

// GET /network — aggregated network stats
router.get('/network', (_req, res) => {
  const totalNodes  = Object.keys(nodeData).length;
  const activeNodes = Object.values(nodeData).filter(n => n.status === 'running').length;

  res.json({
    totalNodes:          Math.max(totalNodes, 1247),   // floor at mock baseline
    activeNodes:         Math.max(activeNodes, 892),
    totalBlockHeight:    145234 + Math.floor(Date.now() / 12000), // ~12s blocks
    averageBlockTime:    12.5,
    networkHashrate:     '1.2 TH/s',
    difficulty:          2450000000000,
    averageRewardPerBlock: 2.5,
    networkStatus:       'healthy'
  });
});

// GET /peers — dummy peer list for UI
router.get('/peers', (_req, res) => {
  res.json({
    peers: Array.from({ length: 32 }, (_, i) => ({
      id: `peer-${i + 1}`,
      address: `10.0.${Math.floor(i / 16)}.${(i % 16) + 1}`,
      latency: Math.floor(Math.random() * 80) + 20,    // 20-100ms
      version: '1.0.0',
      connected: true
    }))
  });
});

module.exports = router;

