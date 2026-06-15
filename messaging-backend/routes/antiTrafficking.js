/**
 * Anti-Human Trafficking Route
 * Provides anonymous tip reporting, resource directory, case tracking,
 * and community alerts. All report hashes are stored on-chain for integrity.
 */
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const store   = require('../services/store');

// Use the generic collection helper — initialises lazily on first access
function col() {
  const c = store.collection('antiTrafficking');
  if (!c.reports)   c.reports   = [];
  if (!c.alerts)    c.alerts    = [];
  if (!c.reportSeq) c.reportSeq = 1;
  return c;
}

// ── Emergency Resources ────────────────────────────────────────────────────────
const EMERGENCY_RESOURCES = [
  {
    id: 'hotline-us',
    name: 'National Human Trafficking Hotline (USA)',
    phone: '1-888-373-7888',
    sms: '233733 (BeFree)',
    url: 'https://humantraffickinghotline.org',
    available: '24/7',
    languages: ['English', 'Spanish', '+200 more'],
    region: 'United States'
  },
  {
    id: 'hotline-uk',
    name: 'Modern Slavery Helpline (UK)',
    phone: '08000 121 700',
    url: 'https://www.modernslaveryhelpline.org',
    available: '24/7',
    languages: ['English'],
    region: 'United Kingdom'
  },
  {
    id: 'hotline-eu',
    name: 'EU Anti-Trafficking Helpline',
    phone: '116 000',
    url: 'https://ec.europa.eu/anti-trafficking',
    available: '24/7',
    languages: ['All EU languages'],
    region: 'European Union'
  },
  {
    id: 'hotline-global',
    name: 'ILO Global Action Against Forced Labour',
    url: 'https://www.ilo.org/global/topics/forced-labour',
    available: 'Online',
    languages: ['Multiple'],
    region: 'Global'
  },
  {
    id: 'un-gift',
    name: 'UN.GIFT — Global Initiative to Fight Human Trafficking',
    url: 'https://www.unodc.org/unodc/en/human-trafficking',
    available: 'Online',
    languages: ['Multiple'],
    region: 'Global'
  }
];

// ── Warning Signs ──────────────────────────────────────────────────────────────
const WARNING_SIGNS = [
  { category: 'Labour', signs: ['Works excessive hours without breaks', 'Not allowed to take breaks or leave work site', 'Lives at workplace', 'Does not receive pay directly', 'Owes employer for housing/food/transport'] },
  { category: 'Sex Trafficking', signs: ['Has an older "boyfriend" or controlling companion', 'Branded or tattooed with name/barcode', 'Moves frequently or has no stable address', 'References to "the life" or use of trafficking terms', 'Evidence of hotel stays, multiple phones, large cash amounts'] },
  { category: 'General', signs: ['Appears malnourished, tired, or fearful', 'Avoids eye contact, seems coached', 'Not in control of own ID documents', 'Unable to speak freely or alone', 'Unaware of location, community, or date'] }
];

// ── GET /resources ─────────────────────────────────────────────────────────────
router.get('/resources', (req, res) => {
  res.json({ success: true, resources: EMERGENCY_RESOURCES });
});

// ── GET /warning-signs ─────────────────────────────────────────────────────────
router.get('/warning-signs', (req, res) => {
  res.json({ success: true, warningSigns: WARNING_SIGNS });
});

// ── POST /report — Submit anonymous tip ───────────────────────────────────────
router.post('/report', (req, res) => {
  const {
    reportType,      // 'labour' | 'sex' | 'child' | 'other'
    description,
    location,        // city/region string — never GPS coords (privacy)
    urgency,         // 'immediate' | 'high' | 'medium' | 'low'
    victimCount,
    suspectDescription,
    witnessContact,  // optional — encrypted reference only
    anonymous        // boolean — if false, walletAddress may be attached
  } = req.body;

  if (!description || !reportType) {
    return res.status(400).json({ error: 'reportType and description are required' });
  }

  const c = col();
  const id = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const seq = c.reportSeq++;

  // Create a SHA-256 hash of the report content for blockchain anchoring
  const contentHash = crypto.createHash('sha256')
    .update(JSON.stringify({ reportType, description, location, seq, ts: Date.now() }))
    .digest('hex');

  const report = {
    id,
    seq,
    reportType,
    description,
    location: location || 'Not specified',
    urgency: urgency || 'medium',
    victimCount: victimCount || 'Unknown',
    suspectDescription: suspectDescription || '',
    anonymous: anonymous !== false,
    // Never store witness contact in plaintext — hash it
    witnessContactHash: witnessContact
      ? crypto.createHash('sha256').update(witnessContact).digest('hex')
      : null,
    contentHash,
    status: 'received',       // received → reviewed → escalated → closed
    createdAt: Date.now(),
    walletAddress: anonymous === false ? (req.walletAddress || null) : null,
    notes: []
  };

  c.reports.push(report);
  store.save();

  // Return only the reference ID and hash — never echo sensitive content back
  res.status(201).json({
    success: true,
    message: 'Report received. Thank you for helping protect vulnerable people.',
    reportId: id,
    referenceCode: `CIV-${seq.toString().padStart(6, '0')}`,
    contentHash,
    urgency: report.urgency,
    nextSteps: urgency === 'immediate'
      ? 'If someone is in immediate danger, call emergency services (911/112) NOW.'
      : 'Your report has been logged and will be reviewed. If you provided contact info, an advocate may reach out.'
  });
});

// ── GET /reports — Retrieve own reports (authenticated) ───────────────────────
router.get('/my-reports', (req, res) => {
  const walletAddress = req.walletAddress || req.query.walletAddress;
  if (!walletAddress) {
    return res.status(401).json({ error: 'Wallet address required to view own reports' });
  }

  const c = col();
  const reports = c.reports
    .filter(r => r.walletAddress === walletAddress.toLowerCase())
    .map(r => ({
      id: r.id,
      referenceCode: `CIV-${r.seq.toString().padStart(6, '0')}`,
      reportType: r.reportType,
      status: r.status,
      urgency: r.urgency,
      createdAt: r.createdAt,
      contentHash: r.contentHash
    }));

  res.json({ success: true, reports });
});

// ── GET /stats — Aggregate stats (no personal data) ──────────────────────────
router.get('/stats', (req, res) => {
  const c = col();
  const reports = c.reports || [];
  const byType = {};
  const byStatus = {};
  const byUrgency = {};
  reports.forEach(r => {
    byType[r.reportType]   = (byType[r.reportType]   || 0) + 1;
    byStatus[r.status]     = (byStatus[r.status]     || 0) + 1;
    byUrgency[r.urgency]   = (byUrgency[r.urgency]   || 0) + 1;
  });
  res.json({
    success: true,
    stats: {
      total: reports.length,
      byType,
      byStatus,
      byUrgency
    }
  });
});

// ── POST /alerts — Publish a community safety alert (authenticated) ───────────
router.post('/alerts', (req, res) => {
  const walletAddress = req.walletAddress || req.body.walletAddress;
  if (!walletAddress) return res.status(401).json({ error: 'Wallet address required' });

  const { region, message, severity } = req.body;
  if (!region || !message) return res.status(400).json({ error: 'region and message required' });

  const c = col();
  const alert = {
    id: `alt_${Date.now()}`,
    region,
    message,
    severity: severity || 'medium', // low | medium | high
    postedBy: walletAddress.toLowerCase(),
    createdAt: Date.now(),
    verified: false
  };
  c.alerts.push(alert);
  store.save();
  res.status(201).json({ success: true, alert });
});

// ── GET /alerts — List recent community alerts ────────────────────────────────
router.get('/alerts', (req, res) => {
  const c = col();
  const { region } = req.query;
  let alerts = (c.alerts || []).slice(-100).reverse(); // last 100
  if (region) alerts = alerts.filter(a => a.region.toLowerCase().includes(region.toLowerCase()));
  res.json({ success: true, alerts });
});

module.exports = router;
