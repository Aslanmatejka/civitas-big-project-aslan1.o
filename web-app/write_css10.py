import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

open(os.path.join(d, 'MarketplacePage.css'), 'w', encoding='utf-8').write("""/* MarketplacePage */
.marketplace-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.marketplace-container { max-width: 1000px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }
.not-connected p { margin-bottom: var(--sp-6); }

/* Header */
.marketplace-container h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.marketplace-container .subtitle { color: var(--text-2); font-size: .9rem; margin-bottom: var(--sp-6); }

/* Tabs */
.marketplace-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: var(--sp-6); }
.marketplace-tabs button {
  padding: 10px 20px; background: none; border: none;
  border-bottom: 2px solid transparent; color: var(--text-2);
  font-size: .875rem; font-weight: 500; cursor: pointer;
  transition: all var(--t-base); margin-bottom: -1px;
}
.marketplace-tabs button:hover { color: var(--text-1); }
.marketplace-tabs button.active { color: var(--violet-light); border-bottom-color: var(--violet); font-weight: 600; }

/* Loading and empty */
.loading-state { text-align: center; padding: var(--sp-12); color: var(--text-3); }
.empty-state { text-align: center; padding: var(--sp-12); color: var(--text-3); }
.empty-icon { font-size: 3rem; margin-bottom: var(--sp-4); }
.empty-state p { font-size: .9rem; margin-bottom: var(--sp-6); }

/* Listings grid */
.listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 18px; }
.listing-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); overflow: hidden; transition: all var(--t-base);
  display: flex; flex-direction: column;
}
.listing-card:hover { border-color: var(--border-accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.listing-image {
  height: 180px; background: var(--surface-2);
  display: flex; align-items: center; justify-content: center; font-size: 4rem;
}
.listing-content { padding: 18px; flex: 1; display: flex; flex-direction: column; }
.listing-category {
  font-size: .7rem; text-transform: uppercase; letter-spacing: .08em;
  color: var(--violet-light); font-weight: 700; margin-bottom: 6px;
}
.listing-content h3 { font-size: .95rem; font-weight: 700; color: var(--text-1); margin-bottom: 6px; }
.listing-content p { font-size: .82rem; color: var(--text-2); line-height: 1.4; flex: 1; margin-bottom: 12px; }
.listing-stats { display: flex; gap: 12px; font-size: .78rem; color: var(--text-3); margin-bottom: 10px; }
.listing-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto; }
.listing-price { font-size: 1.1rem; font-weight: 800; background: var(--grad-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.listing-seller { font-size: .72rem; color: var(--text-3); font-family: var(--font-mono); }
.buy-btn {
  padding: 8px 18px; background: var(--grad-primary); color: #fff;
  border: none; border-radius: var(--r-full); font-size: .82rem;
  font-weight: 600; cursor: pointer; transition: all var(--t-fast);
}
.buy-btn:hover:not(:disabled) { filter: brightness(1.1); }
.buy-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Create listing form */
.create-listing-form {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; max-width: 600px;
}
.create-listing-form h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-6); }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--sp-4); }
.form-group label { font-size: .8rem; font-weight: 600; color: var(--text-2); }
.form-group input, .form-group select, .form-group textarea {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 10px 14px;
  color: var(--text-1); font-size: .9rem; font-family: var(--font-sans);
  box-sizing: border-box; transition: border-color var(--t-base);
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--violet); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.submit, .submit-btn {
  padding: 12px 28px; background: var(--grad-primary); color: #fff;
  border: none; border-radius: var(--r-full); font-size: .9rem;
  font-weight: 700; cursor: pointer; transition: all var(--t-fast); margin-top: var(--sp-4);
}
.submit:hover, .submit-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

@media (max-width: 768px) {
  .marketplace-page { padding: var(--sp-4); }
  .listings-grid { grid-template-columns: repeat(2,1fr); }
  .form-row { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .listings-grid { grid-template-columns: 1fr; }
}
""")

# ── MessagingPage.css check ───────────────────────────────────────────────────
# MessagingPage is complex - let's verify it has key classes
import re
with open(os.path.join(d, 'MessagingPage.js'), 'r', encoding='utf-8') as f:
    js = f.read()
with open(os.path.join(d, 'MessagingPage.css'), 'r', encoding='utf-8') as f:
    css = f.read()

classes = set(re.findall(r'"([a-z][a-z0-9\-]+)"', js))
missing = [c for c in sorted(classes) if '.' + c not in css and c not in ('true', 'false')]
print(f"MessagingPage missing ({len(missing)}): {', '.join(missing[:20])}...")

print('MarketplacePage.css done')
