import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── IdentityPage.css ──────────────────────────────────────────────────────────
open(os.path.join(d, 'IdentityPage.css'), 'w', encoding='utf-8').write("""/* IdentityPage */
.identity-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.identity-container { max-width: 960px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }

/* Header */
.identity-header { margin-bottom: var(--sp-6); }
.identity-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.identity-header .subtitle { color: var(--text-2); font-size: .9rem; }
.identity-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: var(--sp-4); }

/* DID card */
.did-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; margin-bottom: var(--sp-6);
}
.did-card h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-5); }
.did-display {
  font-family: var(--font-mono); font-size: .8rem; color: var(--cyan);
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 12px 16px; word-break: break-all;
  margin-bottom: var(--sp-4); display: flex; align-items: center;
  justify-content: space-between; gap: 12px;
}
.copy-btn {
  padding: 6px 14px; border: 1px solid var(--border); border-radius: var(--r-full);
  background: var(--surface-3); color: var(--text-2); font-size: .78rem;
  cursor: pointer; white-space: nowrap; transition: all var(--t-fast);
}
.copy-btn:hover { border-color: var(--cyan); color: var(--cyan); }
.did-create { color: var(--text-2); font-size: .875rem; }
.did-description { font-size: .85rem; color: var(--text-2); line-height: 1.5; margin-bottom: var(--sp-4); }
.chain-status-row { display: flex; align-items: center; gap: 10px; font-size: .85rem; color: var(--text-2); margin-bottom: var(--sp-4); }
.status-label { font-weight: 600; }

/* Reputation card */
.reputation-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; margin-bottom: var(--sp-6);
}
.reputation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-5); }
.reputation-header h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); }
.score-display { display: flex; align-items: flex-end; gap: 4px; }
.score-value { font-size: 2.5rem; font-weight: 900; color: var(--amber); line-height: 1; }
.score-max { font-size: .9rem; color: var(--text-3); margin-bottom: 4px; }
.rep-score { margin-bottom: var(--sp-5); }
.progress-bar { height: 10px; background: var(--surface-3); border-radius: var(--r-full); overflow: hidden; margin-top: 8px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--amber), var(--violet)); border-radius: var(--r-full); transition: width .6s ease; }
.reputation-factors { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 10px; margin-bottom: var(--sp-5); }
.factor { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
.factor-value { font-size: .95rem; font-weight: 700; color: var(--violet-light); }

/* Reputation history */
.rep-history { margin-top: var(--sp-4); }
.rep-history-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-3); }
.rep-history-header h4 { font-size: .85rem; font-weight: 700; color: var(--text-2); }
.history-btn { padding: 5px 12px; border: 1px solid var(--border); border-radius: var(--r-full); background: none; color: var(--text-3); font-size: .75rem; cursor: pointer; }
.history-btn:hover { color: var(--text-1); border-color: var(--violet); }
.rep-history-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: .82rem; }
.rep-history-row:last-child { border-bottom: none; }
.rep-tx { font-family: var(--font-mono); color: var(--cyan); flex: 1; }
.rep-ts { color: var(--text-3); font-size: .75rem; }
.rep-history-empty { color: var(--text-3); font-size: .85rem; padding: var(--sp-4); text-align: center; }

/* Credentials */
.credentials-section {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; margin-bottom: var(--sp-6);
}
.credentials-section h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-5); }
.loading-credentials { text-align: center; padding: var(--sp-6); color: var(--text-3); }
.no-credentials { text-align: center; padding: var(--sp-6); color: var(--text-3); font-size: .875rem; }
.credentials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 14px; }
.credential-card {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-xl); padding: 18px; transition: all var(--t-base);
}
.credential-card:hover { border-color: var(--border-accent); }
.credential-card.credential-revoked { opacity: .5; border-color: rgba(239,68,68,.3); }
.credential-icon { font-size: 1.8rem; margin-bottom: 10px; }
.credential-description { font-size: .875rem; font-weight: 600; color: var(--text-1); margin-bottom: 6px; }
.credential-issuer { font-size: .75rem; color: var(--text-3); font-family: var(--font-mono); margin-bottom: 8px; }
.credential-date { font-size: .72rem; color: var(--text-3); margin-bottom: 10px; }
.credential-actions { display: flex; gap: 6px; }

/* Actions section */
.action-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 14px; margin-top: var(--sp-6); }
.action-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 22px; text-align: center;
  cursor: pointer; transition: all var(--t-base);
}
.action-card:hover { border-color: var(--violet); transform: translateY(-2px); box-shadow: var(--shadow-violet); }
.action-icon { font-size: 2rem; margin-bottom: 12px; }
.action-card h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: 6px; }
.action-card p { font-size: .8rem; color: var(--text-2); line-height: 1.4; margin-bottom: 14px; }
.action-btn { padding: 8px 18px; border: 1px solid var(--border); border-radius: var(--r-full); background: var(--surface-2); color: var(--text-1); font-size: .8rem; font-weight: 600; cursor: pointer; }

/* Activity */
.activities-list { display: flex; flex-direction: column; gap: 0; }
.loading-activities { text-align: center; padding: var(--sp-6); color: var(--text-3); }
.no-activities { text-align: center; padding: var(--sp-6); color: var(--text-3); font-size: .875rem; }
.activity-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.activity-item:last-child { border-bottom: none; }
.activity-icon { font-size: 1.3rem; flex-shrink: 0; }
.activity-details { flex: 1; }
.activity-action { font-size: .875rem; color: var(--text-1); }
.activity-time { font-size: .75rem; color: var(--text-3); margin-top: 2px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-5); }
.modal-header h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); }
.close-btn, .close-small {
  background: var(--surface-3); border: 1px solid var(--border);
  border-radius: var(--r-full); width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-2); font-size: .9rem;
}
.close-btn:hover, .close-small:hover { color: var(--red); border-color: var(--red); }
.modal-body { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: .8rem; font-weight: 600; color: var(--text-2); }
.form-group input, .form-group select, .form-group textarea {
  background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-md);
  padding: 10px 14px; color: var(--text-1); font-size: .9rem;
}
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--violet); }
.btn-primary { padding: 10px 22px; background: var(--grad-primary); color: #fff; border: none; border-radius: var(--r-full); font-size: .875rem; font-weight: 600; cursor: pointer; }
.btn-secondary { padding: 10px 20px; border: 1px solid var(--border); border-radius: var(--r-full); background: var(--surface-2); color: var(--text-2); font-size: .875rem; font-weight: 600; cursor: pointer; }
.privacy-notice { font-size: .78rem; color: var(--text-3); background: var(--surface-2); border-radius: var(--r-md); padding: 10px 14px; line-height: 1.5; }

@media (max-width: 768px) {
  .identity-page { padding: var(--sp-4); }
  .credentials-grid { grid-template-columns: 1fr; }
  .action-grid { grid-template-columns: 1fr 1fr; }
}
""")

print('IdentityPage.css done')
