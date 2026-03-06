/**
 * Mobile Money Bridge – in-memory simulation
 *
 * Supported providers:
 *   MTN_MOMO   – MTN Mobile Money (Uganda / Ghana / Rwanda / Ivory Coast)
 *   AIRTEL     – Airtel Money (Uganda / Kenya / Zambia)
 *   M_PESA     – Safaricom M-PESA (Kenya / Tanzania)
 *   ORANGE     – Orange Money (Senegal / Mali / Burkina Faso)
 *   GCASH      – GCash (Philippines)
 *   GOPAY      – GoPay (Indonesia)
 *   GRABPAY    – GrabPay (Malaysia / Singapore / Thailand / Vietnam)
 *   BKASH      – bKash (Bangladesh)
 *   EASYPAISA  – Easypaisa (Pakistan)
 *   PROMPTPAY  – PromptPay (Thailand)
 *   PICPAY     – PicPay / Pix (Brazil)
 *   MERCADOPAGO – MercadoPago (Argentina / Chile / Colombia / Mexico / Peru)
 *
 * Flow:
 *  1. POST /api/mobile-money/quote       → exchange rate + fee preview
 *  2. POST /api/mobile-money/initiate    → create pending transaction
 *  3. GET  /api/mobile-money/status/:id  → poll transaction status
 *  4. GET  /api/mobile-money/history/:wallet → user's transaction list
 *  5. GET  /api/mobile-money/providers   → supported providers + currencies
 *
 * CIV ↔ fiat rates are mocked; swap for real oracle in production.
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const store   = require('../services/store');

// ── Persisted store (survives restart via store.json) ────────────────────────
const mm = store.collection('mobileMoney');
if (!mm.transactions)  mm.transactions  = {};
if (!mm.walletHistory) mm.walletHistory = {};

// Map-like aliases for minimal code change
const transactions = mm.transactions;
const walletHistory = mm.walletHistory;

// ── Mock exchange rates (CIV per 1 USD, and local currency per 1 USD) ────────
const RATES = {
  CIV_PER_USD: 10,   // 1 USD = 10 CIV  (adjust after TGE)
  currencies: {
    // ── Africa ──────────────────────────────────────────────────────────────
    UGX: 3750,   // Ugandan Shilling
    KES: 130,    // Kenyan Shilling
    NGN: 1550,   // Nigerian Naira
    GHS: 12.5,   // Ghanaian Cedi
    TZS: 2530,   // Tanzanian Shilling
    ZMW: 27,     // Zambian Kwacha
    XOF: 620,    // West African CFA (Senegal, Mali, Burkina Faso, Ivory Coast)
    RWF: 1310,   // Rwandan Franc
    // ── Southeast Asia ──────────────────────────────────────────────────────
    PHP: 57,     // Philippine Peso
    IDR: 16000,  // Indonesian Rupiah
    MYR: 4.7,    // Malaysian Ringgit
    SGD: 1.35,   // Singapore Dollar
    THB: 36,     // Thai Baht
    VND: 25000,  // Vietnamese Dong
    MMK: 2100,   // Myanmar Kyat
    // ── South Asia ──────────────────────────────────────────────────────────
    INR: 83,     // Indian Rupee
    PKR: 280,    // Pakistani Rupee
    BDT: 110,    // Bangladeshi Taka
    LKR: 320,    // Sri Lankan Rupee
    NPR: 133,    // Nepali Rupee
    // ── Latin America ───────────────────────────────────────────────────────
    BRL: 5.0,    // Brazilian Real
    MXN: 17.5,   // Mexican Peso
    COP: 4100,   // Colombian Peso
    ARS: 900,    // Argentine Peso
    CLP: 950,    // Chilean Peso
    PEN: 3.8,    // Peruvian Sol
    // ── Global fallback ─────────────────────────────────────────────────────
    USD: 1,
  },
};

const PROVIDERS = {
  // ── Africa ──────────────────────────────────────────────────────────────
  MTN_MOMO:     { name: 'MTN Mobile Money',  currencies: ['UGX', 'GHS', 'RWF', 'XOF'],       countries: ['UG', 'GH', 'RW', 'CI'],       feePercent: 1.5, region: 'Africa' },
  AIRTEL:       { name: 'Airtel Money',      currencies: ['UGX', 'KES', 'ZMW'],              countries: ['UG', 'KE', 'ZM'],             feePercent: 1.2, region: 'Africa' },
  M_PESA:       { name: 'M-PESA',            currencies: ['KES', 'TZS'],                     countries: ['KE', 'TZ'],                   feePercent: 1.0, region: 'Africa' },
  ORANGE:       { name: 'Orange Money',      currencies: ['XOF'],                             countries: ['SN', 'ML', 'BF'],             feePercent: 1.8, region: 'Africa' },
  // ── Southeast Asia ──────────────────────────────────────────────────────
  GCASH:        { name: 'GCash',             currencies: ['PHP'],                             countries: ['PH'],                         feePercent: 1.0, region: 'Southeast Asia' },
  GOPAY:        { name: 'GoPay',             currencies: ['IDR'],                             countries: ['ID'],                         feePercent: 1.2, region: 'Southeast Asia' },
  GRABPAY:      { name: 'GrabPay',           currencies: ['MYR', 'SGD', 'THB', 'VND', 'PHP'], countries: ['MY', 'SG', 'TH', 'VN', 'PH'], feePercent: 1.0, region: 'Southeast Asia' },
  PROMPTPAY:    { name: 'PromptPay',         currencies: ['THB'],                             countries: ['TH'],                         feePercent: 0.5, region: 'Southeast Asia' },
  // ── South Asia ──────────────────────────────────────────────────────────
  BKASH:        { name: 'bKash',             currencies: ['BDT'],                             countries: ['BD'],                         feePercent: 1.5, region: 'South Asia' },
  EASYPAISA:    { name: 'Easypaisa',         currencies: ['PKR'],                             countries: ['PK'],                         feePercent: 1.8, region: 'South Asia' },
  // ── Latin America ───────────────────────────────────────────────────────
  PICPAY:       { name: 'PicPay / Pix',      currencies: ['BRL'],                             countries: ['BR'],                         feePercent: 0.8, region: 'Latin America' },
  MERCADOPAGO:  { name: 'MercadoPago',       currencies: ['MXN', 'COP', 'ARS', 'CLP', 'PEN'], countries: ['MX', 'CO', 'AR', 'CL', 'PE'], feePercent: 1.5, region: 'Latin America' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcQuote({ provider, currency, fiatAmount, direction }) {
  const p = PROVIDERS[provider];
  if (!p) throw new Error(`Unknown provider: ${provider}`);
  if (!p.currencies.includes(currency)) throw new Error(`Provider ${provider} does not support ${currency}`);

  const usdRate   = RATES.currencies[currency] || 1;
  const feeRate   = p.feePercent / 100;

  if (direction === 'FIAT_TO_CIV') {
    const usd          = fiatAmount / usdRate;
    const fee          = usd * feeRate;
    const netUsd       = usd - fee;
    const civAmount    = netUsd * RATES.CIV_PER_USD;
    return { fiatAmount, currency, civAmount: +civAmount.toFixed(4), feeFiat: +(fiatAmount * feeRate).toFixed(2), direction, provider };
  } else {
    // CIV_TO_FIAT: fiatAmount is actually CIV amount
    const civAmount    = fiatAmount;
    const usd          = civAmount / RATES.CIV_PER_USD;
    const fee          = usd * feeRate;
    const netUsd       = usd - fee;
    const fiatOut      = netUsd * usdRate;
    return { civAmount, currency, fiatAmount: +fiatOut.toFixed(2), feeCIV: +(civAmount * feeRate).toFixed(4), direction, provider };
  }
}

function simulateProcessing(txId) {
  // simulate async settlement: pending → processing → completed/failed
  setTimeout(() => {
    const tx = transactions[txId];
    if (!tx) return;
    tx.status = 'PROCESSING';
    tx.updatedAt = Date.now();
  }, 2000);

  setTimeout(() => {
    const tx = transactions[txId];
    if (!tx) return;
    // 5% simulated failure rate for realism
    tx.status = Math.random() < 0.95 ? 'COMPLETED' : 'FAILED';
    tx.updatedAt = Date.now();
    if (tx.status === 'COMPLETED') {
      tx.settlementRef = `SETTLE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
  }, 8000);
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/mobile-money/providers
 * Returns all supported providers, currencies, and current CIV rates.
 */
router.get('/providers', (req, res) => {
  const enriched = Object.entries(PROVIDERS).map(([key, p]) => ({
    id: key,
    ...p,
    rates: p.currencies.reduce((acc, cur) => {
      const usdRate = RATES.currencies[cur];
      acc[cur] = {
        civPerUnit: +(RATES.CIV_PER_USD / usdRate).toFixed(6),
        unitsPerCIV: +(usdRate / RATES.CIV_PER_USD).toFixed(4),
      };
      return acc;
    }, {}),
  }));
  res.json({ providers: enriched, civPerUSD: RATES.CIV_PER_USD });
});

/**
 * POST /api/mobile-money/quote
 * Body: { provider, currency, amount, direction: 'FIAT_TO_CIV' | 'CIV_TO_FIAT' }
 */
router.post('/quote', (req, res) => {
  try {
    const { provider, currency, amount, direction } = req.body;
    if (!provider || !currency || !amount || !direction) {
      return res.status(400).json({ error: 'provider, currency, amount and direction are required' });
    }
    const quote = calcQuote({ provider, currency, fiatAmount: Number(amount), direction });
    quote.expiresAt = Date.now() + 60_000; // valid 60 s
    res.json({ quote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/mobile-money/initiate
 * Body: { walletAddress, provider, currency, amount, direction, phoneNumber, memo? }
 */
router.post('/initiate', (req, res) => {
  try {
    const { walletAddress, provider, currency, amount, direction, phoneNumber, memo } = req.body;
    if (!walletAddress || !provider || !currency || !amount || !direction || !phoneNumber) {
      return res.status(400).json({ error: 'walletAddress, provider, currency, amount, direction and phoneNumber are required' });
    }

    const quote   = calcQuote({ provider, currency, fiatAmount: Number(amount), direction });
    const txId    = `CIVMM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const providerRef = `${provider}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const tx = {
      id:           txId,
      walletAddress,
      provider,
      currency,
      direction,
      phoneNumber,
      memo:         memo || '',
      quote,
      status:       'PENDING',   // PENDING → PROCESSING → COMPLETED | FAILED
      providerRef,
      createdAt:    Date.now(),
      updatedAt:    Date.now(),
      settlementRef: null,
    };

    transactions[txId] = tx;

    // track per-wallet history
    if (!walletHistory[walletAddress]) walletHistory[walletAddress] = [];
    walletHistory[walletAddress].unshift(txId);

    simulateProcessing(txId);

    res.status(201).json({ transaction: tx });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/mobile-money/status/:id
 */
router.get('/status/:id', (req, res) => {
  const tx = transactions[req.params.id];
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ transaction: tx });
});

/**
 * GET /api/mobile-money/history/:wallet
 */
router.get('/history/:wallet', (req, res) => {
  const ids = walletHistory[req.params.wallet] || [];
  const list = ids.map(id => transactions[id]).filter(Boolean);
  res.json({ transactions: list });
});

/**
 * POST /api/mobile-money/cancel/:id
 * Can only cancel PENDING transactions.
 */
router.post('/cancel/:id', (req, res) => {
  const tx = transactions[req.params.id];
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  if (tx.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot cancel a transaction in status ${tx.status}` });
  }
  tx.status    = 'CANCELLED';
  tx.updatedAt = Date.now();
  res.json({ transaction: tx });
});

module.exports = router;
