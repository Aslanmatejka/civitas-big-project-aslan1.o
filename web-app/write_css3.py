import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── DataVaultPage.css ─────────────────────────────────────────────────────────
open(os.path.join(d, 'DataVaultPage.css'), 'w', encoding='utf-8').write("""/* DataVaultPage */
.data-vault-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }

/* Header */
.vault-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: var(--sp-6); flex-wrap: wrap; }
.vault-header-content {}
.vault-title { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.vault-subtitle { color: var(--text-2); font-size: .9rem; }
.vault-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.upload-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 22px; background: var(--grad-primary); color: #fff;
  border: none; border-radius: var(--r-full); font-size: .875rem;
  font-weight: 600; cursor: pointer; transition: all var(--t-fast);
}
.upload-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

/* Sync bar */
.sync-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 10px 16px; margin-bottom: var(--sp-4);
  font-size: .85rem; color: var(--text-2);
}
.sync-bar.loading { border-color: rgba(245,158,11,.3); }
.sync-bar.success { border-color: rgba(16,185,129,.3); color: var(--green); }
.sync-bar.error   { border-color: rgba(239,68,68,.3);  color: var(--red); }
.spin { display: inline-block; animation: spin .8s linear infinite; }
.sync-cid { font-family: var(--font-mono); font-size: .75rem; color: var(--cyan); }

/* Upload progress */
.upload-progress-bar {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface-2); border: 1px solid rgba(139,92,246,.3);
  border-radius: var(--r-lg); padding: 10px 16px; margin-bottom: var(--sp-4);
  font-size: .85rem; color: var(--text-2);
}
.progress-track { flex: 1; height: 6px; background: var(--surface-3); border-radius: var(--r-full); overflow: hidden; }
.progress-fill { height: 100%; background: var(--grad-primary); transition: width .3s ease; border-radius: var(--r-full); }

/* Tabs */
.vault-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: var(--sp-6); }
.vtab {
  padding: 10px 20px; background: none; border: none;
  border-bottom: 2px solid transparent; color: var(--text-2);
  font-size: .875rem; font-weight: 500; cursor: pointer;
  transition: all var(--t-base); margin-bottom: -1px;
}
.vtab:hover { color: var(--text-1); }
.vtab.active { color: var(--violet-light); border-bottom-color: var(--violet); font-weight: 600; }

/* Info banner */
.info-banner {
  display: flex; align-items: flex-start; gap: 14px;
  background: rgba(6,182,212,.08); border: 1px solid rgba(6,182,212,.25);
  border-radius: var(--r-xl); padding: 16px 20px; margin-bottom: var(--sp-6);
  font-size: .875rem; color: var(--text-2); line-height: 1.5;
}
.info-icon { font-size: 1.4rem; flex-shrink: 0; }

/* Providers grid */
.providers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
.provider-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 22px; transition: all var(--t-base);
}
.provider-card:hover { border-color: var(--border-accent); }
.provider-card.connected { border-color: rgba(16,185,129,.3); }
.pc-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 10px; }
.pc-icon { font-size: 2rem; flex-shrink: 0; }
.pc-title-area { flex: 1; }
.pc-title-area h3 { font-size: .95rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.pc-tech { font-size: .72rem; color: var(--cyan); background: rgba(6,182,212,.12); padding: 2px 8px; border-radius: var(--r-full); }
.pc-badge { font-size: .72rem; color: var(--green); background: rgba(16,185,129,.12); padding: 3px 8px; border-radius: var(--r-full); white-space: nowrap; }
.pc-tagline { font-size: .85rem; color: var(--text-1); font-weight: 600; margin-bottom: 6px; }
.pc-desc { font-size: .8rem; color: var(--text-2); line-height: 1.4; margin-bottom: 12px; }
.pc-footer { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.pc-free { font-size: .78rem; color: var(--green); }
.pc-link { font-size: .75rem; color: var(--text-3); text-decoration: none; }
.pc-link:hover { color: var(--cyan); }
.pc-actions { display: flex; gap: 8px; }
.btn-sm {
  padding: 7px 14px; border-radius: var(--r-full); font-size: .78rem;
  font-weight: 600; cursor: pointer; border: 1px solid var(--border);
  transition: all var(--t-fast);
}
.btn-connect { background: var(--grad-primary); color: #fff; border: none; }
.btn-connect:hover { filter: brightness(1.1); }
.btn-view { background: var(--surface-2); color: var(--text-1); }
.btn-view:hover { border-color: var(--cyan); color: var(--cyan); }
.btn-danger { background: rgba(239,68,68,.1); color: var(--red); border-color: rgba(239,68,68,.25); }
.btn-danger:hover { background: rgba(239,68,68,.2); }
.pc-connected-since { font-size: .72rem; color: var(--text-3); margin-top: 8px; }

/* Files toolbar */
.files-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: var(--sp-5); flex-wrap: wrap; }
.filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  padding: 5px 14px; border: 1px solid var(--border);
  border-radius: var(--r-full); background: var(--surface-2);
  color: var(--text-2); font-size: .78rem; cursor: pointer;
  transition: all var(--t-fast);
}
.pill:hover, .pill.active { border-color: var(--violet); color: var(--violet-light); background: var(--violet-dim); }
.btn-refresh {
  padding: 7px 14px; border: 1px solid var(--border);
  border-radius: var(--r-full); background: var(--surface-2);
  color: var(--text-2); font-size: .8rem; cursor: pointer;
}
.btn-refresh:hover { border-color: var(--cyan); color: var(--cyan); }

/* Empty state */
.empty-state { text-align: center; padding: var(--sp-12); color: var(--text-3); }
.ei { font-size: 3rem; margin-bottom: var(--sp-4); }
.empty-state p { margin-bottom: var(--sp-4); }
.btn-primary {
  padding: 10px 22px; background: var(--grad-primary); color: #fff;
  border: none; border-radius: var(--r-full); font-size: .875rem;
  font-weight: 600; cursor: pointer;
}

/* File skeletons */
.file-skeletons { display: flex; flex-direction: column; gap: 8px; }
.file-skeleton {
  height: 48px; background: var(--surface-2); border-radius: var(--r-lg);
  animation: shimmer 1.4s ease infinite;
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
}

/* File list */
.file-list { display: flex; flex-direction: column; gap: 2px; }
.file-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: var(--r-lg);
  transition: background var(--t-fast);
}
.file-row:hover { background: var(--surface-2); }
.file-row-icon { font-size: 1.3rem; flex-shrink: 0; }
.file-row-info { flex: 1; min-width: 0; }
.file-row-name { font-size: .875rem; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.file-row-cid { font-size: .72rem; color: var(--text-3); font-family: var(--font-mono); display: block; }
.file-row-size { font-size: .78rem; color: var(--text-3); white-space: nowrap; }
.file-row-date { font-size: .75rem; color: var(--text-3); white-space: nowrap; }
.provider-tag { font-size: .72rem; padding: 3px 8px; border-radius: var(--r-full); font-weight: 600; }
.file-row-open { color: var(--cyan); text-decoration: none; font-size: .85rem; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.vault-modal {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; max-width: 500px;
  width: 100%; position: relative; animation: fadeIn .2s ease;
}
.modal-close {
  position: absolute; top: 16px; right: 16px;
  background: var(--surface-3); border: 1px solid var(--border);
  border-radius: var(--r-full); width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-2); font-size: .9rem;
}
.modal-close:hover { color: var(--red); border-color: var(--red); }
.modal-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: var(--sp-4); }
.modal-icon { font-size: 2rem; }
.modal-header h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); }
.modal-sub { font-size: .8rem; color: var(--text-2); margin-top: 4px; }
.modal-tip { font-size: .8rem; color: var(--amber); background: rgba(245,158,11,.08); border-radius: var(--r-md); padding: 8px 12px; margin-bottom: var(--sp-4); }
.modal-tip a { color: var(--cyan); }
.creds-form { display: flex; flex-direction: column; gap: 16px; }
.creds-group { display: flex; flex-direction: column; gap: 6px; }
.creds-group label { font-size: .8rem; font-weight: 600; color: var(--text-2); }
.creds-group input {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 10px 14px;
  color: var(--text-1); font-size: .9rem;
}
.creds-group input:focus { outline: none; border-color: var(--violet); }
.creds-status { padding: 10px 14px; border-radius: var(--r-md); font-size: .85rem; }
.creds-status.loading { background: rgba(245,158,11,.1); color: var(--amber); }
.creds-status.success { background: rgba(16,185,129,.1); color: var(--green); }
.creds-status.error   { background: rgba(239,68,68,.1);  color: var(--red); }
.modal-actions { display: flex; gap: 10px; }
.btn-secondary {
  padding: 10px 20px; border: 1px solid var(--border);
  border-radius: var(--r-full); background: var(--surface-2);
  color: var(--text-2); font-size: .875rem; font-weight: 600; cursor: pointer;
}
.btn-secondary:hover { border-color: var(--border-md); color: var(--text-1); }
.modal-privacy { margin-top: var(--sp-4); font-size: .75rem; color: var(--text-3); line-height: 1.5; background: var(--surface-2); border-radius: var(--r-md); padding: 10px 14px; }

@media (max-width: 768px) {
  .data-vault-page { padding: var(--sp-4); }
  .providers-grid { grid-template-columns: 1fr; }
  .vault-header { flex-direction: column; }
  .file-row-date { display: none; }
}
""")

print('DataVaultPage.css done')
