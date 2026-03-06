/**
 * Identity Route — Decentralized
 * DIDs, Verifiable Credentials, and Reputation are stored on-chain through
 * the DIDRegistry smart contract and on IPFS. This backend only maintains an
 * in-memory cache and provides convenience endpoints; it is NOT the source of
 * truth — the blockchain is.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');
const repSvc  = require('../services/reputationService');

// ── Helper: get persisted identity collection ─────────────────────────────────
function ids() {
  const i = store.collection('identities');
  if (!i.dids) i.dids = {};
  if (!i.activityLog) i.activityLog = [];
  return i;
}

// ── DID Management ────────────────────────────────────────────────────────────

router.post('/did/create', (req, res) => {
  const { walletAddress, did, didDocument } = req.body;
  if (!walletAddress || !did || !didDocument)
    return res.status(400).json({ error: 'walletAddress, did, didDocument required' });

  const addr = walletAddress.toLowerCase();
  if (ids().dids[addr])
    return res.status(409).json({ error: 'DID already exists for this wallet' });

  const record = {
    did, walletAddress: addr,
    didDocument, createdAt: Date.now(),
    reputation: { total: 50, factors: { transactionHistory: 20, communityEngagement: 10, governanceParticipation: 10, verifiedCredentials: 10 } },
    credentials: []
  };
  ids().dids[addr] = record;
  ids().activityLog.push({ walletAddress: addr, type: 'did_created', did, timestamp: Date.now() });
  store.save();
  res.status(201).json({ message: 'DID created', identity: record });
});

router.get('/did/:walletAddress', (req, res) => {
  const record = ids().dids[req.params.walletAddress.toLowerCase()];
  if (!record) return res.status(404).json({ error: 'DID not found' });
  res.json({ identity: record });
});

router.put('/did/:walletAddress', (req, res) => {
  const { didDocument } = req.body;
  const addr = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  if (!record) return res.status(404).json({ error: 'DID not found' });
  record.didDocument = didDocument;
  record.updatedAt = Date.now();
  store.save();
  res.json({ message: 'DID updated', identity: record });
});

// ── Verifiable Credentials ─────────────────────────────────────────────────────

router.post('/credentials/issue', (req, res) => {
  const { holderWalletAddress, type, claims, issuerWalletAddress } = req.body;
  if (!holderWalletAddress || !type || !claims)
    return res.status(400).json({ error: 'holderWalletAddress, type, claims required' });

  const credential = {
    id: `vc_${Date.now()}`,
    type, claims,
    issuer: issuerWalletAddress || 'self',
    issuedAt: Date.now(),
    status: 'active'
  };

  const holder = ids().dids[holderWalletAddress.toLowerCase()];
  if (holder) {
    holder.credentials.push(credential);
    ids().activityLog.push({ walletAddress: holderWalletAddress.toLowerCase(), type: 'credential_issued', credentialType: type, timestamp: Date.now() });
    store.save();
  }

  res.status(201).json({ message: 'Credential issued', credential });
});

router.get('/credentials/:walletAddress', (req, res) => {
  const record = ids().dids[req.params.walletAddress.toLowerCase()];
  res.json({ credentials: record?.credentials || [] });
});

// ── Reputation ────────────────────────────────────────────────────────────────

// GET  /api/identity/reputation/:walletAddress
// Tries on-chain first; falls back to in-memory cache.
router.get('/reputation/:walletAddress', async (req, res) => {
  const addr   = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  const did    = record?.did;

  // Attempt on-chain read
  if (did) {
    try {
      const onChain = await repSvc.getReputation(did);
      if (onChain) {
        // Merge with in-memory cache and return
        if (record) record.reputation = { ...record.reputation, ...onChain };
        return res.json({ reputation: onChain, source: 'blockchain' });
      }
    } catch { /* fall through to cache */ }
  }

  res.json({
    reputation: record?.reputation || { total: 0 },
    source: 'cache'
  });
});

// PUT  /api/identity/reputation/:walletAddress
// Writes on-chain if BLOCKCHAIN_ADMIN_KEY is set (owner-only contract call),
// always updates in-memory cache as well.
router.put('/reputation/:walletAddress', async (req, res) => {
  const { delta, newTotal, reason } = req.body;
  const addr   = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  if (!record) return res.status(404).json({ error: 'DID not found' });

  // Compute new total
  const current  = record.reputation?.total || 0;
  const updated  = newTotal !== undefined
    ? Math.max(0, Math.min(1000, newTotal))
    : Math.max(0, Math.min(1000, current + (delta || 0)));

  record.reputation.total = updated;

  // Attempt on-chain write
  let txHash = null;
  if (record.did) {
    try {
      const result = await repSvc.setReputation(record.did, updated);
      if (result) txHash = result.txHash;
    } catch { /* non-fatal — in-memory already updated */ }
  }

  store.save();
  res.json({
    message: 'Reputation updated',
    reputation: record.reputation,
    txHash,
    source: txHash ? 'blockchain' : 'cache'
  });
});

// GET  /api/identity/chain-health
// Reports blockchain connectivity status.
router.get('/chain-health', async (req, res) => {
  const status = await repSvc.healthCheck();
  res.json(status);
});

// GET  /api/identity/did-document/:did
// Returns raw on-chain DID document.
router.get('/did-document/:did', async (req, res) => {
  const didString = decodeURIComponent(req.params.did);
  const doc = await repSvc.getDIDDocument(didString);
  if (!doc) return res.status(404).json({ error: 'DID not found on-chain' });
  res.json({ document: doc });
});

// ── Activity log (persisted) ──────────────────────────────────────────────────

router.get('/activity/:walletAddress', (req, res) => {
  const addr = req.params.walletAddress.toLowerCase();
  const activities = (ids().activityLog || []).filter(a => a.walletAddress === addr).slice(-50);
  res.json({ activities });
});

// ── Frontend URL Aliases ──────────────────────────────────────────────────────
// Frontend calls /identity/:addr but backend uses /did/:addr

router.get('/identity/:walletAddress', (req, res) => {
  const record = ids().dids[req.params.walletAddress.toLowerCase()];
  if (!record) {
    // Return a default identity structure so the frontend doesn't crash
    return res.json({
      identity: {
        did: null,
        walletAddress: req.params.walletAddress.toLowerCase(),
        didDocument: null,
        reputation: { total: 0, factors: {} },
        credentials: []
      }
    });
  }
  res.json({ identity: record });
});

router.post('/identity/:walletAddress', (req, res) => {
  const { did, didDocument } = req.body;
  const walletAddress = req.params.walletAddress.toLowerCase();
  if (ids().dids[walletAddress])
    return res.json({ message: 'DID already exists', identity: ids().dids[walletAddress] });

  const record = {
    did: did || `did:civitas:${walletAddress}`,
    walletAddress,
    didDocument: didDocument || {},
    createdAt: Date.now(),
    reputation: { total: 50, factors: {} },
    credentials: []
  };
  ids().dids[walletAddress] = record;
  ids().activityLog.push({ walletAddress, type: 'identity_created', timestamp: Date.now() });
  store.save();
  res.status(201).json({ message: 'Identity created', identity: record });
});

router.put('/identity/:walletAddress', (req, res) => {
  const addr = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  if (!record) return res.status(404).json({ error: 'Identity not found' });
  Object.assign(record, req.body, { updatedAt: Date.now() });
  store.save();
  res.json({ message: 'Identity updated', identity: record });
});

// POST /identity/:addr/reputation  — frontend update reputation helper
router.post('/identity/:walletAddress/reputation', async (req, res) => {
  const addr = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  const { delta, newTotal } = req.body;
  const current = record?.reputation?.total || 0;
  const updated = newTotal !== undefined
    ? Math.max(0, Math.min(1000, newTotal))
    : Math.max(0, Math.min(1000, current + (delta || 0)));
  if (record) record.reputation = { ...record.reputation, total: updated };
  store.save();
  res.json({ reputation: { total: updated }, source: 'cache' });
});

// Guardians management
router.get('/identity/:walletAddress/guardians', (req, res) => {
  const record = ids().dids[req.params.walletAddress.toLowerCase()];
  res.json({ guardians: record?.guardians || [] });
});
router.post('/identity/:walletAddress/guardians', (req, res) => {
  const addr = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  if (!record) return res.status(404).json({ error: 'Identity not found' });
  if (!record.guardians) record.guardians = [];
  const guardian = { ...req.body, addedAt: Date.now() };
  record.guardians.push(guardian);
  store.save();
  res.status(201).json({ message: 'Guardian added', guardian });
});
router.delete('/identity/:walletAddress/guardians/:guardianAddress', (req, res) => {
  const addr = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  if (record?.guardians) {
    record.guardians = record.guardians.filter(
      g => g.address?.toLowerCase() !== req.params.guardianAddress.toLowerCase()
    );
    store.save();
  }
  res.json({ message: 'Guardian removed' });
});

// Privacy settings
router.get('/identity/:walletAddress/privacy', (req, res) => {
  const record = ids().dids[req.params.walletAddress.toLowerCase()];
  res.json({ privacy: record?.privacy || { profileVisibility: 'public', credentialVisibility: 'selective' } });
});
router.put('/identity/:walletAddress/privacy', (req, res) => {
  const addr = req.params.walletAddress.toLowerCase();
  const record = ids().dids[addr];
  if (!record) return res.status(404).json({ error: 'Identity not found' });
  record.privacy = { ...record.privacy, ...req.body };
  store.save();
  res.json({ message: 'Privacy settings updated', privacy: record.privacy });
});

// Credentials: frontend calls /credentials/holder/:addr  — alias for /credentials/:addr
router.get('/credentials/holder/:walletAddress', (req, res) => {
  const record = ids().dids[req.params.walletAddress.toLowerCase()];
  res.json({ credentials: record?.credentials || [] });
});

module.exports = router;
