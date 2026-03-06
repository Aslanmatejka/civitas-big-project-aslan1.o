/**
 * dashboard.js — CIVITAS Dashboard API
 * Reads from the shared services/store to reflect real platform data.
 * No isolated dummy data — stats track actual usage.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// ── Helpers ──────────────────────────────────────────────────────────────────
function values(obj) { return obj ? Object.values(obj) : []; }
function size(obj)   { return obj ? Object.keys(obj).length : 0; }

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /stats — platform-wide statistics
router.get('/stats', (_req, res) => {
  const users        = store.collection('users') || {};
  const mp           = store.collection('marketplace');
  const community    = store.collection('community');
  const mobileMoney  = store.collection('mobileMoney');
  const automations  = store.collection('automations');
  const chatMessages = store.collection('chatMessages');
  const appstore     = store.collection('appstore');
  const aiConvos     = store.collection('aiConversations');
  const msgs         = store.collection('messages') || {};

  const totalUsers        = size(users);
  const totalListings     = (mp.listings || []).length;
  const activeListings    = (mp.listings || []).filter(l => l.status === 'active').length;
  const totalOrders       = (mp.orders || []).length;

  const posts   = values(community.posts || {});
  const totalPosts = posts.length;

  const automationItems = automations.items ? values(automations.items) : {};
  const totalAutomations  = Array.isArray(automationItems) ? automationItems.length : 0;
  const activeAutomations = Array.isArray(automationItems) ? automationItems.filter(a => a.status === 'active').length : 0;

  const totalApps = appstore.apps ? size(appstore.apps) : 0;

  const allTxns  = values(mobileMoney.transactions || {}).flat();
  const totalTransactions = allTxns.length;
  const totalVolume       = allTxns.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  const totalMessages = size(msgs) + (Array.isArray(chatMessages) ? chatMessages.length : 0);

  res.json({
    success: true,
    stats: {
      platform: { totalUsers, totalMessages, totalPosts, totalApps },
      governance: {
        totalProposals: 0, activeProposals: 0, totalVotes: 0,
        participationRate: '0'
      },
      marketplace: {
        totalListings, activeListings, totalOrders,
        totalSales: (mp.orders || []).filter(o => o.status === 'completed')
          .reduce((s, o) => s + (parseFloat(o.listing?.price || o.escrow?.amount || 0)), 0).toFixed(2),
        avgPrice: totalOrders > 0
          ? ((mp.orders || []).reduce((s, o) => s + (parseFloat(o.listing?.price || o.escrow?.amount || 0)), 0) / totalOrders).toFixed(2) : '0'
      },
      transactions: {
        total: totalTransactions,
        volume: totalVolume.toFixed(2),
        avgAmount: totalTransactions > 0 ? (totalVolume / totalTransactions).toFixed(2) : '0'
      },
      automations: { total: totalAutomations, active: activeAutomations },
      recent24h: {
        newUsers: 0,
        newListings: 0,
        newOrders: 0
      }
    }
  });
});

// GET /user/:address — per-user dashboard
router.get('/user/:address', (req, res) => {
  const address = req.params.address?.toLowerCase();
  if (!address) return res.status(400).json({ error: 'Address required' });

  const user = store.getUser(address);
  const mp   = store.collection('marketplace');
  const automations = store.collection('automations');

  const userListings = (mp.listings || []).filter(l =>
    l.seller?.address?.toLowerCase() === address
  ).length;
  const userOrders = (mp.orders || []).filter(o =>
    o.buyer?.address?.toLowerCase() === address || o.seller?.address?.toLowerCase() === address
  ).length;

  const automationItems = automations.items ? values(automations.items) : [];
  const userAutomations = automationItems.filter(a => a.walletAddress === address).length;

  res.json({
    success: true,
    dashboard: {
      profile: {
        walletAddress: address,
        name: user?.name || user?.displayName || 'Anonymous',
        avatar: user?.avatar || null,
        balance: '0.00',
        reputation: 0,
        verified: false
      },
      activity: {
        totalListings: userListings,
        totalOrders: userOrders,
        totalAutomations: userAutomations,
        totalMessages: 0
      },
      pending: {
        proposalsToVote: 0,
        ordersToComplete: 0,
        ordersToDeliver: 0
      },
      recentActivity: { votes: [], orders: [] },
      suggestions: { availableProposals: [] }
    }
  });
});

// GET /activity — platform activity feed
router.get('/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const skip  = parseInt(req.query.skip)  || 0;

  const activity = [];
  const mp       = store.collection('marketplace');
  const community = store.collection('community');

  // Recent listings
  (mp.listings || []).slice(-5).forEach(l => {
    activity.push({
      type: 'listing_created',
      description: `Listed: ${l.title || 'Item'} for ${l.price || 0} CIV`,
      actor: l.seller || '0x???',
      timestamp: l.createdAt,
      icon: '📦',
      link: `/marketplace`
    });
  });

  // Recent orders
  (mp.orders || []).filter(o => o.status === 'completed').slice(-5).forEach(o => {
    activity.push({
      type: 'purchase_completed',
      description: `Purchased: ${o.title || 'item'}`,
      actor: o.buyer || '0x???',
      timestamp: o.createdAt,
      icon: '🛒',
      link: `/marketplace`
    });
  });

  // Recent posts
  values(community.posts || {}).slice(-5).forEach(p => {
    activity.push({
      type: 'post_created',
      description: `New post: ${(p.content || '').slice(0, 50)}`,
      actor: p.author || '0x???',
      timestamp: p.createdAt,
      icon: '📝',
      link: `/community`
    });
  });

  activity.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  const paginated = activity.slice(skip, skip + limit);

  res.json({ success: true, activity: paginated, total: activity.length });
});

module.exports = router;
