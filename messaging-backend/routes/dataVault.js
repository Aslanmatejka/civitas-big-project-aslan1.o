/**
 * CIVITAS Data Vault — Backend Proxy Route
 *
 * All provider credentials are passed per-request via:
 *   Header: x-vault-provider   (provider id string, e.g. "pinata")
 *   Header: x-vault-credentials (JSON string of credential fields)
 *
 * NOTHING is stored server-side. This is a pure stateless proxy.
 */

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { PROVIDERS, verifyCredentials, uploadFile, listFiles } = require('../services/dataVaultService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// ─── Helper: parse credentials from request ───────────────────────────────────
function parseCreds(req) {
  try {
    const raw = req.headers['x-vault-credentials'];
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseProvider(req) {
  return req.headers['x-vault-provider'] || req.body?.provider || req.query?.provider;
}

// ─── GET /api/datavault/providers ─────────────────────────────────────────────
// Returns the static provider catalog (no credentials needed)
router.get('/providers', (req, res) => {
  const list = Object.values(PROVIDERS).map(p => ({
    id:               p.id,
    name:             p.name,
    icon:             p.icon,
    tagline:          p.tagline,
    description:      p.description,
    website:          p.website,
    tech:             p.tech,
    freeTier:         p.freeTier,
    credentialFields: p.credentialFields
  }));
  res.json({ providers: list });
});

// ─── POST /api/datavault/verify ───────────────────────────────────────────────
// Test a provider connection with submitted credentials
router.post('/verify', async (req, res) => {
  const providerId = parseProvider(req);
  const creds      = parseCreds(req) || req.body?.credentials;

  if (!providerId) return res.status(400).json({ error: 'x-vault-provider header required' });
  if (!creds)      return res.status(400).json({ error: 'x-vault-credentials header or body.credentials required' });
  if (!PROVIDERS[providerId]) return res.status(400).json({ error: `Unknown provider: ${providerId}` });

  try {
    const result = await verifyCredentials(providerId, creds);
    res.json(result);
  } catch (err) {
    res.status(502).json({ ok: false, message: err.message });
  }
});

// ─── POST /api/datavault/upload ───────────────────────────────────────────────
// Upload a file (multipart) to the specified provider
router.post('/upload', upload.single('file'), async (req, res) => {
  const providerId = parseProvider(req);
  const creds      = parseCreds(req);

  if (!providerId) return res.status(400).json({ error: 'x-vault-provider header required' });
  if (!creds)      return res.status(400).json({ error: 'x-vault-credentials header required' });
  if (!req.file)   return res.status(400).json({ error: 'No file in request' });
  if (!PROVIDERS[providerId]) return res.status(400).json({ error: `Unknown provider: ${providerId}` });

  try {
    const result = await uploadFile(
      providerId,
      creds,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(502).json({ success: false, error: err.message });
  }
});

// ─── POST /api/datavault/upload-json ─────────────────────────────────────────
// Upload arbitrary JSON data (e.g. CIVITAS profile backup) to a provider
router.post('/upload-json', async (req, res) => {
  const providerId = parseProvider(req);
  const creds      = parseCreds(req);
  const { data, filename } = req.body;

  if (!providerId) return res.status(400).json({ error: 'x-vault-provider header required' });
  if (!creds)      return res.status(400).json({ error: 'x-vault-credentials header required' });
  if (!data)       return res.status(400).json({ error: 'body.data required' });
  if (!PROVIDERS[providerId]) return res.status(400).json({ error: `Unknown provider: ${providerId}` });

  try {
    const json   = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const buffer = Buffer.from(json, 'utf8');
    const fname  = filename || `civitas-backup-${Date.now()}.json`;

    const result = await uploadFile(providerId, creds, buffer, fname, 'application/json');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(502).json({ success: false, error: err.message });
  }
});

// ─── GET /api/datavault/files ─────────────────────────────────────────────────
// List files from a provider
router.get('/files', async (req, res) => {
  const providerId = parseProvider(req);
  const creds      = parseCreds(req);

  if (!providerId) return res.status(400).json({ error: 'x-vault-provider header required' });
  if (!creds)      return res.status(400).json({ error: 'x-vault-credentials header required' });
  if (!PROVIDERS[providerId]) return res.status(400).json({ error: `Unknown provider: ${providerId}` });

  try {
    const files = await listFiles(providerId, creds);
    res.json({ files, provider: providerId });
  } catch (err) {
    res.status(502).json({ files: [], error: err.message });
  }
});

module.exports = router;
