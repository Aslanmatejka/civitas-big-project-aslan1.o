const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// ─── Persisted store ──────────────────────────────────────────────────────────
const automationData = store.collection('automations');
// automationData is a plain object: { items: { id → automation }, nextId: N }
if (!automationData.items)  automationData.items  = {};
if (!automationData.nextId) automationData.nextId = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calculateNextRun(schedule) {
  if (!schedule) return null;
  const now = new Date();
  const { type, interval, unit } = schedule;
  if (type === 'once') return schedule.runAt ? new Date(schedule.runAt) : null;
  if (type === 'interval') {
    const ms = {
      minutes: 60_000,
      hours: 3_600_000,
      days: 86_400_000,
    }[unit] || 3_600_000;
    return new Date(now.getTime() + (interval || 1) * ms);
  }
  if (type === 'cron') return new Date(now.getTime() + 3_600_000); // approx
  return null;
}

function makeDefaultAutomation(data, id) {
  return {
    id,
    walletAddress: (data.walletAddress || '').toLowerCase(),
    name: data.name || 'Unnamed Automation',
    description: data.description || '',
    status: 'active',
    trigger: data.trigger || { type: 'schedule', config: {} },
    action:  data.action  || { type: 'notify',   config: {} },
    schedule: data.schedule || null,
    conditions: data.conditions || [],
    executionCount: 0,
    lastRun: null,
    nextRun: calculateNextRun(data.schedule),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const TEMPLATES = [
  {
    id: 'tpl_price_alert',
    name: 'Price Alert',
    description: 'Notify when token price crosses a threshold',
    category: 'Trading',
    trigger: { type: 'price_change', config: { token: 'ETH', threshold: 0, direction: 'above' } },
    action:  { type: 'notify', config: { channel: 'in-app' } },
  },
  {
    id: 'tpl_auto_vote',
    name: 'Auto-Vote on Proposals',
    description: 'Automatically vote on governance proposals matching criteria',
    category: 'Governance',
    trigger: { type: 'new_proposal', config: { category: 'any' } },
    action:  { type: 'submit_vote', config: { vote: 'for' } },
  },
  {
    id: 'tpl_scheduled_transfer',
    name: 'Scheduled Transfer',
    description: 'Send a recurring token transfer on a schedule',
    category: 'Payments',
    trigger: { type: 'schedule', config: {} },
    action:  { type: 'transfer', config: { token: 'ETH', amount: '' } },
    schedule: { type: 'interval', interval: 1, unit: 'days' },
  },
  {
    id: 'tpl_listing_watch',
    name: 'Marketplace Listing Watch',
    description: 'Alert when a new listing appears in a category',
    category: 'Marketplace',
    trigger: { type: 'new_listing', config: { category: 'any' } },
    action:  { type: 'notify', config: { channel: 'in-app' } },
  },
  {
    id: 'tpl_low_balance',
    name: 'Low Balance Alert',
    description: 'Warn when wallet balance drops below a minimum',
    category: 'Wallet',
    trigger: { type: 'balance_change', config: { token: 'ETH', threshold: 0.1, direction: 'below' } },
    action:  { type: 'notify', config: { channel: 'in-app' } },
  },
  {
    id: 'tpl_reputation_milestone',
    name: 'Reputation Milestone Notifier',
    description: 'Celebrate when your reputation score hits a target',
    category: 'Identity',
    trigger: { type: 'reputation_change', config: { threshold: 500 } },
    action:  { type: 'notify', config: { channel: 'in-app', message: '🎉 Reputation milestone reached!' } },
  },
];

// ─── GET /automation?walletAddress=&status= ───────────────────────────────────
router.get('/', (req, res) => {
  const { walletAddress, status } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const addr = walletAddress.toLowerCase();
  let list = Object.values(automationData.items).filter(a => a.walletAddress === addr);
  if (status) list = list.filter(a => a.status === status);
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ automations: list, total: list.length });
});

// ─── GET /automation/templates/list ──────────────────────────────────────────
router.get('/templates/list', (req, res) => {
  res.json({ templates: TEMPLATES });
});

// ─── GET /automation/stats/:walletAddress ─────────────────────────────────────
router.get('/stats/:walletAddress', (req, res) => {
  const addr = req.params.walletAddress.toLowerCase();
  const list = Object.values(automationData.items).filter(a => a.walletAddress === addr);
  const stats = {
    total: list.length,
    active:  list.filter(a => a.status === 'active').length,
    paused:  list.filter(a => a.status === 'paused').length,
    completed: list.filter(a => a.status === 'completed').length,
    totalExecutions: list.reduce((s, a) => s + (a.executionCount || 0), 0),
    lastRun: list.reduce((latest, a) => {
      if (!a.lastRun) return latest;
      return !latest || new Date(a.lastRun) > new Date(latest) ? a.lastRun : latest;
    }, null),
  };
  res.json({ stats });
});

// ─── GET /automation/:id ──────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const a = automationData.items[req.params.id];
  if (!a) return res.status(404).json({ error: 'Automation not found' });
  res.json({ automation: a });
});

// ─── POST /automation/create ──────────────────────────────────────────────────
router.post('/create', (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const id = String(automationData.nextId++);
  const automation = makeDefaultAutomation(req.body, id);
  automationData.items[id] = automation;
  res.status(201).json({ automation, message: 'Automation created' });
});

// ─── PUT /automation/:id ──────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const a = automationData.items[req.params.id];
  if (!a) return res.status(404).json({ error: 'Automation not found' });
  const allowed = ['name','description','trigger','action','schedule','conditions','status'];
  for (const k of allowed) if (req.body[k] !== undefined) a[k] = req.body[k];
  if (req.body.schedule) a.nextRun = calculateNextRun(req.body.schedule);
  a.updatedAt = new Date().toISOString();
  res.json({ automation: a, message: 'Automation updated' });
});

// ─── PATCH /automation/:id/toggle ────────────────────────────────────────────
router.patch('/:id/toggle', (req, res) => {
  const a = automationData.items[req.params.id];
  if (!a) return res.status(404).json({ error: 'Automation not found' });
  a.status = a.status === 'active' ? 'paused' : 'active';
  a.updatedAt = new Date().toISOString();
  res.json({ automation: a, status: a.status, message: `Automation ${a.status}` });
});

// ─── DELETE /automation/:id ───────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  if (!automationData.items[req.params.id]) return res.status(404).json({ error: 'Automation not found' });
  delete automationData.items[req.params.id];
  res.json({ success: true, message: 'Automation deleted' });
});

// ─── POST /automation/:id/execute ────────────────────────────────────────────
router.post('/:id/execute', (req, res) => {
  const a = automationData.items[req.params.id];
  if (!a) return res.status(404).json({ error: 'Automation not found' });
  a.executionCount = (a.executionCount || 0) + 1;
  a.lastRun  = new Date().toISOString();
  a.nextRun  = calculateNextRun(a.schedule);
  a.updatedAt = new Date().toISOString();
  res.json({
    automation: a,
    execution: {
      id: `exec_${Date.now()}`,
      automationId: a.id,
      status: 'completed',
      executedAt: a.lastRun,
      result: { message: `Action "${a.action.type}" simulated successfully` },
    },
    message: 'Automation executed',
  });
});

module.exports = router;