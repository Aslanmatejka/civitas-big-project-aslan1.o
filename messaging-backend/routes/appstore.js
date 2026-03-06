/**
 * CIVITAS App Store — Decentralized Application Registry
 *
 * Stores app metadata in-memory (persisted via services/store.js).
 * App bundles/installers live on IPFS — this is just the catalog.
 */

const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const store    = require('../services/store');

// ─── Seed data — curated dApps for the CIVITAS ecosystem ─────────────────────
const SEED_APPS = [
  {
    id: 'civitas-messenger',
    name: 'CIVITAS Messenger',
    tagline: 'Encrypted P2P messaging powered by XMTP',
    description:
      'The reference CIVITAS messaging app. All messages are end-to-end encrypted, stored on XMTP — no servers, no metadata leaks. Voice notes, file sharing, group chats.',
    icon: '💬',
    category: 'Messaging',
    version: '1.0.0',
    platforms: ['web', 'pwa'],
    developer: 'CIVITAS Core',
    developerAddress: '0x0000000000000000000000000000000000000001',
    website: 'https://civitas.app/messaging',
    ipfsCid: null,
    downloadUrl: '/messaging',
    isInternal: true,
    license: 'MIT',
    tags: ['xmtp', 'messaging', 'encrypted', 'p2p'],
    installs: 4820,
    rating: 4.9,
    ratingCount: 312,
    featured: true,
    verified: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'civitas-wallet',
    name: 'CIVITAS Wallet',
    tagline: 'Non-custodial multi-chain wallet with DID support',
    description:
      'Manage your crypto assets, CIV tokens, and decentralized identity in one place. Connect any hardware wallet, swap tokens, and interact with governance — all from a self-custodial wallet you truly own.',
    icon: '💰',
    category: 'Finance',
    version: '1.2.1',
    platforms: ['web', 'pwa', 'android', 'ios'],
    developer: 'CIVITAS Core',
    developerAddress: '0x0000000000000000000000000000000000000001',
    website: 'https://civitas.app/wallet',
    ipfsCid: null,
    downloadUrl: '/wallet',
    isInternal: true,
    license: 'MIT',
    tags: ['wallet', 'defi', 'did', 'multi-chain'],
    installs: 9130,
    rating: 4.8,
    ratingCount: 541,
    featured: true,
    verified: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'civitas-governance',
    name: 'CIVITAS Governance',
    tagline: 'On-chain voting and proposal management',
    description:
      'Participate in decentralized governance. Submit proposals, vote with quadratic weighting, delegate stake. All votes are recorded on-chain via the GovernanceDAO smart contract.',
    icon: '🏛️',
    category: 'Governance',
    version: '1.1.0',
    platforms: ['web', 'pwa'],
    developer: 'CIVITAS Core',
    developerAddress: '0x0000000000000000000000000000000000000001',
    website: 'https://civitas.app/governance',
    ipfsCid: null,
    downloadUrl: '/governance',
    isInternal: true,
    license: 'MIT',
    tags: ['governance', 'dao', 'voting', 'on-chain'],
    installs: 3210,
    rating: 4.7,
    ratingCount: 198,
    featured: true,
    verified: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ipfs-drive',
    name: 'IPFS Drive',
    tagline: 'Decentralized cloud storage on IPFS',
    description:
      'Your personal IPFS-backed drive. Upload, share and pin files to the distributed web. No single server, no downtime. Files addressed by content hash, not location.',
    icon: '🗄️',
    category: 'Storage',
    version: '2.0.3',
    platforms: ['web', 'pwa', 'desktop'],
    developer: 'Protocol Labs Community',
    developerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    website: 'https://ipfs.io',
    ipfsCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    downloadUrl: 'https://ipfs.io/install',
    isInternal: false,
    license: 'Apache-2.0',
    tags: ['ipfs', 'storage', 'files', 'pinning'],
    installs: 18400,
    rating: 4.6,
    ratingCount: 893,
    featured: true,
    verified: true,
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'did-manager',
    name: 'DID Manager',
    tagline: 'Self-sovereign identity on any device',
    description:
      'Create and manage W3C-compliant Decentralized Identifiers (DIDs). Issue verifiable credentials, build a reputation profile, and authenticate across dApps — no usernames, no passwords.',
    icon: '🪪',
    category: 'Identity',
    version: '1.4.0',
    platforms: ['web', 'pwa', 'android', 'ios', 'desktop'],
    developer: 'CIVITAS Identity Team',
    developerAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    website: 'https://civitas.app/identity',
    ipfsCid: null,
    downloadUrl: '/identity',
    isInternal: true,
    license: 'MIT',
    tags: ['did', 'identity', 'ssi', 'credentials'],
    installs: 6750,
    rating: 4.8,
    ratingCount: 441,
    featured: true,
    verified: true,
    createdAt: '2025-02-10T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'defi-swap',
    name: 'CivSwap',
    tagline: 'Decentralized token exchange — your keys, your trade',
    description:
      'A lightweight AMM-based DEX that runs entirely in the browser. Connect your wallet, swap any ERC-20 token, provide liquidity, and earn fees — no sign-up, no KYC, no custodian.',
    icon: '🔄',
    category: 'Finance',
    version: '0.9.5',
    platforms: ['web'],
    developer: 'CivSwap DAO',
    developerAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
    website: 'https://civswap.xyz',
    ipfsCid: 'QmYwAPJzv5CZsnAzt8auV39szv3J5q5gQh6PNUoSsXnGH',
    downloadUrl: 'https://civswap.xyz',
    isInternal: false,
    license: 'GPL-3.0',
    tags: ['defi', 'dex', 'swap', 'amm', 'liquidity'],
    installs: 12300,
    rating: 4.5,
    ratingCount: 679,
    featured: false,
    verified: true,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'node-runner',
    name: 'CIVITAS Node Runner',
    tagline: 'Run a full CIVITAS node on your device',
    description:
      'Become part of the CIVITAS network infrastructure. Validate transactions, store data shards, earn CIV rewards, and help keep the network decentralized. Available for Linux, macOS, and Windows.',
    icon: '⚡',
    category: 'Infrastructure',
    version: '1.0.1',
    platforms: ['desktop', 'linux', 'macos', 'windows'],
    developer: 'CIVITAS Core',
    developerAddress: '0x0000000000000000000000000000000000000001',
    website: 'https://civitas.app/node',
    ipfsCid: 'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
    downloadUrl: 'https://civitas.app/node/download',
    isInternal: false,
    license: 'MIT',
    tags: ['node', 'validator', 'infrastructure', 'earn'],
    installs: 2180,
    rating: 4.6,
    ratingCount: 134,
    featured: false,
    verified: true,
    createdAt: '2025-04-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'nft-gallery',
    name: 'NFT Gallery',
    tagline: 'Showcase and trade your digital collectibles',
    description:
      'A fully decentralized NFT gallery. Browse, mint, list, and trade NFTs stored on IPFS with on-chain provenance. Supports ERC-721 and ERC-1155 standards. No platform fees.',
    icon: '🖼️',
    category: 'Social',
    version: '1.1.2',
    platforms: ['web', 'pwa'],
    developer: 'OpenArt Collective',
    developerAddress: '0xdddddddddddddddddddddddddddddddddddddddd',
    website: 'https://openart.example',
    ipfsCid: 'QmfM2r8seH2GiRaC4esTjeraXEachRt8ZsSeGaWTPLyMoG',
    downloadUrl: 'https://openart.example',
    isInternal: false,
    license: 'MIT',
    tags: ['nft', 'art', 'collectibles', 'ipfs'],
    installs: 7640,
    rating: 4.4,
    ratingCount: 388,
    featured: false,
    verified: true,
    createdAt: '2025-05-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'decentral-blog',
    name: 'Mirror Blog',
    tagline: 'Publish writing permanently on the decentralized web',
    description:
      'Write, publish, and monetize your content on IPFS and Arweave. Your articles can never be censored or taken down. Token-gate content, accept tips, and build a paid subscriber community.',
    icon: '📝',
    category: 'Social',
    version: '2.3.1',
    platforms: ['web', 'pwa'],
    developer: 'Mirror Protocol',
    developerAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    website: 'https://mirror.xyz',
    ipfsCid: null,
    downloadUrl: 'https://mirror.xyz',
    isInternal: false,
    license: 'MIT',
    tags: ['publishing', 'blog', 'arweave', 'content'],
    installs: 5920,
    rating: 4.7,
    ratingCount: 267,
    featured: false,
    verified: true,
    createdAt: '2025-05-15T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'privacy-vpn',
    name: 'DePIN VPN',
    tagline: 'Decentralized VPN — privacy with no central server',
    description:
      'Route your traffic through a peer-to-peer encrypted VPN network. No central logging, no single point of failure. Nodes are operated by community members who earn token rewards.',
    icon: '🔒',
    category: 'Tools',
    version: '0.8.2',
    platforms: ['android', 'ios', 'desktop', 'windows', 'macos', 'linux'],
    developer: 'DePIN Network',
    developerAddress: '0xffffffffffffffffffffffffffffffffffffffff',
    website: 'https://depin.network',
    ipfsCid: 'QmRCaiMQzmqQmTDnfNDSGdsRHGGbZpMsMF8BiVBnkPaqPM',
    downloadUrl: 'https://depin.network/download',
    isInternal: false,
    license: 'GPL-3.0',
    tags: ['vpn', 'privacy', 'depin', 'p2p'],
    installs: 9870,
    rating: 4.5,
    ratingCount: 512,
    featured: false,
    verified: false,
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'automation-tools',
    name: 'CIVITAS Automation',
    tagline: 'Trigger smart-contract workflows without code',
    description:
      'Build no-code automation flows that interact with smart contracts, IPFS, XMTP, and external APIs. Schedule transactions, set conditions, and chain actions — all running on decentralized keeper nodes.',
    icon: '⚙️',
    category: 'Tools',
    version: '1.0.0',
    platforms: ['web'],
    developer: 'CIVITAS Core',
    developerAddress: '0x0000000000000000000000000000000000000001',
    website: 'https://civitas.app/automation',
    ipfsCid: null,
    downloadUrl: '/automation',
    isInternal: true,
    license: 'MIT',
    tags: ['automation', 'workflow', 'smart-contracts', 'no-code'],
    installs: 1870,
    rating: 4.3,
    ratingCount: 89,
    featured: false,
    verified: true,
    createdAt: '2025-07-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ai-agent',
    name: 'CivAI Assistant',
    tagline: 'On-device AI with no data sent to central servers',
    description:
      'A privacy-first AI assistant that runs inference locally (WebLLM / WASM) or delegates to community-operated nodes. Summarize documents, write smart contracts, and automate DeFi strategies.',
    icon: '🤖',
    category: 'AI',
    version: '0.5.0',
    platforms: ['web', 'desktop'],
    developer: 'CIVITAS AI Guild',
    developerAddress: '0x1234567890123456789012345678901234567890',
    website: 'https://civitas.app/ai',
    ipfsCid: null,
    downloadUrl: '/ai',
    isInternal: true,
    license: 'MIT',
    tags: ['ai', 'llm', 'on-device', 'privacy'],
    installs: 3340,
    rating: 4.4,
    ratingCount: 176,
    featured: true,
    verified: true,
    createdAt: '2025-08-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

// ─── Persisted registry ───────────────────────────────────────────────────────

const appData    = store.collection('appstore');

// Seed only on first run (empty store)
if (!appData.apps) {
  appData.apps = {};
  SEED_APPS.forEach(a => { appData.apps[a.id] = { ...a }; });
}
if (!appData.reviews) appData.reviews = {};

const CATEGORIES = [
  'Messaging', 'Finance', 'Governance', 'Storage',
  'Identity', 'Social', 'Infrastructure', 'Tools', 'AI'
];

const PLATFORMS = ['web', 'pwa', 'android', 'ios', 'desktop', 'linux', 'macos', 'windows'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toArray() {
  return Object.values(appData.apps);
}

function computeStats(app) {
  const reviews = appData.reviews[app.id] || [];
  if (!Array.isArray(reviews) || reviews.length === 0) return app;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { ...app, rating: Math.round(avg * 10) / 10, ratingCount: reviews.length };
}

// ─── GET /api/appstore/categories ─────────────────────────────────────────────
router.get('/categories', (req, res) => {
  const counts = {};
  CATEGORIES.forEach(c => { counts[c] = 0; });
  toArray().forEach(a => { if (counts[a.category] !== undefined) counts[a.category]++; });
  res.json({ categories: CATEGORIES, platforms: PLATFORMS, counts });
});

// ─── GET /api/appstore/apps ───────────────────────────────────────────────────
// Query params: category, platform, search, sort, featured, verified, page, limit
router.get('/apps', (req, res) => {
  let apps = toArray().map(computeStats);

  const { category, platform, search, sort, featured, verified, page = 1, limit = 20 } = req.query;

  if (category)  apps = apps.filter(a => a.category.toLowerCase() === category.toLowerCase());
  if (platform)  apps = apps.filter(a => a.platforms.includes(platform.toLowerCase()));
  if (featured === 'true')  apps = apps.filter(a => a.featured);
  if (verified  === 'true') apps = apps.filter(a => a.verified);
  if (search) {
    const q = search.toLowerCase();
    apps = apps.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.tagline.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      (a.tags || []).some(t => t.includes(q))
    );
  }

  // Sorting
  switch (sort) {
    case 'installs': apps.sort((a, b) => b.installs - a.installs); break;
    case 'rating':   apps.sort((a, b) => b.rating  - a.rating);   break;
    case 'newest':   apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    default:         apps.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
  }

  // Pagination
  const total  = apps.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paged  = apps.slice(offset, offset + parseInt(limit));

  res.json({ apps: paged, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
});

// ─── GET /api/appstore/apps/featured ─────────────────────────────────────────
router.get('/apps/featured', (req, res) => {
  const featured = toArray().filter(a => a.featured).map(computeStats);
  res.json({ apps: featured });
});

// ─── GET /api/appstore/apps/:id ───────────────────────────────────────────────
router.get('/apps/:id', (req, res) => {
  const app = appData.apps[req.params.id];
  if (!app) return res.status(404).json({ error: 'App not found' });
  const reviews = appData.reviews[app.id] || [];
  res.json({ ...computeStats(app), reviews });
});

// ─── POST /api/appstore/apps ──────────────────────────────────────────────────
// Submit a new dApp to the store (community-submitted)
router.post('/apps', (req, res) => {
  const { name, tagline, description, icon, category, version, platforms, developer,
          developerAddress, website, ipfsCid, downloadUrl, license, tags } = req.body;

  if (!name || !description || !category || !developerAddress) {
    return res.status(400).json({ error: 'name, description, category, and developerAddress are required' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uuidv4().slice(0, 6);
  const app = {
    id,
    name,
    tagline: tagline || '',
    description,
    icon: icon || '📦',
    category,
    version: version || '1.0.0',
    platforms: Array.isArray(platforms) ? platforms : ['web'],
    developer: developer || 'Community',
    developerAddress,
    website: website || '',
    ipfsCid: ipfsCid || null,
    downloadUrl: downloadUrl || website || '',
    isInternal: false,
    license: license || 'MIT',
    tags: Array.isArray(tags) ? tags : [],
    installs: 0,
    rating: 0,
    ratingCount: 0,
    featured: false,
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  appData.apps[id] = app;
  res.status(201).json({ success: true, app });
});

// ─── POST /api/appstore/apps/:id/install ─────────────────────────────────────
router.post('/apps/:id/install', (req, res) => {
  const app = appData.apps[req.params.id];
  if (!app) return res.status(404).json({ error: 'App not found' });
  app.installs++;
  app.updatedAt = new Date().toISOString();
  res.json({ success: true, installs: app.installs });
});

// ─── POST /api/appstore/apps/:id/rate ────────────────────────────────────────
router.post('/apps/:id/rate', (req, res) => {
  const { rating, comment, reviewerAddress } = req.body;
  const app = appData.apps[req.params.id];
  if (!app) return res.status(404).json({ error: 'App not found' });
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1–5' });
  if (!reviewerAddress)                     return res.status(400).json({ error: 'reviewerAddress required' });

  if (!appData.reviews[app.id]) appData.reviews[app.id] = [];
  const reviews = appData.reviews[app.id];

  // Replace existing review by same address
  const idx = reviews.findIndex(r => r.reviewer.toLowerCase() === reviewerAddress.toLowerCase());
  const review = { reviewer: reviewerAddress, rating: parseInt(rating), comment: comment || '', createdAt: new Date().toISOString() };
  if (idx >= 0) reviews[idx] = review; else reviews.push(review);

  res.json({ success: true, ...computeStats(app) });
});

// ─── PUT /api/appstore/apps/:id ───────────────────────────────────────────────
// Developer can update their own app
router.put('/apps/:id', (req, res) => {
  const app = appData.apps[req.params.id];
  if (!app) return res.status(404).json({ error: 'App not found' });

  const { callerAddress, ...updates } = req.body;
  if (app.developerAddress && callerAddress &&
      app.developerAddress.toLowerCase() !== callerAddress.toLowerCase()) {
    return res.status(403).json({ error: 'Only the developer can update this app' });
  }

  // Allowed fields to update
  const allowed = ['name', 'tagline', 'description', 'icon', 'version', 'platforms',
                   'website', 'ipfsCid', 'downloadUrl', 'license', 'tags'];
  allowed.forEach(k => { if (updates[k] !== undefined) app[k] = updates[k]; });
  app.updatedAt = new Date().toISOString();

  res.json({ success: true, app });
});

// ─── DELETE /api/appstore/apps/:id ───────────────────────────────────────────
router.delete('/apps/:id', (req, res) => {
  const app = appData.apps[req.params.id];
  if (!app) return res.status(404).json({ error: 'App not found' });

  const { callerAddress } = req.body;
  if (app.developerAddress && callerAddress &&
      app.developerAddress.toLowerCase() !== callerAddress.toLowerCase()) {
    return res.status(403).json({ error: 'Only the developer can delete this app' });
  }
  delete appData.apps[req.params.id];
  res.json({ success: true });
});

module.exports = router;
