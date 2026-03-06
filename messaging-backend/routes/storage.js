/**
 * Storage Route — Decentralized IPFS Storage
 * All files are uploaded to IPFS. Metadata is cached in the in-memory store.
 * No MongoDB — source of truth is the IPFS CID.
 * The /upload endpoint is called by the web-app's ipfsService.js.
 */
const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const crypto     = require('crypto');
const path       = require('path');
const fs         = require('fs').promises;
const ipfsService = require('../services/ipfsService');
const store       = require('../services/store');

// Ensure uploads directory exists
require('fs').mkdirSync('uploads/storage', { recursive: true });

// Multer: temp storage before IPFS upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/storage/'),
    filename:    (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

// ── List files ────────────────────────────────────────────────────────────────
router.get('/files', (req, res) => {
  const { walletAddress, folder } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const files = store.getFiles(walletAddress, folder);
  res.json(files);
});

// ── Get single file metadata ──────────────────────────────────────────────────
router.get('/files/:id', (req, res) => {
  const file = store.getFile(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.json(file);
});

// ── Upload file to IPFS ───────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { walletAddress, folder, tags, description, visibility, encrypted } = req.body;
    const fileBuffer = await fs.readFile(req.file.path);

    // Upload to IPFS (or fallback to local)
    const uploadResult = await ipfsService.uploadFile(fileBuffer, {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      encrypt:  encrypted === 'true'
    });

    const url = uploadResult.url || `${process.env.SERVER_URL || 'http://localhost:3001'}/uploads/storage/${req.file.filename}`;

    // Cache metadata in store
    const record = store.saveFile({
      walletAddress: walletAddress?.toLowerCase(),
      name:          req.file.filename,
      originalName:  req.file.originalname,
      size:          req.file.size,
      mimeType:      req.file.mimetype,
      cid:           uploadResult.cid,
      hash:          uploadResult.hash || crypto.createHash('sha256').update(fileBuffer).digest('hex'),
      url,
      encrypted:     encrypted === 'true',
      encryptionKey: uploadResult.encryptionKey,
      visibility:    visibility || 'private',
      folder:        folder || 'root',
      tags:          tags ? tags.split(',').map(t => t.trim()) : [],
      description:   description || '',
      ipfs:          !uploadResult.mock
    });

    // Clean up local temp file if IPFS upload worked
    if (!uploadResult.mock) {
      fs.unlink(req.file.path).catch(() => {});
    }

    console.log(`📦 File stored: ${record.originalName} | CID: ${record.cid}`);

    res.status(201).json({
      message:  'File uploaded successfully',
      id:       record.id,
      cid:      record.cid,
      url,
      name:     record.originalName,
      size:     record.size,
      mimeType: record.mimeType,
      ipfs:     record.ipfs
    });

  } catch (err) {
    console.error('Storage upload error:', err);
    res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
});

// ── Update file metadata ──────────────────────────────────────────────────────
router.put('/files/:id', (req, res) => {
  const file = store.getFile(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  Object.assign(file, req.body, { updatedAt: Date.now() });
  res.json({ message: 'Updated', file });
});

// ── Delete (soft) ─────────────────────────────────────────────────────────────
router.delete('/files/:id', (req, res) => {
  store.deleteFile(req.params.id);
  res.json({ message: 'File deleted (IPFS pin remains until garbage collected)' });
});

// ── IPFS status ───────────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json(ipfsService.getStatus ? ipfsService.getStatus() : { mode: 'unknown' });
});

// ── Share file ────────────────────────────────────────────────────────────────
router.post('/files/:id/share', (req, res) => {
  const file = store.getFile(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  const { shareWith } = req.body;
  if (!file.sharedWith) file.sharedWith = [];
  if (shareWith && !file.sharedWith.includes(shareWith.toLowerCase())) {
    file.sharedWith.push(shareWith.toLowerCase());
  }
  store.save();
  res.json({ success: true, message: 'File shared', file });
});

// ── Toggle pin ────────────────────────────────────────────────────────────────
router.patch('/files/:id/pin', (req, res) => {
  const file = store.getFile(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  file.pinned = !file.pinned;
  store.save();
  res.json({ success: true, pinned: file.pinned, file });
});

// ── Storage stats for a user ──────────────────────────────────────────────────
router.get('/stats/:walletAddress', (req, res) => {
  const files = store.getFiles(req.params.walletAddress);
  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);
  const ipfsFiles = files.filter(f => f.ipfs);
  res.json({
    success: true,
    stats: {
      totalFiles: files.length,
      totalSize,
      ipfsFiles: ipfsFiles.length,
      pinnedFiles: files.filter(f => f.pinned).length
    }
  });
});

// ── Search files ──────────────────────────────────────────────────────────────
router.get('/search', (req, res) => {
  const { walletAddress, query, folder } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  let files = store.getFiles(walletAddress, folder);
  if (query) {
    const q = query.toLowerCase();
    files = files.filter(f =>
      (f.originalName || '').toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      (f.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }
  res.json({ success: true, files });
});

module.exports = router;
