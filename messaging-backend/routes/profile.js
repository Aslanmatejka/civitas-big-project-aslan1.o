/**
 * Profile Route — Decentralized
 * Profile data is stored on IPFS via profileStorageService.
 * The in-memory store caches the latest known CID and public data.
 * Source of truth: IPFS CID (ideally pinned on DIDRegistry on-chain).
 */
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs             = require('fs');
const store          = require('../services/store');
const ipfsService    = require('../services/ipfsService');
const profileStorage = require('../services/profileStorageService');

fs.mkdirSync('uploads/profiles/', { recursive: true });

// ── File upload (profile pictures) ───────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
    filename:    (req, file, cb) => cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`)
  }),
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, /jpeg|jpg|png|gif|webp/.test(file.mimetype));
  }
});

// ── Get profile ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

    const cached = store.getUser(walletAddress);
    if (cached?.profileCid) {
      // Retrieve from IPFS
      try {
        const ipfsData = await ipfsService.getFile(cached.profileCid);
        if (ipfsData) {
          const profile = JSON.parse(ipfsData.toString());
          return res.json({ profile: profile.public || profile, cid: cached.profileCid, source: 'ipfs' });
        }
      } catch (_) { /* fall through to cached */ }
    }

    // Serve from cache
    if (cached) {
      return res.json({
        profile: { walletAddress: walletAddress.toLowerCase(), name: cached.name || 'Anonymous', avatar: cached.avatar || '👤', about: cached.about || '' },
        source: 'cache'
      });
    }

    res.status(404).json({ error: 'Profile not found' });
  } catch (err) {
    console.error('Profile GET error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Aggregate profile (IPFS + chain — stubs for now) ─────────────────────────
router.get('/aggregate', async (req, res) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
    const cached = store.getUser(walletAddress);
    res.json({
      profile: { walletAddress: walletAddress.toLowerCase(), name: cached?.name || 'Anonymous', avatar: cached?.avatar || '👤', about: cached?.about || '' },
      identity: { did: null, credentials: [] },
      wallet:   { address: walletAddress.toLowerCase(), balance: cached?.balance || '0' },
      stats:    { messages: 0, groups: 0, transactions: 0 },
      source:   'decentralized'
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update profile → save to IPFS ────────────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { walletAddress, name, about, avatar, settings } = req.body;
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

    // Update memory cache
    store.upsertUser(walletAddress, { name, about, avatar, settings });

    // Save to IPFS
    try {
      const result = await profileStorage.storeProfile({ walletAddress, name, about, avatar, settings });
      store.upsertUser(walletAddress, { profileCid: result.cid });
      return res.json({ message: 'Profile saved to IPFS', cid: result.cid });
    } catch (ipfsErr) {
      console.warn('IPFS unavailable, cached locally:', ipfsErr.message);
      return res.json({ message: 'Profile cached locally (IPFS unavailable)', cached: true });
    }
  } catch (err) {
    console.error('Profile PUT error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Upload profile picture → IPFS ─────────────────────────────────────────────
router.post('/upload-picture', upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { walletAddress } = req.body;

    const fs = require('fs').promises;
    const fileBuffer = await fs.readFile(req.file.path);

    const result = await ipfsService.uploadFile(fileBuffer, {
      filename: req.file.originalname,
      mimeType: req.file.mimetype
    });

    const url = result.url || `/uploads/profiles/${req.file.filename}`;

    // Update profile avatar in cache
    if (walletAddress) store.upsertUser(walletAddress, { avatar: url });

    // Clean up local file if IPFS succeeded
    if (!result.mock) {
      fs.unlink(req.file.path).catch(() => {});
    }

    res.json({ message: 'Picture uploaded', url, cid: result.cid });
  } catch (err) {
    console.error('Upload picture error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────
router.put('/settings', (req, res) => {
  const { walletAddress, settings } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  store.upsertUser(walletAddress, { settings });
  res.json({ message: 'Settings saved', settings });
});

module.exports = router;
