/**
 * Auth Route — Decentralized
 * Authentication is wallet-signature based. No passwords, no MongoDB.
 * User profiles are cached in the in-memory store; source of truth is IPFS.
 */
const express = require('express');
const router = express.Router();
const store   = require('../services/store');

// Register / Login — wallet address is the identity, no password
router.post('/register', (req, res) => {
  const { walletAddress, name } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const existing = store.getUser(walletAddress);
  const user = store.upsertUser(walletAddress, {
    name: name || existing?.name || 'Anonymous',
    isOnline: true,
    lastSeen: Date.now()
  });
  store.setOnline(walletAddress);

  return res.status(existing ? 200 : 201).json({
    message: existing ? 'User logged in' : 'User registered',
    user: { walletAddress: user.walletAddress, name: user.name, avatar: user.avatar || '👤', about: user.about || '' }
  });
});

// Logout — just marks offline
router.post('/logout', (req, res) => {
  const { walletAddress } = req.body;
  if (walletAddress) {
    store.upsertUser(walletAddress, { isOnline: false, lastSeen: Date.now() });
    store.setOffline(walletAddress);
  }
  res.json({ message: 'Logged out' });
});

module.exports = router;
