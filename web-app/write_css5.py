import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

open(os.path.join(d, 'DocsPage.css'), 'w', encoding='utf-8').write("""/* DocsPage */
.docs-layout {
  display: flex; min-height: 100vh;
  animation: fadeIn 0.35s ease both;
}

/* Sidebar */
.docs-sidebar {
  width: 240px; flex-shrink: 0; position: sticky; top: 0;
  height: 100vh; overflow-y: auto; padding: 28px 16px;
  border-right: 1px solid var(--border); background: var(--bg-2);
}
.docs-sidebar-title {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: var(--text-3); margin-bottom: var(--sp-6); padding: 0 8px;
}
.docs-nav-group { margin-bottom: var(--sp-5); }
.docs-nav-group-label {
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: var(--text-3); padding: 0 8px;
  margin-bottom: 4px;
}
.docs-nav-link {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 10px; border-radius: var(--r-lg); border: none;
  background: transparent; color: var(--text-2); font-size: .85rem;
  text-align: left; cursor: pointer; transition: all var(--t-fast);
}
.docs-nav-link:hover { background: var(--surface-2); color: var(--text-1); }
.docs-nav-link.active { background: var(--violet-dim); color: var(--violet-light); font-weight: 600; }
.docs-nav-link-icon { font-size: .95rem; flex-shrink: 0; }

/* Content */
.docs-content {
  flex: 1; min-width: 0; padding: 40px 48px; max-width: 860px;
  overflow-y: auto;
}

/* Section */
.docs-section { margin-bottom: 60px; scroll-margin-top: 80px; }
.docs-section-header {
  display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;
}
.docs-section-icon {
  font-size: 2rem; width: 52px; height: 52px;
  background: var(--violet-dim); border-radius: var(--r-xl);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.docs-section-title {
  font-size: 1.5rem; font-weight: 800; color: var(--text-1);
  letter-spacing: -0.02em; margin-bottom: 4px;
}
.docs-section-subtitle { font-size: .9rem; color: var(--text-3); }

/* Body text */
.docs-lead {
  font-size: 1.05rem; color: var(--text-1); line-height: 1.7;
  margin-bottom: 16px;
}
.docs-highlight {
  background: var(--grad-primary); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text;
  font-weight: 700;
}
.docs-body {
  font-size: .9rem; color: var(--text-2); line-height: 1.7; margin-bottom: 14px;
}

/* Card grid */
.docs-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 14px; margin-top: 24px; }
.docs-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px; transition: all var(--t-base);
}
.docs-card:hover { border-color: var(--border-accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.docs-card-icon { font-size: 1.6rem; margin-bottom: 10px; }
.docs-card-title { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: 6px; }
.docs-card-desc { font-size: .8rem; color: var(--text-2); line-height: 1.5; }

/* Code blocks */
.docs-code {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 16px 20px; margin: 16px 0;
  font-family: var(--font-mono); font-size: .82rem; color: var(--text-1);
  overflow-x: auto; line-height: 1.6;
}
.docs-code-inline {
  font-family: var(--font-mono); font-size: .82rem;
  background: var(--surface-2); color: var(--cyan);
  padding: 2px 6px; border-radius: 4px;
}

/* Feature list */
.docs-feature-list { list-style: none; padding: 0; margin: 16px 0; }
.docs-feature-list li {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--border);
  font-size: .875rem; color: var(--text-2); line-height: 1.5;
}
.docs-feature-list li:last-child { border-bottom: none; }
.docs-feature-list li::before { content: "->"; color: var(--violet); font-weight: 700; flex-shrink: 0; margin-top: 1px; }

/* Callout */
.docs-callout {
  background: rgba(139,92,246,.08); border-left: 3px solid var(--violet);
  border-radius: 0 var(--r-lg) var(--r-lg) 0;
  padding: 14px 18px; margin: 16px 0; font-size: .875rem;
  color: var(--text-2); line-height: 1.6;
}
.docs-callout.tip  { border-left-color: var(--green); background: rgba(16,185,129,.06); }
.docs-callout.warn { border-left-color: var(--amber); background: rgba(245,158,11,.06); }

/* Table */
.docs-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: .875rem; }
.docs-table th, .docs-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); text-align: left; }
.docs-table th { color: var(--text-3); font-weight: 600; text-transform: uppercase; font-size: .72rem; letter-spacing: .06em; }
.docs-table td { color: var(--text-2); }
.docs-table tr:last-child td { border-bottom: none; }

/* Steps */
.docs-steps { counter-reset: step; display: flex; flex-direction: column; gap: 14px; margin: 16px 0; }
.docs-step { display: flex; gap: 16px; align-items: flex-start; }
.docs-step-num {
  width: 32px; height: 32px; border-radius: var(--r-full);
  background: var(--grad-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; font-weight: 800; flex-shrink: 0; margin-top: 2px;
}
.docs-step-body h4 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.docs-step-body p { font-size: .85rem; color: var(--text-2); line-height: 1.5; }

/* Divider */
.docs-divider { border: none; border-top: 1px solid var(--border); margin: 32px 0; }

@media (max-width: 1024px) {
  .docs-content { padding: 28px 24px; }
}
@media (max-width: 768px) {
  .docs-layout { flex-direction: column; }
  .docs-sidebar { width: 100%; height: auto; position: relative; padding: 20px 16px; border-right: none; border-bottom: 1px solid var(--border); }
  .docs-content { padding: 24px 16px; }
  .docs-card-grid { grid-template-columns: 1fr 1fr; }
}
""")

print('DocsPage.css done')
