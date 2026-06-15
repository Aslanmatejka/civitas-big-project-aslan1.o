import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── ProfilePage.css ────────────────────────────────────────────────────────────
open(os.path.join(d, 'ProfilePage.css'), 'w', encoding='utf-8').write("""/* ProfilePage */
.profile-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.profile-container { max-width: 900px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }
.loading-profile { text-align: center; padding: var(--sp-12); color: var(--text-3); }
.spinner {
  width: 36px; height: 36px; border: 3px solid var(--border);
  border-top-color: var(--violet); border-radius: 50%;
  animation: spin .8s linear infinite; margin: 0 auto var(--sp-3);
}
.error-banner {
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);
  border-radius: var(--r-lg); padding: 14px 18px; color: var(--red);
  font-size: .875rem; margin-bottom: var(--sp-6); display: flex;
  align-items: center; justify-content: space-between; gap: 12px;
}
.retry-button {
  padding: 6px 14px; border: 1px solid rgba(239,68,68,.4);
  border-radius: var(--r-full); background: none; color: var(--red);
  font-size: .8rem; cursor: pointer;
}
.retry-button:hover { background: rgba(239,68,68,.1); }

/* Grid layout */
.profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }

/* Profile card (sidebar) */
.profile-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; text-align: center;
  position: sticky; top: 80px;
}
.profile-avatar {
  width: 80px; height: 80px; border-radius: var(--r-full);
  background: var(--grad-primary); display: flex; align-items: center;
  justify-content: center; font-size: 1.8rem; font-weight: 800;
  color: #fff; margin: 0 auto var(--sp-4);
  box-shadow: 0 0 0 3px var(--surface-1), 0 0 0 5px var(--violet);
}
.profile-address { font-family: var(--font-mono); font-size: .78rem; color: var(--text-3); margin-bottom: var(--sp-5); word-break: break-all; }
.verified-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(6,182,212,.12); color: var(--cyan);
  border: 1px solid rgba(6,182,212,.3); border-radius: var(--r-full);
  padding: 4px 12px; font-size: .75rem; font-weight: 700; margin-bottom: var(--sp-5);
}

/* Stats */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 14px; text-align: center; }
.stat-value { font-size: 1.2rem; font-weight: 800; color: var(--violet-light); margin-bottom: 2px; }
.stat-label { font-size: .7rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; }

/* Attestations section */
.attestations-section {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 24px; margin-bottom: var(--sp-5);
}
.attestations-section h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.empty-attestations { text-align: center; padding: var(--sp-6); color: var(--text-3); font-size: .875rem; }
.attestations-list { display: flex; flex-direction: column; gap: 10px; }
.attestation-card {
  display: flex; align-items: flex-start; gap: 12px;
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-xl); padding: 14px; transition: all var(--t-base);
}
.attestation-card:hover { border-color: var(--border-accent); }
.attestation-icon { font-size: 1.4rem; flex-shrink: 0; }
.attestation-info { flex: 1; }
.attestation-info h4 { font-size: .875rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.attestation-info p { font-size: .8rem; color: var(--text-2); }
.attestation-date { font-size: .72rem; color: var(--text-3); margin-top: 4px; display: block; }

/* Activity section */
.activity-section {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 24px;
}
.activity-section h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.empty-activity { text-align: center; padding: var(--sp-6); color: var(--text-3); font-size: .875rem; }
.activity-list { display: flex; flex-direction: column; gap: 0; }
.activity-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.activity-item:last-child { border-bottom: none; }
.activity-icon { font-size: 1.3rem; flex-shrink: 0; }
.activity-item span { font-size: .875rem; color: var(--text-1); flex: 1; }
.activity-time { font-size: .75rem; color: var(--text-3); white-space: nowrap; }

@media (max-width: 900px) {
  .profile-grid { grid-template-columns: 1fr; }
  .profile-card { position: static; }
}
@media (max-width: 768px) {
  .profile-page { padding: var(--sp-4); }
}
""")

# ── WalletPage.css ─────────────────────────────────────────────────────────────
open(os.path.join(d, 'WalletPage.css'), 'w', encoding='utf-8').write("""/* WalletPage */
.wallet-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.wallet-container { max-width: 880px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }
.not-connected p { margin-bottom: var(--sp-6); }
.loading { text-align: center; padding: var(--sp-12); color: var(--text-3); }
.nc-features { display: flex; flex-direction: column; gap: 12px; max-width: 400px; margin: 0 auto var(--sp-6); }
.nc-feature { display: flex; align-items: center; gap: 14px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 14px; }
.nc-icon { font-size: 1.6rem; flex-shrink: 0; }
.nc-hero { text-align: center; margin-bottom: var(--sp-6); }
.nc-hero h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.nc-hero p { font-size: .9rem; color: var(--text-2); }

/* Header */
.wallet-header { margin-bottom: var(--sp-6); }
.wallet-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.wallet-header .subtitle { color: var(--text-2); font-size: .9rem; }

/* Balance card */
.balance-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 32px; margin-bottom: var(--sp-6);
  position: relative; overflow: hidden;
}
.balance-card::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 80% at 50% -20%, rgba(139,92,246,.12), transparent);
  pointer-events: none;
}
.balance-main { margin-bottom: var(--sp-5); }
.balance-amount {
  font-size: 2.8rem; font-weight: 900; letter-spacing: -0.04em;
  background: var(--grad-primary); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text; line-height: 1;
}
.balance-usd { font-size: .9rem; color: var(--text-3); margin-top: 6px; }
.balance-actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* Tabs */
.wallet-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: var(--sp-6); }
.wallet-tabs button {
  padding: 10px 20px; background: none; border: none;
  border-bottom: 2px solid transparent; color: var(--text-2);
  font-size: .875rem; font-weight: 500; cursor: pointer;
  transition: all var(--t-base); margin-bottom: -1px;
}
.wallet-tabs button:hover { color: var(--text-1); }
.wallet-tabs button.active { color: var(--violet-light); border-bottom-color: var(--violet); font-weight: 600; }

/* Assets */
.assets-section { margin-bottom: var(--sp-6); }
.assets-section h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.asset-item { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: var(--r-xl); transition: background var(--t-fast); }
.asset-item:hover { background: var(--surface-2); }
.asset-icon { font-size: 1.8rem; flex-shrink: 0; }
.asset-info { flex: 1; }
.asset-symbol { font-size: .95rem; font-weight: 700; color: var(--text-1); }
.asset-balance { font-size: .8rem; color: var(--text-3); margin-top: 2px; }
.asset-value { font-size: .9rem; font-weight: 600; color: var(--text-1); }

/* Transactions */
.transactions-section { margin-bottom: var(--sp-6); }
.transactions-section h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.loading-transactions { text-align: center; padding: var(--sp-6); color: var(--text-3); }
.no-transactions { text-align: center; padding: var(--sp-6); color: var(--text-3); font-size: .875rem; }
.transaction-item { display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: var(--r-xl); transition: background var(--t-fast); }
.transaction-item:hover { background: var(--surface-2); }
.tx-info { flex: 1; }
.tx-info .tx-type { font-size: .875rem; font-weight: 600; color: var(--text-1); }
.tx-address { font-size: .75rem; color: var(--text-3); font-family: var(--font-mono); margin-top: 2px; }
.tx-time { font-size: .75rem; color: var(--text-3); }
.tx-amount { font-size: .9rem; font-weight: 700; }
.tx-amount.positive { color: var(--green); }
.tx-amount.negative { color: var(--red); }

/* NFTs */
.nfts-section { margin-bottom: var(--sp-6); }
.nfts-section h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.no-nfts { text-align: center; padding: var(--sp-8); color: var(--text-3); }
.nft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 14px; }
.nft-card { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); overflow: hidden; transition: all var(--t-base); }
.nft-card:hover { border-color: var(--border-accent); transform: translateY(-2px); }
.nft-image { aspect-ratio: 1; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
.nft-card p { font-size: .8rem; color: var(--text-2); padding: 10px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; max-width: 420px;
  width: 100%; animation: fadeIn .2s ease;
}
.modal-content h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-5); }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--sp-4); }
.form-group label { font-size: .8rem; font-weight: 600; color: var(--text-2); }
.form-group input, .form-group select {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 10px 14px; color: var(--text-1); font-size: .9rem;
}
.form-group input:focus { outline: none; border-color: var(--violet); }
.modal-actions { display: flex; gap: 10px; margin-top: var(--sp-4); }
.security-notice { font-size: .75rem; color: var(--text-3); background: var(--surface-2); border-radius: var(--r-md); padding: 10px 14px; line-height: 1.5; margin-top: var(--sp-4); }

@media (max-width: 768px) {
  .wallet-page { padding: var(--sp-4); }
  .balance-amount { font-size: 2rem; }
  .balance-actions { flex-direction: column; }
  .nft-grid { grid-template-columns: repeat(2,1fr); }
}
""")

print('ProfilePage.css, WalletPage.css done')
