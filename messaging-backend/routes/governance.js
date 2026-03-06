/**
 * Governance Route — Decentralized
 * Proposals and Votes are stored on-chain via GovernanceDAO smart contract.
 * This backend provides read-through caching and off-chain discussion metadata.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// ── Helper: get persisted governance collection ───────────────────────────────
function gov() {
  const g = store.collection('governance');
  if (!g.proposals) g.proposals = {};
  if (!g.votes) g.votes = {};
  return g;
}

// ── Proposals ─────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const list = Object.values(gov().proposals).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ proposals: list });
});

router.get('/active', (req, res) => {
  const now = Date.now();
  const active = Object.values(gov().proposals).filter(p => p.status === 'active' && p.endTime > now);
  res.json({ proposals: active });
});

// ── URL aliases (must come before /:proposalId to avoid param swallowing) ─────

// GET /proposals — frontend calls this instead of /
router.get('/proposals', (req, res) => {
  const { status, category, limit = 50, skip = 0 } = req.query;
  let list = Object.values(gov().proposals).sort((a, b) => b.createdAt - a.createdAt);
  if (status && status !== 'null') list = list.filter(p => p.status === status);
  if (category && category !== 'null') list = list.filter(p => p.category === category);
  res.json({ proposals: list.slice(Number(skip), Number(skip) + Number(limit)) });
});

router.post('/proposals/create', (req, res) => {
  const { proposalId, proposerAddress, title, description, category, options, duration } = req.body;
  const creator = proposerAddress || req.body.creator;
  if (!creator) return res.status(400).json({ error: 'proposerAddress required' });
  const id = proposalId || `prop_${Date.now()}`;
  const durationMs = (duration || 7) * 24 * 60 * 60 * 1000;
  const proposal = {
    proposalId: id, creator: creator.toLowerCase(), title, description, category,
    options: options || ['Yes', 'No', 'Abstain'], status: 'active',
    createdAt: Date.now(), endTime: Date.now() + durationMs,
    votes: { yes: 0, no: 0, abstain: 0 }, totalVotes: 0, quorum: false
  };
  gov().proposals[id] = proposal;
  store.save();
  res.status(201).json({ message: 'Proposal created', proposal });
});

router.get('/proposals/:proposalId', (req, res) => {
  const p = gov().proposals[req.params.proposalId];
  if (!p) return res.status(404).json({ error: 'Proposal not found' });
  res.json({ proposal: p });
});

// POST /votes/submit — frontend submit helper
router.post('/votes/submit', (req, res) => {
  const { proposalId, voterAddress, voteType, transactionHash } = req.body;
  const support = voteType === 'for' ? 'yes' : voteType === 'against' ? 'no' : 'abstain';
  const g = gov();
  const p = g.proposals[proposalId];
  if (p) {
    if (!g.votes[proposalId]) g.votes[proposalId] = [];
    const proposalVotes = g.votes[proposalId];
    if (!proposalVotes.find(v => v.voter === voterAddress?.toLowerCase())) {
      proposalVotes.push({ voter: voterAddress?.toLowerCase(), support, transactionHash, timestamp: Date.now() });
      if (support === 'yes') p.votes.yes += 1;
      else if (support === 'no') p.votes.no += 1;
      else p.votes.abstain += 1;
      p.totalVotes += 1;
      store.save();
    }
  }
  res.json({ message: 'Vote recorded', success: true });
});

router.get('/votes/user/:address', (req, res) => {
  const addr = req.params.address.toLowerCase();
  const g = gov();
  const userVotes = [];
  for (const [proposalId, voteList] of Object.entries(g.votes)) {
    const vote = voteList.find(v => v.voter === addr);
    if (vote) userVotes.push({ ...vote, proposalId });
  }
  res.json({ votes: userVotes });
});

router.get('/votes/proposal/:proposalId', (req, res) => {
  res.json({ votes: gov().votes[req.params.proposalId] || [] });
});

// Voting power — computed from on-chain data; stub here
router.get('/voting-power/:walletAddress', (req, res) => {
  res.json({ votingPower: 1, breakdown: { balance: 0, reputation: 0 } });
});

// ── Parameterized routes (must come after all static paths above) ──────────────

router.post('/create', (req, res) => {
  const { proposalId, creator, title, description, category, options, duration } = req.body;
  if (!creator || !title) return res.status(400).json({ error: 'creator and title required' });

  const id = proposalId || `prop_${Date.now()}`;
  const durationMs = (duration || 7) * 24 * 60 * 60 * 1000;

  const proposal = {
    proposalId: id,
    creator: creator.toLowerCase(),
    title, description, category,
    options: options || ['Yes', 'No', 'Abstain'],
    status: 'active',
    createdAt: Date.now(),
    endTime: Date.now() + durationMs,
    votes: { yes: 0, no: 0, abstain: 0 },
    totalVotes: 0,
    quorum: false
  };

  gov().proposals[id] = proposal;
  store.save();
  res.status(201).json({ message: 'Proposal created', proposal });
});

// ── Voting ─────────────────────────────────────────────────────────────────────

router.post('/:proposalId/vote', (req, res) => {
  const { walletAddress, support, reason, votingPower } = req.body;
  const g = gov();
  const p = g.proposals[req.params.proposalId];
  if (!p) return res.status(404).json({ error: 'Proposal not found' });
  if (p.status !== 'active') return res.status(400).json({ error: 'Voting closed' });

  if (!g.votes[req.params.proposalId]) g.votes[req.params.proposalId] = [];
  const proposalVotes = g.votes[req.params.proposalId];
  if (proposalVotes.find(v => v.voter === walletAddress?.toLowerCase()))
    return res.status(409).json({ error: 'Already voted' });

  const power = votingPower || 1;
  proposalVotes.push({ voter: walletAddress?.toLowerCase(), support, reason, power, timestamp: Date.now() });

  if (support === 'yes') p.votes.yes += power;
  else if (support === 'no') p.votes.no += power;
  else p.votes.abstain += power;
  p.totalVotes += power;

  store.save();
  res.json({ message: 'Vote cast', votes: p.votes });
});

router.get('/:proposalId/votes', (req, res) => {
  res.json({ votes: gov().votes[req.params.proposalId] || [] });
});

module.exports = router;
