import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── AppStorePage.css ───────────────────────────────────────────────────────────
open(os.path.join(d, 'AppStorePage.css'), 'w', encoding='utf-8').write("""/* AppStorePage */
.appstore-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }

/* Header */
.appstore-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 20px; margin-bottom: var(--sp-6); flex-wrap: wrap;
}
.appstore-title h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.appstore-title p { color: var(--text-2); font-size: .9rem; }
.appstore-search-bar {
  position: relative; min-width: 260px;
}
.search-input {
  width: 100%; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-full); padding: 10px 40px 10px 18px;
  color: var(--text-1); font-size: .9rem; box-sizing: border-box;
  transition: border-color var(--t-base);
}
.search-input:focus { outline: none; border-color: var(--violet); box-shadow: 0 0 0 3px var(--violet-dim); }
.clear-search {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--text-3); cursor: pointer; font-size: 1rem;
}
.clear-search:hover { color: var(--text-1); }

/* Tabs */
.appstore-tabs { display: flex; gap: 4px; margin-bottom: var(--sp-6); border-bottom: 1px solid var(--border); padding-bottom: 1px; }
.tab-btn {
  padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent;
  color: var(--text-2); font-size: .875rem; font-weight: 500; cursor: pointer;
  transition: all var(--t-base); margin-bottom: -1px;
}
.tab-btn:hover { color: var(--text-1); }
.tab-btn.active { color: var(--violet-light); border-bottom-color: var(--violet); font-weight: 600; }

/* Category bar */
.category-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: var(--sp-6); }
.cat-btn {
  padding: 6px 16px; border: 1px solid var(--border);
  border-radius: var(--r-full); background: var(--surface-2);
  color: var(--text-2); font-size: .8rem; cursor: pointer;
  transition: all var(--t-base);
}
.cat-btn:hover, .cat-btn.active { border-color: var(--violet); color: var(--violet-light); background: var(--violet-dim); }

/* Sort bar */
.sort-bar { display: flex; align-items: center; gap: 10px; margin-bottom: var(--sp-6); }
.sort-bar label { font-size: .8rem; color: var(--text-3); }
.sort-select {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 7px 12px;
  color: var(--text-1); font-size: .85rem; cursor: pointer;
}

/* Featured banner */
.featured-banners { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 4px; margin-bottom: var(--sp-6); }
.featured-banner {
  min-width: 320px; display: flex; align-items: center; gap: 18px;
  background: linear-gradient(135deg, var(--surface-2), var(--surface-3));
  border: 1px solid var(--border-accent); border-radius: var(--r-2xl); padding: 20px 24px;
  cursor: pointer; transition: all var(--t-base);
}
.featured-banner:hover { transform: translateY(-2px); box-shadow: var(--shadow-violet); }
.featured-icon { font-size: 2.5rem; flex-shrink: 0; }
.featured-info { flex: 1; }
.featured-tag { font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; color: var(--amber); font-weight: 700; margin-bottom: 4px; }
.featured-info h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.featured-info p { font-size: .8rem; color: var(--text-2); margin-bottom: 8px; }
.featured-meta { display: flex; align-items: center; gap: 8px; font-size: .78rem; color: var(--text-3); }

/* Apps grid */
.apps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 16px; }
.app-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px;
  cursor: pointer; transition: all var(--t-base);
  display: flex; flex-direction: column; gap: 12px;
}
.app-card:hover { border-color: var(--border-accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.app-card-header { position: relative; display: flex; align-items: flex-start; justify-content: space-between; }
.app-icon { font-size: 2.2rem; }
.verified-badge {
  background: rgba(6,182,212,.15); color: var(--cyan);
  border: 1px solid rgba(6,182,212,.3); border-radius: var(--r-full);
  padding: 3px 8px; font-size: .7rem; font-weight: 700;
}
.featured-badge {
  background: rgba(245,158,11,.15); color: var(--amber);
  border: 1px solid rgba(245,158,11,.3); border-radius: var(--r-full);
  padding: 3px 8px; font-size: .7rem; font-weight: 700;
}
.app-card-body { flex: 1; }
.app-name { font-size: .95rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.app-tagline { font-size: .8rem; color: var(--text-2); margin-bottom: 8px; line-height: 1.4; }
.app-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.app-category {
  font-size: .7rem; padding: 3px 8px;
  background: var(--surface-3); border-radius: var(--r-full);
  color: var(--text-3);
}
.platform-icons { display: flex; gap: 4px; }
.platform-badge { font-size: .9rem; }
.app-stats { display: flex; align-items: center; gap: 8px; }
.stars { display: flex; gap: 2px; }
.star { font-size: .85rem; color: var(--text-3); }
.star.filled { color: var(--amber); }
.star.interactive { cursor: pointer; transition: transform var(--t-fast); }
.star.interactive:hover { transform: scale(1.2); }
.rating-text { font-size: .78rem; color: var(--text-2); font-weight: 600; }
.install-count { font-size: .75rem; color: var(--text-3); margin-left: auto; }

/* Install button */
.install-btn {
  width: 100%; padding: 9px; border-radius: var(--r-lg);
  background: var(--grad-primary); color: #fff;
  border: none; font-size: .85rem; font-weight: 600;
  cursor: pointer; transition: all var(--t-fast);
}
.install-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
.install-btn.installed { background: rgba(16,185,129,.15); color: var(--green); border: 1px solid rgba(16,185,129,.3); }
.install-btn.large { padding: 12px 24px; width: auto; border-radius: var(--r-full); font-size: .9rem; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.7);
  backdrop-filter: blur(6px); display: flex; align-items: center;
  justify-content: center; z-index: 1000; padding: 20px;
}
.app-modal {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 32px; max-width: 640px;
  width: 100%; max-height: 85vh; overflow-y: auto;
  position: relative; animation: fadeIn .2s ease;
}
.modal-close {
  position: absolute; top: 20px; right: 20px;
  background: var(--surface-3); border: 1px solid var(--border);
  border-radius: var(--r-full); width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-2); font-size: .9rem;
}
.modal-close:hover { color: var(--text-1); border-color: var(--red); }
.modal-header { display: flex; gap: 20px; margin-bottom: var(--sp-5); }
.modal-icon { font-size: 3rem; flex-shrink: 0; }
.modal-title-area { flex: 1; }
.modal-title-area h2 { font-size: 1.3rem; font-weight: 800; color: var(--text-1); margin-bottom: 6px; }
.modal-tagline { color: var(--text-2); font-size: .9rem; margin-bottom: 8px; }
.modal-meta { display: flex; align-items: center; gap: 8px; font-size: .8rem; color: var(--text-3); flex-wrap: wrap; }
.modal-stats-row { display: flex; gap: 1px; background: var(--border); border-radius: var(--r-xl); overflow: hidden; margin-bottom: var(--sp-5); }
.stat-box { flex: 1; background: var(--surface-2); padding: 14px; text-align: center; }
.stat-val { display: block; font-size: 1.1rem; font-weight: 800; color: var(--text-1); }
.stat-lbl { display: block; font-size: .7rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
.modal-description h3 { font-size: .9rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
.modal-description p { font-size: .9rem; color: var(--text-1); line-height: 1.6; margin-bottom: var(--sp-4); }
.modal-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--sp-4); }
.tag { font-size: .75rem; padding: 4px 10px; background: var(--violet-dim); color: var(--violet-light); border-radius: var(--r-full); }
.modal-ipfs { display: flex; align-items: center; gap: 8px; background: var(--surface-2); border-radius: var(--r-md); padding: 10px 14px; margin-bottom: var(--sp-4); font-size: .8rem; }
.ipfs-label { color: var(--text-3); }
.modal-ipfs code { font-family: var(--font-mono); color: var(--cyan); word-break: break-all; }
.modal-actions { display: flex; gap: 12px; align-items: center; margin-bottom: var(--sp-6); flex-wrap: wrap; }
.website-link {
  padding: 10px 20px; border: 1px solid var(--border); border-radius: var(--r-full);
  color: var(--text-2); font-size: .875rem; text-decoration: none; transition: all var(--t-fast);
}
.website-link:hover { border-color: var(--cyan); color: var(--cyan); }

/* Rate section */
.rate-section { border-top: 1px solid var(--border); padding-top: var(--sp-5); margin-bottom: var(--sp-5); }
.rate-section h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.rate-form { display: flex; flex-direction: column; gap: 10px; }
.rate-stars { display: flex; align-items: center; gap: 10px; }
.rate-comment {
  width: 100%; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 10px 14px; color: var(--text-1);
  font-size: .875rem; resize: none; box-sizing: border-box;
}
.rate-comment:focus { outline: none; border-color: var(--violet); }
.submit-rating-btn {
  align-self: flex-start; padding: 9px 22px; background: var(--grad-primary);
  color: #fff; border: none; border-radius: var(--r-full);
  font-size: .875rem; font-weight: 600; cursor: pointer;
}
.submit-rating-btn:hover { filter: brightness(1.1); }
.status-msg { font-size: .85rem; color: var(--text-2); }
.connect-hint { font-size: .875rem; color: var(--text-3); }

/* Reviews */
.reviews-section h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.review-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
.review-item:last-child { border-bottom: none; }
.review-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.review-addr { font-size: .75rem; color: var(--text-3); font-family: var(--font-mono); }
.review-comment { font-size: .85rem; color: var(--text-2); line-height: 1.4; }

/* Loading */
.apps-loading { text-align: center; padding: var(--sp-12); color: var(--text-3); }

/* Installed tab - empty */
.installed-empty { text-align: center; padding: var(--sp-12); color: var(--text-3); }

/* Submit form */
.submit-form-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; max-width: 600px;
}
.submit-form-card h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-6); }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--sp-4); }
.form-group label { font-size: .8rem; font-weight: 600; color: var(--text-2); }
.form-group input, .form-group select, .form-group textarea {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 10px 14px;
  color: var(--text-1); font-size: .9rem; font-family: var(--font-sans);
  transition: border-color var(--t-base); box-sizing: border-box;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: var(--violet); box-shadow: 0 0 0 3px var(--violet-dim);
}
.platform-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; }
.platform-check {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 1px solid var(--border);
  border-radius: var(--r-full); cursor: pointer; font-size: .8rem; color: var(--text-2);
  transition: all var(--t-fast);
}
.platform-check.active { border-color: var(--violet); color: var(--violet-light); background: var(--violet-dim); }
.submit-status { margin-top: var(--sp-4); padding: 12px 16px; border-radius: var(--r-md); font-size: .875rem; }
.submit-status.ok  { background: rgba(16,185,129,.1); color: var(--green);  border: 1px solid rgba(16,185,129,.3); }
.submit-status.err { background: rgba(239,68,68,.1);  color: var(--red);    border: 1px solid rgba(239,68,68,.3); }

@media (max-width: 768px) {
  .appstore-page { padding: var(--sp-4); }
  .appstore-header { flex-direction: column; }
  .appstore-search-bar { width: 100%; }
  .apps-grid { grid-template-columns: 1fr 1fr; }
  .featured-banner { min-width: 280px; }
}
@media (max-width: 480px) {
  .apps-grid { grid-template-columns: 1fr; }
}
""")

print('AppStorePage.css done')
