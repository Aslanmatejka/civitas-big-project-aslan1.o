import React, { useState, useEffect, useCallback } from 'react';
import './MobileMoneyPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DIRECTION_OPTIONS = [
  { value: 'FIAT_TO_CIV', label: 'Local Money → CIV', icon: '📲' },
  { value: 'CIV_TO_FIAT', label: 'CIV → Local Money',  icon: '💸' },
];

export default function MobileMoneyPage() {
  const [providers, setProviders]       = useState([]);
  const [selectedProvider, setProvider] = useState('');
  const [currencies, setCurrencies]     = useState([]);
  const [currency, setCurrency]         = useState('');
  const [direction, setDirection]       = useState('FIAT_TO_CIV');
  const [amount, setAmount]             = useState('');
  const [phone, setPhone]               = useState('');
  const [memo, setMemo]                 = useState('');
  const [quote, setQuote]               = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [txLoading, setTxLoading]       = useState(false);
  const [history, setHistory]           = useState([]);
  const [activeTab, setActiveTab]       = useState('send');
  const [walletAddr, setWalletAddr]     = useState('');
  const [error, setError]               = useState('');
  const [successTx, setSuccessTx]       = useState(null);

  // Fetch providers on mount
  useEffect(() => {
    fetch(`${API}/api/mobile-money/providers`)
      .then(r => r.json())
      .then(({ providers: p }) => setProviders(p))
      .catch(() => setError('Unable to load providers'));
  }, []);

  // Update currency list when provider changes
  useEffect(() => {
    const p = providers.find(p => p.id === selectedProvider);
    if (p) {
      setCurrencies(p.currencies);
      setCurrency(p.currencies[0] || '');
    } else {
      setCurrencies([]);
      setCurrency('');
    }
    setQuote(null);
  }, [selectedProvider, providers]);

  // Fetch history when wallet address entered
  useEffect(() => {
    if (walletAddr.length === 42) {
      fetch(`${API}/api/mobile-money/history/${walletAddr}`)
        .then(r => r.json())
        .then(({ transactions }) => setHistory(transactions || []))
        .catch(() => {});
    }
  }, [walletAddr]);

  const fetchQuote = useCallback(async () => {
    if (!selectedProvider || !currency || !amount || !direction) return;
    setQuoteLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/mobile-money/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, currency, amount: Number(amount), direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuote(data.quote);
    } catch (err) {
      setError(err.message);
    } finally {
      setQuoteLoading(false);
    }
  }, [selectedProvider, currency, amount, direction]);

  const initiate = async () => {
    if (!walletAddr || !phone || !quote) return;
    setTxLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/mobile-money/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddr,
          provider: selectedProvider,
          currency,
          amount: Number(amount),
          direction,
          phoneNumber: phone,
          memo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessTx(data.transaction);
      setHistory(prev => [data.transaction, ...prev]);
      setAmount('');
      setQuote(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  const pollStatus = async (txId) => {
    const res = await fetch(`${API}/api/mobile-money/status/${txId}`);
    const { transaction } = await res.json();
    setHistory(prev => prev.map(t => t.id === txId ? transaction : t));
    if (successTx?.id === txId) setSuccessTx(transaction);
  };

  const statusBadge = (status) => {
    const map = { PENDING: '#f39c12', PROCESSING: '#3498db', COMPLETED: '#27ae60', FAILED: '#e74c3c', CANCELLED: '#7f8c8d' };
    return <span style={{ background: map[status] || '#555', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{status}</span>;
  };

  return (
    <div className="mobile-money-page">
      <div className="mm-header">
        <h1>📱 Mobile Money Bridge</h1>
        <p>Convert between local currencies and CIV tokens instantly. Supporting mobile wallets across Africa, Asia, and Latin America — including MTN MoMo, M-PESA, Airtel, GCash, GoPay, GrabPay, PromptPay, bKash, Easypaisa, PicPay/Pix, MercadoPago, and more.</p>
      </div>

      <div className="mm-tabs">
        {['send', 'history'].map(tab => (
          <button key={tab} className={`mm-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'send' ? '💱 Exchange' : '📜 History'}
          </button>
        ))}
      </div>

      {activeTab === 'send' && (
        <div className="mm-form-panel">
          {/* Wallet address */}
          <div className="mm-field">
            <label>Your Wallet Address</label>
            <input
              value={walletAddr}
              onChange={e => setWalletAddr(e.target.value)}
              placeholder="0x..."
              className="mm-input"
            />
          </div>

          {/* Direction */}
          <div className="mm-field">
            <label>Direction</label>
            <div className="mm-direction-group">
              {DIRECTION_OPTIONS.map(d => (
                <button
                  key={d.value}
                  className={`mm-direction-btn ${direction === d.value ? 'active' : ''}`}
                  onClick={() => { setDirection(d.value); setQuote(null); }}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="mm-field">
            <label>Provider</label>
            <select value={selectedProvider} onChange={e => setProvider(e.target.value)} className="mm-input">
              <option value="">Select provider...</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.countries.join(', ')})</option>
              ))}
            </select>
          </div>

          {/* Currency */}
          {currencies.length > 0 && (
            <div className="mm-field">
              <label>Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="mm-input">
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Amount */}
          <div className="mm-field">
            <label>{direction === 'FIAT_TO_CIV' ? `Amount (${currency || 'fiat'})` : 'Amount (CIV)'}</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => { setAmount(e.target.value); setQuote(null); }}
              placeholder="0.00"
              className="mm-input"
            />
          </div>

          {/* Phone */}
          <div className="mm-field">
            <label>Mobile Number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+256700000000"
              className="mm-input"
            />
          </div>

          {/* Memo (optional) */}
          <div className="mm-field">
            <label>Memo (optional)</label>
            <input
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="e.g. School fees"
              className="mm-input"
            />
          </div>

          {error && <div className="mm-error">⚠️ {error}</div>}

          {/* Quote */}
          {quote && (
            <div className="mm-quote-box">
              <div className="mm-quote-title">Quote (valid 60s)</div>
              {direction === 'FIAT_TO_CIV' ? (
                <>
                  <div>You send: <strong>{quote.fiatAmount} {quote.currency}</strong></div>
                  <div>You receive: <strong>{quote.civAmount} CIV</strong></div>
                  <div>Fee: {quote.feeFiat} {quote.currency}</div>
                </>
              ) : (
                <>
                  <div>You send: <strong>{quote.civAmount} CIV</strong></div>
                  <div>You receive: <strong>{quote.fiatAmount} {quote.currency}</strong></div>
                  <div>Fee: {quote.feeCIV} CIV</div>
                </>
              )}
            </div>
          )}

          <div className="mm-actions">
            <button
              className="mm-btn secondary"
              onClick={fetchQuote}
              disabled={!selectedProvider || !currency || !amount || quoteLoading}
            >
              {quoteLoading ? 'Fetching...' : '🔍 Get Quote'}
            </button>
            <button
              className="mm-btn primary"
              onClick={initiate}
              disabled={!quote || !walletAddr || !phone || txLoading}
            >
              {txLoading ? 'Processing...' : '✅ Confirm & Send'}
            </button>
          </div>

          {successTx && (
            <div className="mm-success-box">
              <div>✅ Transaction submitted!</div>
              <div>ID: <code>{successTx.id}</code></div>
              <div>Status: {statusBadge(successTx.status)}</div>
              <button className="mm-btn secondary mm-btn-sm" onClick={() => pollStatus(successTx.id)}>
                🔄 Refresh Status
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="mm-history-panel">
          {!walletAddr && (
            <div className="mm-field">
              <label>Enter Wallet Address to see history</label>
              <input
                value={walletAddr}
                onChange={e => setWalletAddr(e.target.value)}
                placeholder="0x..."
                className="mm-input"
              />
            </div>
          )}
          {history.length === 0
            ? <p className="mm-empty">No transactions found.</p>
            : history.map(tx => (
              <div key={tx.id} className="mm-tx-card">
                <div className="mm-tx-header">
                  <span className="mm-tx-id">{tx.id}</span>
                  {statusBadge(tx.status)}
                </div>
                <div className="mm-tx-body">
                  <span>{tx.direction === 'FIAT_TO_CIV' ? `${tx.quote?.fiatAmount} ${tx.currency} → ${tx.quote?.civAmount} CIV` : `${tx.quote?.civAmount} CIV → ${tx.quote?.fiatAmount} ${tx.currency}`}</span>
                  <span className="mm-tx-prov">{tx.provider} · {tx.phoneNumber}</span>
                </div>
                <div className="mm-tx-footer">
                  <span>{new Date(tx.createdAt).toLocaleString()}</span>
                  {tx.status === 'PENDING' || tx.status === 'PROCESSING' ? (
                    <button className="mm-btn secondary mm-btn-sm" onClick={() => pollStatus(tx.id)}>🔄 Refresh</button>
                  ) : null}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
