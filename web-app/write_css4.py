import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── MobileMoneyPage.css ────────────────────────────────────────────────────────
open(os.path.join(d, 'MobileMoneyPage.css'), 'w', encoding='utf-8').write("""/* MobileMoneyPage */
.mobile-money-page { padding: var(--sp-8); max-width: 700px; margin: 0 auto; animation: fadeIn 0.35s ease both; }

/* Header */
.mm-header { margin-bottom: var(--sp-6); }
.mm-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 8px; }
.mm-header p { color: var(--text-2); font-size: .875rem; line-height: 1.6; }

/* Tabs */
.mm-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: var(--sp-6); }
.mm-tab {
  padding: 10px 22px; background: none; border: none;
  border-bottom: 2px solid transparent; color: var(--text-2);
  font-size: .875rem; font-weight: 500; cursor: pointer;
  transition: all var(--t-base); margin-bottom: -1px;
}
.mm-tab:hover { color: var(--text-1); }
.mm-tab.active { color: var(--violet-light); border-bottom-color: var(--violet); font-weight: 600; }

/* Form panel */
.mm-form-panel {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px;
  display: flex; flex-direction: column; gap: 18px;
}

/* Field */
.mm-field { display: flex; flex-direction: column; gap: 8px; }
.mm-field label { font-size: .8rem; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: .05em; }
.mm-input {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 12px 16px;
  color: var(--text-1); font-size: .9rem; font-family: var(--font-sans);
  transition: border-color var(--t-base); width: 100%; box-sizing: border-box;
}
.mm-input:focus { outline: none; border-color: var(--violet); box-shadow: 0 0 0 3px var(--violet-dim); }

/* Direction group */
.mm-direction-group { display: flex; gap: 8px; }
.mm-direction-btn {
  flex: 1; padding: 10px 14px; border: 1px solid var(--border);
  border-radius: var(--r-lg); background: var(--surface-2);
  color: var(--text-2); font-size: .85rem; cursor: pointer;
  transition: all var(--t-fast); text-align: center;
}
.mm-direction-btn:hover { border-color: var(--violet); color: var(--violet-light); }
.mm-direction-btn.active { background: var(--violet-dim); border-color: var(--violet); color: var(--violet-light); font-weight: 600; }

/* Buttons */
.mm-btn {
  padding: 11px 22px; border-radius: var(--r-full);
  font-size: .875rem; font-weight: 600; cursor: pointer;
  transition: all var(--t-fast); border: none;
}
.mm-btn:disabled { opacity: .5; cursor: not-allowed; }
.mm-btn.primary { background: var(--grad-primary); color: #fff; }
.mm-btn.primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.mm-btn.secondary { background: var(--surface-2); border: 1px solid var(--border); color: var(--text-1); }
.mm-btn.secondary:hover:not(:disabled) { border-color: var(--violet); color: var(--violet-light); }
.mm-btn-sm { padding: 6px 14px; font-size: .78rem; }

/* Actions row */
.mm-actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* Error */
.mm-error {
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);
  border-radius: var(--r-md); padding: 10px 14px;
  color: var(--red); font-size: .875rem;
}

/* Quote box */
.mm-quote-box {
  background: rgba(139,92,246,.08); border: 1px solid rgba(139,92,246,.25);
  border-radius: var(--r-xl); padding: 16px 20px;
  display: flex; flex-direction: column; gap: 6px; font-size: .875rem; color: var(--text-2);
}
.mm-quote-title { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--violet-light); font-weight: 700; margin-bottom: 4px; }
.mm-quote-box strong { color: var(--text-1); }

/* Success box */
.mm-success-box {
  background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.3);
  border-radius: var(--r-xl); padding: 16px 20px;
  display: flex; flex-direction: column; gap: 8px; font-size: .875rem; color: var(--green);
}
.mm-success-box code { font-family: var(--font-mono); font-size: .8rem; color: var(--text-2); }

/* History panel */
.mm-history-panel { display: flex; flex-direction: column; gap: 12px; }
.mm-empty { text-align: center; color: var(--text-3); padding: var(--sp-8); font-size: .9rem; }

/* Transaction card */
.mm-tx-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-xl); padding: 16px 20px; transition: border-color var(--t-base);
}
.mm-tx-card:hover { border-color: var(--border-accent); }
.mm-tx-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.mm-tx-id { font-family: var(--font-mono); font-size: .75rem; color: var(--text-3); }
.mm-tx-body { font-size: .875rem; color: var(--text-1); margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px; }
.mm-tx-prov { font-size: .78rem; color: var(--text-3); }
.mm-tx-footer { display: flex; justify-content: space-between; align-items: center; font-size: .75rem; color: var(--text-3); }

@media (max-width: 768px) {
  .mobile-money-page { padding: var(--sp-4); }
  .mm-direction-group { flex-direction: column; }
  .mm-actions { flex-direction: column; }
}
""")

# ── OfflineQueuePage.css ──────────────────────────────────────────────────────
open(os.path.join(d, 'OfflineQueuePage.css'), 'w', encoding='utf-8').write("""/* OfflineQueuePage */
.offline-queue-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.offline-queue-container { max-width: 860px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }
.not-connected p { margin-bottom: var(--sp-6); }

/* Header */
.offline-queue-header { margin-bottom: var(--sp-6); }
.offline-queue-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.offline-queue-header .subtitle { color: var(--text-2); font-size: .9rem; }

/* Connection status */
.connection-status {
  display: flex; align-items: center; gap: 14px;
  border-radius: var(--r-xl); padding: 16px 20px; margin-bottom: var(--sp-6);
  border: 1px solid var(--border);
}
.connection-status.online  { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.3); }
.connection-status.offline { background: rgba(239,68,68,.08);  border-color: rgba(239,68,68,.25); }
.connection-status h3 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.connection-status p { font-size: .85rem; color: var(--text-2); }
.status-indicator { font-size: 1.4rem; flex-shrink: 0; }

/* Stats bar */
.stats-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px,1fr)); gap: 12px; margin-bottom: var(--sp-6); }
.stat-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-xl); padding: 16px; text-align: center;
}
.stat-card h4 { font-size: 1.4rem; font-weight: 800; color: var(--violet-light); margin-bottom: 4px; }
.stat-card p { font-size: .72rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; }

/* Filter bar */
.filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: var(--sp-6); }
.filter-btn {
  padding: 7px 18px; border: 1px solid var(--border);
  border-radius: var(--r-full); background: var(--surface-2);
  color: var(--text-2); font-size: .8rem; cursor: pointer; transition: all var(--t-fast);
}
.filter-btn:hover, .filter-btn.active { border-color: var(--violet); color: var(--violet-light); background: var(--violet-dim); }

/* Queue section */
.queue-section {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; margin-bottom: var(--sp-6);
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-5); }
.section-header h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); }
.transactions-list { display: flex; flex-direction: column; gap: 2px; }

/* Transaction item */
.transaction-item {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px; border-radius: var(--r-xl);
  border: 1px solid transparent; transition: all var(--t-base);
  margin-bottom: 4px;
}
.transaction-item:hover { background: var(--surface-2); border-color: var(--border); }
.transaction-item.status-pending    { border-left: 3px solid var(--amber); }
.transaction-item.status-processing { border-left: 3px solid var(--cyan); }
.transaction-item.status-confirmed  { border-left: 3px solid var(--green); }
.transaction-item.status-failed     { border-left: 3px solid var(--red); }
.transaction-item.status-submitted  { border-left: 3px solid var(--violet); }
.transaction-item.status-cancelled  { border-left: 3px solid var(--text-3); }
.tx-icon { font-size: 1.6rem; flex-shrink: 0; margin-top: 2px; }
.tx-info { flex: 1; }
.tx-info h3 { font-size: .875rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.tx-info p { font-size: .8rem; color: var(--text-2); margin-bottom: 2px; }
.tx-description { color: var(--text-2) !important; }
.tx-hash { font-family: var(--font-mono); font-size: .72rem !important; color: var(--cyan) !important; }
.tx-error { color: var(--red) !important; }
.tx-retries { color: var(--amber) !important; }
.tx-time { color: var(--text-3) !important; font-size: .72rem !important; }
.priority-badge {
  display: inline-block; font-size: .7rem; padding: 2px 8px;
  background: rgba(245,158,11,.12); color: var(--amber);
  border-radius: var(--r-full); margin-top: 4px;
}
.tx-status { min-width: 100px; display: flex; justify-content: center; padding-top: 2px; }
.status-badge {
  display: inline-block; padding: 4px 12px;
  border-radius: var(--r-full); font-size: .75rem; font-weight: 700; white-space: nowrap;
}
.status-badge.pending    { background: rgba(245,158,11,.15); color: var(--amber); }
.status-badge.processing { background: rgba(6,182,212,.15);  color: var(--cyan); }
.status-badge.confirmed  { background: rgba(16,185,129,.15); color: var(--green); }
.status-badge.failed     { background: rgba(239,68,68,.12);  color: var(--red); }
.status-badge.submitted  { background: rgba(139,92,246,.15); color: var(--violet-light); }
.status-badge.cancelled  { background: var(--surface-3);     color: var(--text-3); }
.tx-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: flex-start; }

/* Empty queue */
.empty-queue { text-align: center; padding: var(--sp-10); color: var(--text-3); }
.empty-icon { font-size: 3rem; margin-bottom: var(--sp-4); }
.empty-queue h3 { font-size: 1.05rem; color: var(--text-2); margin-bottom: 8px; }

/* Info box */
.info-box {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 24px;
}
.info-box h3 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.info-box ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0; }
.info-box li { font-size: .875rem; color: var(--text-2); padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; gap: 10px; align-items: center; }
.info-box li:last-child { border-bottom: none; }
.info-box li::before { content: "->"; color: var(--violet); font-weight: 700; }

@media (max-width: 768px) {
  .offline-queue-page { padding: var(--sp-4); }
  .transaction-item { flex-direction: column; }
  .tx-status { justify-content: flex-start; }
  .stats-bar { grid-template-columns: repeat(3,1fr); }
}
""")

print('MobileMoneyPage, OfflineQueuePage done')
