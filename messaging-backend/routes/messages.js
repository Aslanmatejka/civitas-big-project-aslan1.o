'use strict';
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const path    = require('path');
const multer  = require('multer');
const fs      = require('fs');
const store   = require('../services/store');

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Persisted message store
const chatData = store.collection('chatMessages');
if (!Array.isArray(chatData.list)) chatData.list = [];
const messages = chatData.list;

const now = () => new Date().toISOString();
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Multer - disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file,  cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|mp4|mp3|wav|ogg|pdf|doc|docx|txt/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Invalid file type'), ok);
  }
});

// GET /  (fetch messages between two users or in a group)
router.get('/', (req, res) => {
  const { user1, user2, groupId, limit = 50, before } = req.query;
  let query = messages.filter(m => !m.deleted);
  if (groupId) {
    query = query.filter(m => m.groupId === groupId);
  } else if (user1 && user2) {
    query = query.filter(m =>
      (m.sender === user1 && m.recipient === user2) ||
      (m.sender === user2 && m.recipient === user1)
    );
  } else {
    return res.status(400).json({ error: 'user1 & user2 or groupId required' });
  }
  if (before) query = query.filter(m => m.timestamp < before);
  query.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  const sliced = query.slice(-parseInt(limit));
  res.json({ messages: sliced, hasMore: query.length > parseInt(limit) });
});

// GET /unread-count
router.get('/unread-count', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const count = messages.filter(m => m.recipient === walletAddress && !m.read && !m.deleted).length;
  res.json({ unreadCount: count });
});

// GET /starred
router.get('/starred', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const result = messages
    .filter(m => (m.sender === walletAddress || m.recipient === walletAddress) && m.starred && !m.deleted)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 100);
  res.json({ messages: result });
});

// GET /search
router.get('/search', (req, res) => {
  const { walletAddress, query: q, groupId } = req.query;
  if (!walletAddress || !q) return res.status(400).json({ error: 'walletAddress and query required' });
  const re = new RegExp(q, 'i');
  let result = messages.filter(m =>
    (m.sender === walletAddress || m.recipient === walletAddress) &&
    m.type === 'text' &&
    re.test(m.content) &&
    !m.deleted
  );
  if (groupId) result = result.filter(m => m.groupId === groupId);
  res.json({ messages: result.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 50) });
});

// POST /send
router.post('/send', (req, res) => {
  const { sender, recipient, groupId, content, type = 'text', metadata } = req.body;
  if (!sender || (!recipient && !groupId) || !content)
    return res.status(400).json({ error: 'sender, recipient or groupId, and content required' });
  const msg = {
    id: hash(sender + (recipient || groupId) + content + now()),
    sender, recipient: recipient || null, groupId: groupId || null,
    content, type, metadata: metadata || {},
    read: false, starred: false, deleted: false,
    timestamp: now()
  };
  messages.push(msg);
  res.json({ success: true, message: msg });
});

// PUT /:id/read
router.put('/:id/read', (req, res) => {
  const msg = messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  msg.read = true;
  res.json({ success: true });
});

// PUT /:id/star
router.put('/:id/star', (req, res) => {
  const msg = messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  msg.starred = !msg.starred;
  res.json({ success: true, starred: msg.starred });
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  const msg = messages.find(m => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  msg.deleted = true;
  res.json({ success: true });
});

// POST /upload
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    fileUrl:  `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype
  });
});

module.exports = router;
