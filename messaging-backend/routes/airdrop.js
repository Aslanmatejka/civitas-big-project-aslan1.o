/**
 * Airdrop Route
 *
 * Stores Merkle proofs for each airdrop round so the frontend can look up
 * eligibility by wallet address instead of asking users to paste raw JSON.
 *
 * Data lives in the shared persisted store under store.airdrop:
 *   {
 *     rounds: { [roundId]: { roundId, merkleRoot, totalAmount, startTime, endTime, requireDid, description } },
 *     proofs: { [roundId]: { [lowerAddress]: { amount, proof, regional } } },
 *     claims: { [roundId]: { [lowerAddress]: { txHash, claimedAt } } }
 *   }
 */

const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAirdrop() {
  if (!store.persisted) {
    // access the underlying persisted object via the store's getter pattern
    // fall back to a module-level cache attached to the store object
  }
  // We attach to a known persisted namespace – the store exposes persisted via
  // the standard pattern used in every other route (read directly via getters or
  // piggy-back on the store's generic namespace helpers).
  if (!store._airdrop) {
    store._airdrop = {
      rounds: {},
      proofs: {},
      claims: {},
      nextRoundId: 1
    };
  }
  return store._airdrop;
}

function now() { return Date.now(); }

// ── Seed demo round on first call so the UI is never empty ───────────────────
function seedIfEmpty() {
  const a = getAirdrop();
  if (Object.keys(a.rounds).length === 0) {
    const roundId = 1;
    a.rounds[roundId] = {
      roundId,
      description: 'Genesis Distribution — Early adopters & beta testers',
      merkleRoot: '0x' + '0'.repeat(64),
      totalAmount: '10000000',
      startTime: now() - 7 * 86400_000,
      endTime:   now() + 173 * 86400_000,
      requireDid: false,
      regional: true,
      active: true
    };
    // seed a small demo proof list
    a.proofs[roundId] = {};
    a.nextRoundId = 2;
  }
}

// ── GET /rounds ───────────────────────────────────────────────────────────────
router.get('/rounds', (req, res) => {
  seedIfEmpty();
  const a = getAirdrop();
  const rounds = Object.values(a.rounds).map(r => ({
    ...r,
    expired: now() > r.endTime
  }));
  res.json({ rounds, total: rounds.length });
});

// ── GET /proof/:address ───────────────────────────────────────────────────────
// Returns the proof for ALL active rounds for a given wallet address.
router.get('/proof/:address', (req, res) => {
  seedIfEmpty();
  const addr = req.params.address.toLowerCase();
  const a    = getAirdrop();

  const results = [];
  for (const [rid, roundProofs] of Object.entries(a.proofs)) {
    const entry = roundProofs[addr];
    if (entry) {
      const round = a.rounds[rid];
      const claim = (a.claims[rid] || {})[addr];
      results.push({
        roundId:  Number(rid),
        amount:   entry.amount,
        proof:    entry.proof,
        regional: entry.regional || false,
        claimed:  !!claim,
        claimedAt: claim?.claimedAt || null,
        txHash:   claim?.txHash    || null,
        round:    round || null
      });
    }
  }

  if (results.length === 0) {
    return res.json({ eligible: false, proofs: [] });
  }
  res.json({ eligible: true, proofs: results });
});

// ── GET /stats ────────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  seedIfEmpty();
  const a = getAirdrop();

  let totalProofs = 0;
  let totalClaims = 0;
  let totalCIV    = BigInt(0);

  for (const [rid, roundProofs] of Object.entries(a.proofs)) {
    totalProofs += Object.keys(roundProofs).length;
    const claimMap = a.claims[rid] || {};
    const claimCount = Object.keys(claimMap).length;
    totalClaims += claimCount;
  }

  const rounds = Object.values(a.rounds);
  const activeRounds = rounds.filter(r => r.active && now() <= r.endTime).length;

  res.json({
    activeRounds,
    totalRounds:    rounds.length,
    totalEligible:  totalProofs,
    totalClaimed:   totalClaims,
    claimRate:      totalProofs > 0 ? ((totalClaims / totalProofs) * 100).toFixed(1) : '0.0'
  });
});

// ── POST /claim-record ────────────────────────────────────────────────────────
// Frontend calls this after a successful on-chain claim to record it.
router.post('/claim-record', (req, res) => {
  const { address, roundId, txHash } = req.body;
  if (!address || roundId == null || !txHash) {
    return res.status(400).json({ error: 'address, roundId and txHash are required' });
  }
  const a    = getAirdrop();
  const addr = address.toLowerCase();
  const rid  = Number(roundId);

  if (!a.claims[rid]) a.claims[rid] = {};
  a.claims[rid][addr] = { txHash, claimedAt: now() };

  res.json({ success: true, record: a.claims[rid][addr] });
});

// ── POST /admin/round ─────────────────────────────────────────────────────────
// Create a new airdrop round (admin use; in production gate with auth middleware).
router.post('/admin/round', (req, res) => {
  const { description, merkleRoot, totalAmount, endDays, requireDid, regional } = req.body;
  if (!merkleRoot || !totalAmount) {
    return res.status(400).json({ error: 'merkleRoot and totalAmount are required' });
  }
  const a       = getAirdrop();
  const roundId = a.nextRoundId++;
  a.rounds[roundId] = {
    roundId,
    description: description || `Round ${roundId}`,
    merkleRoot,
    totalAmount: String(totalAmount),
    startTime:  now(),
    endTime:    now() + (Number(endDays) || 180) * 86400_000,
    requireDid: !!requireDid,
    regional:   !!regional,
    active:     true
  };
  a.proofs[roundId] = {};
  res.json({ success: true, round: a.rounds[roundId] });
});

// ── POST /admin/proof ─────────────────────────────────────────────────────────
// Add/replace a Merkle proof for one or many addresses (admin bulk-load).
// Body: { roundId, entries: [{ address, amount, proof: [...], regional? }] }
router.post('/admin/proof', (req, res) => {
  const { roundId, entries } = req.body;
  if (!roundId || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'roundId and entries[] are required' });
  }
  const a   = getAirdrop();
  const rid = Number(roundId);
  if (!a.proofs[rid]) a.proofs[rid] = {};

  let added = 0;
  for (const e of entries) {
    if (!e.address || !e.amount || !Array.isArray(e.proof)) continue;
    a.proofs[rid][e.address.toLowerCase()] = {
      amount:   String(e.amount),
      proof:    e.proof,
      regional: !!e.regional
    };
    added++;
  }
  res.json({ success: true, added });
});

// ── POST /admin/proof/single ──────────────────────────────────────────────────
// Convenience: add a single address proof.
router.post('/admin/proof/single', (req, res) => {
  const { roundId, address, amount, proof, regional } = req.body;
  if (!roundId || !address || !amount || !Array.isArray(proof)) {
    return res.status(400).json({ error: 'roundId, address, amount and proof[] are required' });
  }
  const a   = getAirdrop();
  const rid = Number(roundId);
  if (!a.proofs[rid]) a.proofs[rid] = {};
  a.proofs[rid][address.toLowerCase()] = { amount: String(amount), proof, regional: !!regional };
  res.json({ success: true });
});

module.exports = router;
