import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── AppStorePage.css additions ─────────────────────────────────────────────────
with open(os.path.join(d, 'AppStorePage.css'), 'a', encoding='utf-8') as f:
    f.write("""
/* Additional AppStore classes */
.browse-layout { display: flex; gap: 20px; align-items: flex-start; }
.category-sidebar { width: 200px; flex-shrink: 0; background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 12px; }
.sidebar-section { margin-bottom: 8px; }
.browse-main { flex: 1; min-width: 0; }
.apps-section { margin-bottom: var(--sp-8); }
.apps-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.apps-section-header h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); }
.app-count, .cat-count { font-size: .75rem; color: var(--text-3); background: var(--surface-2); padding: 2px 8px; border-radius: var(--r-full); }
.featured-section { margin-bottom: var(--sp-6); }
.featured-scroll { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 8px; }
.featured-scroll::-webkit-scrollbar { height: 4px; }
.loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 16px; }
.skeleton-card { background: var(--surface-1); border-radius: var(--r-2xl); height: 220px; animation: pulse-glow 1.5s ease infinite; }
.empty-state { text-align: center; padding: var(--sp-12); color: var(--text-3); }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.installed-page { padding: var(--sp-6) 0; }
.submit-page { max-width: 560px; }
.submit-card { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 28px; }
.submit-intro { font-size: .875rem; color: var(--text-2); margin-bottom: var(--sp-6); }
.icon-preview { width: 64px; height: 64px; border-radius: var(--r-xl); background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 2rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.submit-btn { padding: 12px 28px; background: var(--grad-primary); color: #fff; border: none; border-radius: var(--r-full); font-size: .9rem; font-weight: 700; cursor: pointer; }
.connect-warning { background: var(--violet-dim); border: 1px solid var(--border-accent); border-radius: var(--r-xl); padding: 12px 16px; font-size: .85rem; color: var(--violet-light); margin-bottom: 16px; }
""")

# ── CommunityPage.css additions ────────────────────────────────────────────────
with open(os.path.join(d, 'CommunityPage.css'), 'a', encoding='utf-8') as f:
    f.write("""
/* Additional Community classes */
.post-author-info { display: flex; flex-direction: column; gap: 2px; }
.comment-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
""")

# ── DataVaultPage.css additions ────────────────────────────────────────────────
with open(os.path.join(d, 'DataVaultPage.css'), 'a', encoding='utf-8') as f:
    f.write("""
/* Additional DataVault classes */
.vault-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.vault-title-group { display: flex; flex-direction: column; gap: 4px; }
.vault-header-actions { display: flex; gap: 8px; align-items: center; }
.btn-upload, .btn-sync { padding: 9px 18px; border: none; border-radius: var(--r-full); font-size: .82rem; font-weight: 600; cursor: pointer; transition: all var(--t-fast); }
.btn-upload { background: var(--grad-primary); color: #fff; }
.btn-sync { background: var(--surface-2); color: var(--text-1); border: 1px solid var(--border); }
.btn-upload:hover { filter: brightness(1.1); }
.btn-sync:hover { border-color: var(--violet); }
.vault-connect-wall { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; text-align: center; gap: 16px; }
.wall-icon { font-size: 3.5rem; }
.connected-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.3); border-radius: var(--r-full); padding: 4px 12px; font-size: .75rem; color: var(--green); font-weight: 600; }
.vaults-tab, .files-tab { padding: var(--sp-4) 0; }
""")

# ── DocsPage.css additions ─────────────────────────────────────────────────────
with open(os.path.join(d, 'DocsPage.css'), 'a', encoding='utf-8') as f:
    f.write("""
/* Additional Docs classes */
.docs-page-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
.docs-page-icon { font-size: 2.5rem; }
.docs-page-title { font-size: 1.4rem; font-weight: 800; color: var(--text-1); margin-bottom: 4px; }
.docs-page-route { font-size: .75rem; font-family: var(--font-mono); color: var(--violet-light); }
.docs-page-desc { font-size: .875rem; color: var(--text-2); line-height: 1.5; margin-bottom: 16px; }
.docs-page-entry { margin-bottom: 12px; }
.what-is-civitas, .getting-started, .tech-stack, .data-vault, .mobile-money { scroll-margin-top: 20px; }
.docs-callout-icon { font-size: 1.5rem; flex-shrink: 0; }
.docs-callout-body { flex: 1; }
.docs-faq-item { border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; margin-bottom: 8px; }
.docs-faq-q { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; background: var(--surface-1); font-size: .875rem; font-weight: 600; color: var(--text-1); }
.docs-faq-a { padding: 14px 18px; font-size: .85rem; color: var(--text-2); line-height: 1.5; border-top: 1px solid var(--border); }
.docs-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
.docs-flow-step { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 8px 14px; font-size: .82rem; color: var(--text-1); }
.docs-flow-arrow { color: var(--text-3); font-size: 1.1rem; }
.docs-interact-box { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 24px; margin: 16px 0; }
.docs-interact-label { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); margin-bottom: 10px; }
.docs-interact-steps { display: flex; flex-direction: column; gap: 8px; }
.docs-layers { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; }
.docs-layer { display: flex; align-items: flex-start; gap: 14px; background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 16px; }
.docs-layer-number { width: 30px; height: 30px; border-radius: var(--r-full); background: var(--grad-primary); display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 800; color: #fff; flex-shrink: 0; }
.docs-layer-body { flex: 1; }
.docs-layer-name { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.docs-layer-desc { font-size: .82rem; color: var(--text-2); margin-bottom: 8px; }
.docs-layer-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.docs-tag { font-size: .7rem; padding: 2px 8px; background: var(--violet-dim); border: 1px solid var(--border-accent); border-radius: var(--r-full); color: var(--violet-light); }
.docs-stack-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
.docs-stack-chip { display: flex; align-items: center; gap: 6px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 8px 12px; }
.docs-stack-chip-label { font-size: .82rem; font-weight: 600; color: var(--text-1); }
""")

# ── HomePage.css additions ─────────────────────────────────────────────────────
home_css = os.path.join(d, 'HomePage.css')
if os.path.exists(home_css):
    with open(home_css, 'a', encoding='utf-8') as f:
        f.write("""
/* Additional Home classes */
.quick-actions { margin-top: var(--sp-8); }
.section-title { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.action-buttons { display: flex; flex-wrap: wrap; gap: 10px; }
""")
else:
    with open(home_css, 'w', encoding='utf-8') as f:
        f.write("""/* HomePage */
.quick-actions { margin-top: var(--sp-8); }
.section-title { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.action-buttons { display: flex; flex-wrap: wrap; gap: 10px; }
""")

print('All additions done')
