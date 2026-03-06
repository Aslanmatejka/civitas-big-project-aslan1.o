/**
 * analytics.js — CIVITAS Platform Analytics API
 * Fully in-memory — no MongoDB dependency.
 *
 * Architecture Layer 5 — Governance + Observability
 *
 * All routes registered HERE take priority over the legacy MongoDB stubs below
 * (Express early-response pattern; old handlers never execute).
 */
const express = require('express');
const router  = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBack(tf) {
  return tf === '7d' ? 7 : tf === '30d' ? 30 : 90;
}

/** Generate a random time-series of `n` days ending today. */
function timeSeries(n, volMin = 10, volMax = 500) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - i - 1) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: dateStr,
      count: Math.floor(Math.random() * (volMax - volMin)) + volMin,
      volume: parseFloat((Math.random() * (volMax * 10 - volMin * 2) + volMin * 2).toFixed(2))
    };
  });
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /overview?timeframe=7d|30d|90d
router.get('/overview', (req, res) => {
  const tf = req.query.timeframe || '30d';
  const days = daysBack(tf);

  res.json({
    success: true,
    timeframe: tf,
    overview: {
      users: {
        total:  842 + rand(0, 20),
        active: 312 + rand(0, 15),
        growth: parseFloat((rand(5, 18) + Math.random()).toFixed(1))
      },
      transactions: {
        total:  1200 + rand(0, 100),
        recent: rand(40, 120),
        volume: parseFloat((rand(80000, 120000) + Math.random() * 1000).toFixed(2)),
        growth: parseFloat((rand(3, 22) + Math.random()).toFixed(1))
      },
      governance: {
        proposals: 47 + rand(0, 5),
        votes:     380 + rand(0, 30),
        recent:    rand(2, 8),
        growth:    parseFloat((rand(1, 12) + Math.random()).toFixed(1))
      },
      marketplace: {
        listings:     68 + rand(0, 10),
        orders:       38 + rand(0, 5),
        recentOrders: rand(3, 12)
      },
      social: { posts: rand(120, 180) }
    }
  });
});

// GET /transactions/timeseries?period=30d&interval=day
router.get('/transactions/timeseries', (req, res) => {
  const period = req.query.period || '30d';
  const days   = daysBack(period);
  res.json({ success: true, period, interval: req.query.interval || 'day', data: timeSeries(days, 5, 80) });
});

// GET /users/timeseries?period=30d
router.get('/users/timeseries', (req, res) => {
  const period = req.query.period || '30d';
  const days   = daysBack(period);
  let cumulative = 600;
  const data = timeSeries(days, 2, 15).map(d => {
    cumulative += d.count;
    return { ...d, total: cumulative };
  });
  res.json({ success: true, period, data });
});

// GET /governance/timeseries?period=30d
router.get('/governance/timeseries', (req, res) => {
  const period = req.query.period || '30d';
  const days   = daysBack(period);
  const data = timeSeries(days, 0, 3).map(d => ({
    date: d.date,
    proposals: d.count,
    votes: rand(d.count * 2, d.count * 15 + 1)
  }));
  res.json({ success: true, period, data });
});

// GET /marketplace/timeseries?period=30d
router.get('/marketplace/timeseries', (req, res) => {
  const period = req.query.period || '30d';
  const days   = daysBack(period);
  const data = timeSeries(days, 1, 10).map(d => ({
    date: d.date,
    sales: d.count,
    volume: d.volume
  }));
  res.json({ success: true, period, data });
});

// GET /leaderboard/reputation?limit=10
router.get('/leaderboard/reputation', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const board = Array.from({ length: limit }, (_, i) => ({
    address: `0x${(0xA000 + i).toString(16).padStart(40, '0')}`,
    name: `Member${i + 1}`,
    reputation: 1000 - i * rand(30, 60),
    attestations: rand(2, 12)
  }));
  res.json({ success: true, leaderboard: board });
});

// GET /leaderboard/voters?limit=10
router.get('/leaderboard/voters', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const board = Array.from({ length: limit }, (_, i) => ({
    address: `0x${(0xB000 + i).toString(16).padStart(40, '0')}`,
    name: `Voter${i + 1}`,
    voteCount: rand(50, 200) - i * 5,
    totalVotingPower: parseFloat((rand(500, 5000) - i * 30).toFixed(2))
  }));
  res.json({ success: true, leaderboard: board });
});

// GET /leaderboard/sellers?limit=10
router.get('/leaderboard/sellers', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const board = Array.from({ length: limit }, (_, i) => ({
    address: `0x${(0xC000 + i).toString(16).padStart(40, '0')}`,
    name: `Seller${i + 1}`,
    salesCount: rand(20, 80) - i * 3,
    totalRevenue: parseFloat((rand(2000, 20000) - i * 500).toFixed(2))
  }));
  res.json({ success: true, leaderboard: board });
});

// GET /governance/categories
router.get('/governance/categories', (_req, res) => {
  const cats = ['Protocol Upgrade', 'Treasury', 'Community', 'Security', 'Tokenomics', 'Node Policy'];
  const data = cats.map(cat => {
    const count  = rand(3, 15);
    const passed = rand(1, count);
    return { category: cat, count, passed, rejected: count - passed, passRate: parseFloat((passed / count * 100).toFixed(1)) };
  });
  res.json({ success: true, categories: data });
});

// GET /marketplace/categories
router.get('/marketplace/categories', (_req, res) => {
  const cats = ['Consulting', 'Software', 'Design', 'Data', 'Security Audit', 'Content', 'Legal', 'Other'];
  const data = cats.map(cat => ({
    category: cat,
    count:      rand(5, 25),
    avgPrice:   parseFloat((rand(50, 800) + Math.random()).toFixed(2)),
    totalViews: rand(100, 1500)
  }));
  res.json({ success: true, categories: data });
});

// GET /reputation/distribution
router.get('/reputation/distribution', (_req, res) => {
  const buckets = [
    { range: '0-10',    count: rand(10, 30) },
    { range: '10-25',   count: rand(20, 60) },
    { range: '25-50',   count: rand(40, 100) },
    { range: '50-100',  count: rand(80, 200) },
    { range: '100-250', count: rand(100, 250) },
    { range: '250-500', count: rand(60, 150) },
    { range: '500-1000',count: rand(30, 80) }
  ];
  res.json({ success: true, distribution: buckets });
});

// GET /social/engagement?period=30d
router.get('/social/engagement', (req, res) => {
  const period = req.query.period || '30d';
  const posts  = rand(80, 180);
  res.json({
    success: true,
    period,
    engagement: {
      posts,
      likes:               rand(posts * 3, posts * 12),
      comments:            rand(posts, posts * 5),
      follows:             rand(20, 80),
      avgLikesPerPost:     parseFloat((rand(3, 12) + Math.random()).toFixed(2)),
      avgCommentsPerPost:  parseFloat((rand(1, 5) + Math.random()).toFixed(2))
    }
  });
});

// GET /token/stats — CIV token analytics
router.get('/token/stats', (_req, res) => {
  res.json({
    success: true,
    token: {
      symbol:          'CIV',
      totalSupply:     1_000_000_000,
      circulatingSupply: 220_000_000,
      staked:          rand(40_000_000, 60_000_000),
      burned:          rand(100_000, 500_000),
      holders:         rand(8000, 12000),
      price_usd:       parseFloat((rand(0, 5) + Math.random()).toFixed(4)),
      marketCap_usd:   parseFloat((rand(40_000_000, 80_000_000)).toFixed(0))
    }
  });
});

// GET /nodes/stats — node network analytics
router.get('/nodes/stats', (_req, res) => {
  res.json({
    success: true,
    nodes: {
      total:          rand(1200, 1300),
      active:         rand(850, 950),
      storageTotal_GB: rand(500_000, 800_000),
      avgUptime:       parseFloat((rand(9700, 9990) / 100).toFixed(2)),
      topRegions: [
        { region: 'us-east-1', nodes: rand(200, 300) },
        { region: 'eu-west-1', nodes: rand(150, 250) },
        { region: 'ap-south-1', nodes: rand(80, 150) }
      ]
    }
  });
});

module.exports = router;
