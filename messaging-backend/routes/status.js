/**
 * Status Route — Decentralized
 * Statuses are ephemeral (24-hour), stored in the in-memory persistent store.
 * Media statuses upload to IPFS via the /api/storage/upload endpoint.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// Get statuses (own + contacts)
router.get('/', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  const addr     = walletAddress.toLowerCase();
  const contacts = store.getContacts(addr).map(c => c.walletAddress);
  const all      = store.getStatuses(); // auto-filters expired

  const myStatuses      = all.filter(s => s.userId === addr);
  const contactStatuses = all.filter(s => contacts.includes(s.userId));

  res.json({ myStatuses, contactStatuses });
});

// Post status
router.post('/', (req, res) => {
  const { userId, userName, userAvatar, type, content, mediaUrl, backgroundColor } = req.body;
  if (!userId || !userName) return res.status(400).json({ error: 'userId and userName required' });
  if (type === 'text' && !content) return res.status(400).json({ error: 'content required' });
  if ((type === 'image' || type === 'video') && !mediaUrl)
    return res.status(400).json({ error: 'mediaUrl required' });

  const status = store.addStatus({ userId: userId.toLowerCase(), userName, userAvatar, type, content, mediaUrl, backgroundColor });
  res.status(201).json({ message: 'Status posted', status });
});

// View status
router.post('/:statusId/view', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const s = store.viewStatus(req.params.statusId, walletAddress.toLowerCase());
  if (!s) return res.status(404).json({ error: 'Status not found' });
  res.json({ message: 'Viewed' });
});

// Delete status
router.delete('/:statusId', (req, res) => {
  const { walletAddress } = req.query;
  store.deleteStatus(req.params.statusId, walletAddress?.toLowerCase());
  res.json({ message: 'Deleted' });
});

module.exports = router;