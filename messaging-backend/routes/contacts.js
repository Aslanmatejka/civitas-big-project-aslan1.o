/**
 * Contacts Route — Decentralized
 * Contacts are stored in the in-memory persistent store (JSON file).
 * In production, rebuild from XMTP conversation history.
 */
const express = require('express');
const router = express.Router();
const store   = require('../services/store');

// Search users (by name or wallet address)
router.get('/search', (req, res) => {
  const { query, walletAddress } = req.query;
  if (!query || query.length < 2) return res.json({ success: true, users: [] });
  let results = store.searchUsers(query);
  // Exclude the requester from results
  if (walletAddress) {
    results = results.filter(u => u.walletAddress !== walletAddress.toLowerCase());
  }
  res.json({ success: true, users: results.slice(0, 20) });
});

// Get contacts
router.get('/', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const contacts = store.getContacts(walletAddress).map(c => ({
    ...c,
    isOnline: store.isOnline(c.walletAddress),
    avatar: store.getUser(c.walletAddress)?.avatar || '👤',
    name: store.getUser(c.walletAddress)?.name || c.name || c.walletAddress.slice(0, 8)
  }));
  res.json({ success: true, contacts });
});

// Add contact
router.post('/add', (req, res) => {
  const { walletAddress, contactAddress, contactName } = req.body;
  if (!walletAddress || !contactAddress) return res.status(400).json({ error: 'Both addresses required' });
  const contacts = store.addContact(walletAddress, contactAddress, contactName);
  res.json({ success: true, message: 'Contact added', contacts });
});

// Remove contact
router.delete('/:contactAddress', (req, res) => {
  const { walletAddress } = req.query;
  const { contactAddress } = req.params;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  store.removeContact(walletAddress, contactAddress);
  res.json({ success: true, message: 'Contact removed' });
});

// Block user
router.post('/block', (req, res) => {
  const { walletAddress, blockAddress } = req.body;
  if (!walletAddress || !blockAddress) return res.status(400).json({ error: 'Both addresses required' });
  store.blockContact(walletAddress, blockAddress);
  res.json({ success: true, message: 'User blocked' });
});

module.exports = router;
