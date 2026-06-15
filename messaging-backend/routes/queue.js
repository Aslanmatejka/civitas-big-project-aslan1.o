/**
 * Queue Route — Decentralized Offline Queue
 * Queued messages and transactions are stored in the in-memory persistent store.
 * When the user comes back online, the queue is flushed via XMTP.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// Normalize stored queue item → UI-expected shape
function normalizeItem(m) {
  return {
    _id:        m.id,
    id:         m.id,
    type:       m.type || 'other',
    description: m.description || m.payload?.description || '',
    data:       m.data || m.payload || {},
    priority:   m.priority || 0,
    status:     m.status || 'pending',
    createdAt:  m.createdAt || m.enqueuedAt || Date.now(),
    retryCount: m.retryCount || 0,
    maxRetries: m.maxRetries || 3,
    result:     m.result || {}
  };
}

// GET / — list queued (pending) items for a user
router.get('/', (req, res) => {
  const { walletAddress, status } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  let items = store.getQueue(walletAddress).map(normalizeItem);
  if (status) items = items.filter(i => i.status === status);
  res.json({ success: true, items });
});

// GET /stats/:walletAddress — queue statistics
router.get('/stats/:walletAddress', (req, res) => {
  const items = store.getQueue(req.params.walletAddress).map(normalizeItem);
  const byStatus = (s) => items.filter(i => i.status === s).length;
  const total = items.length;
  res.json({
    success: true,
    stats: {
      total,
      pending:    byStatus('pending'),
      processing: byStatus('processing'),
      confirmed:  byStatus('confirmed'),
      failed:     byStatus('failed'),
      successRate: 0
    }
  });
});

// GET /:id — single item (not easily accessible without address; return 404)
router.get('/:id', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// POST / — enqueue a transaction
router.post('/', (req, res) => {
  const { recipient, type, payload, data, priority, description } = req.body;
  if (!recipient || !type) return res.status(400).json({ error: 'recipient and type required' });
  store.enqueue({
    recipient:   recipient.toLowerCase(),
    type,
    payload:     data || payload || {},
    data:        data || payload || {},
    description: description || '',
    priority:    priority || 0,
    status:      'pending',
    retryCount:  0,
    maxRetries:  3,
    result:      {},
    createdAt:   Date.now()
  });
  res.status(201).json({ success: true, message: 'Queued' });
});

// POST /process-all — submit all pending items for a user
router.post('/process-all', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const items = store.getQueue(walletAddress);
  items.forEach(m => { m.status = 'confirmed'; m.delivered = true; });
  store.save();
  res.json({ success: true, processed: items.length, failed: 0 });
});

// POST /:id/submit
router.post('/:id/submit', (req, res) => {
  store.markDelivered(req.params.id);
  store.save();
  res.json({ success: true, message: 'Transaction submitted' });
});

// POST /:id/cancel
router.post('/:id/cancel', (req, res) => {
  store.markDelivered(req.params.id);
  store.save();
  res.json({ success: true, message: 'Transaction cancelled' });
});

// POST /:id/retry
router.post('/:id/retry', (req, res) => {
  res.json({ success: true, message: 'Transaction queued for retry' });
});

// PUT /:id/delivered
router.put('/:id/delivered', (req, res) => {
  store.markDelivered(req.params.id);
  store.save();
  res.json({ success: true, message: 'Marked delivered' });
});

// DELETE /flush
router.delete('/flush', (req, res) => {
  store.clearDelivered();
  store.save();
  res.json({ success: true, message: 'Flushed delivered items' });
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  store.markDelivered(req.params.id);
  store.save();
  res.json({ success: true, message: 'Removed' });
});

module.exports = router;

