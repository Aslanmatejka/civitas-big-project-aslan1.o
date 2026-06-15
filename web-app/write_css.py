import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── NodePage.css ───────────────────────────────────────────────────────────────
open(os.path.join(d, 'NodePage.css'), 'w', encoding='utf-8').write("""/* NodePage */
.node-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.node-container { max-width: 860px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }
.not-connected p { margin-bottom: var(--sp-6); }
.node-header { margin-bottom: var(--sp-8); }
.node-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.node-header .subtitle { color: var(--text-2); font-size: .9rem; }
.node-status-card { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 28px; margin-bottom: var(--sp-6); }
.status-info { display: flex; align-items: center; gap: 16px; margin-bottom: var(--sp-5); }
.status-info h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); }
.status-badge { padding: 6px 16px; border-radius: var(--r-full); font-size: .8rem; font-weight: 700; letter-spacing: .03em; }
.status-badge.running  { background: rgba(16,185,129,.15); color: var(--green);  border: 1px solid rgba(16,185,129,.3); }
.status-badge.syncing  { background: rgba(245,158,11,.15);  color: var(--amber); border: 1px solid rgba(245,158,11,.3); }
.status-badge.stopped  { background: rgba(239,68,68,.12);   color: var(--red);   border: 1px solid rgba(239,68,68,.25); }
.sync-progress { margin-bottom: var(--sp-5); }
.sync-progress p { font-size: .8rem; color: var(--text-2); margin-top: 8px; }
.progress-bar { height: 8px; background: var(--surface-3); border-radius: var(--r-full); overflow: hidden; }
.progress-fill { height: 100%; background: var(--grad-primary); border-radius: var(--r-full); transition: width .5s ease; }
.node-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.node-stats, .node-config, .network-info, .node-info {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; margin-bottom: var(--sp-6);
}
.node-stats h2, .node-config h2, .network-info h2, .node-info h3 {
  font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-6);
}
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 16px; }
.stat-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 20px; text-align: center; transition: border-color var(--t-base); }
.stat-card:hover { border-color: var(--border-accent); }
.stat-icon { font-size: 1.6rem; margin-bottom: 8px; }
.stat-value { font-size: 1.4rem; font-weight: 800; color: var(--violet-light); margin-bottom: 4px; }
.stat-label { font-size: .75rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .06em; }
.config-grid, .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 12px; }
.config-item, .info-item { display: flex; justify-content: space-between; align-items: center; background: var(--surface-2); border-radius: var(--r-md); padding: 12px 16px; }
.config-label, .info-label { font-size: .8rem; color: var(--text-3); }
.config-value, .info-value { font-size: .875rem; font-weight: 600; color: var(--text-1); font-family: var(--font-mono); }
.node-info ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0; }
.node-info li { display: flex; align-items: center; gap: 10px; font-size: .875rem; color: var(--text-2); padding: 10px 0; border-bottom: 1px solid var(--border); }
.node-info li:last-child { border-bottom: none; }
@media (max-width: 768px) {
  .node-page { padding: var(--sp-4); }
  .stats-grid { grid-template-columns: repeat(2,1fr); }
}
""")

# ── CommunityPage.css ──────────────────────────────────────────────────────────
open(os.path.join(d, 'CommunityPage.css'), 'w', encoding='utf-8').write("""/* CommunityPage */
.community-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.community-container { max-width: 680px; margin: 0 auto; }
.community-container h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.community-container .subtitle { color: var(--text-2); font-size: .9rem; margin-bottom: var(--sp-6); }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }

/* Create post card */
.create-post-card {
  display: flex; gap: 14px; align-items: flex-start;
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px; margin-bottom: var(--sp-6);
}
.user-avatar {
  width: 40px; height: 40px; border-radius: var(--r-full);
  background: var(--grad-primary); display: flex; align-items: center;
  justify-content: center; font-size: .85rem; font-weight: 700;
  color: #fff; flex-shrink: 0;
}
.post-input-container { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.post-input {
  width: 100%; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 12px 14px; color: var(--text-1);
  font-family: var(--font-sans); font-size: .9rem; resize: none;
  transition: border-color var(--t-base); box-sizing: border-box;
}
.post-input:focus { outline: none; border-color: var(--violet); box-shadow: 0 0 0 3px var(--violet-dim); }
.post-btn {
  align-self: flex-end; padding: 9px 22px; background: var(--grad-primary);
  color: #fff; border: none; border-radius: var(--r-full);
  font-size: .875rem; font-weight: 600; cursor: pointer;
  transition: all var(--t-fast);
}
.post-btn:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
.post-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Feed */
.posts-feed { display: flex; flex-direction: column; gap: 14px; }
.loading-posts { text-align: center; padding: var(--sp-8); color: var(--text-3); }
.spinner {
  width: 32px; height: 32px; border: 3px solid var(--border);
  border-top-color: var(--violet); border-radius: 50%;
  animation: spin .8s linear infinite; margin: 0 auto var(--sp-3);
}
.no-posts { text-align: center; padding: var(--sp-8); color: var(--text-3); font-size: .9rem; }

/* Post card */
.post-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 22px;
  transition: border-color var(--t-base);
}
.post-card:hover { border-color: var(--border-accent); }
.post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.post-author-avatar {
  width: 36px; height: 36px; border-radius: var(--r-full);
  background: var(--surface-3); display: flex; align-items: center;
  justify-content: center; font-size: .8rem; font-weight: 700;
  color: var(--text-2); flex-shrink: 0;
}
.post-author { font-size: .875rem; font-weight: 600; color: var(--text-1); }
.post-timestamp { font-size: .75rem; color: var(--text-3); margin-top: 2px; }
.post-content { font-size: .9rem; color: var(--text-1); line-height: 1.6; margin-bottom: 12px; }
.post-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.post-tag {
  font-size: .75rem; padding: 3px 10px;
  background: var(--violet-dim); color: var(--violet-light);
  border-radius: var(--r-full); font-weight: 500;
}
.post-actions { display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; }
.action-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border: 1px solid var(--border);
  background: transparent; border-radius: var(--r-full);
  font-size: .8rem; color: var(--text-2); cursor: pointer;
  transition: all var(--t-fast);
}
.action-btn:hover { border-color: var(--violet); color: var(--violet-light); }
.action-btn.liked { color: var(--red); border-color: rgba(239,68,68,.3); background: rgba(239,68,68,.08); }

/* Comments */
.comments-section {
  margin-top: 14px; padding-top: 14px;
  border-top: 1px solid var(--border);
}
.comment-input-container { display: flex; gap: 8px; margin-bottom: 14px; }
.comment-input {
  flex: 1; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-full); padding: 9px 16px;
  color: var(--text-1); font-size: .85rem;
}
.comment-input:focus { outline: none; border-color: var(--violet); }
.comment-btn {
  padding: 9px 18px; background: var(--surface-3);
  border: 1px solid var(--border); border-radius: var(--r-full);
  color: var(--text-1); font-size: .85rem; font-weight: 600; cursor: pointer;
  transition: all var(--t-fast);
}
.comment-btn:hover:not(:disabled) { border-color: var(--violet); color: var(--violet-light); }
.comment-btn:disabled { opacity: .4; }
.comments-list { display: flex; flex-direction: column; gap: 10px; }
.no-comments { font-size: .8rem; color: var(--text-3); text-align: center; padding: var(--sp-4); }
.comment-item { display: flex; gap: 10px; }
.comment-avatar {
  width: 28px; height: 28px; border-radius: var(--r-full);
  background: var(--surface-3); display: flex; align-items: center;
  justify-content: center; font-size: .7rem; font-weight: 700;
  color: var(--text-3); flex-shrink: 0; margin-top: 2px;
}
.comment-author { font-size: .8rem; font-weight: 600; color: var(--text-2); }
.comment-text { font-size: .85rem; color: var(--text-1); line-height: 1.5; margin: 4px 0; }
.comment-timestamp { font-size: .7rem; color: var(--text-3); }

@media (max-width: 768px) {
  .community-page { padding: var(--sp-4); }
  .create-post-card { padding: 14px; }
}
""")

# ── AutomationPage.css ─────────────────────────────────────────────────────────
open(os.path.join(d, 'AutomationPage.css'), 'w', encoding='utf-8').write("""/* AutomationPage */
.automation-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.automation-container { max-width: 900px; margin: 0 auto; }
.automation-header { margin-bottom: var(--sp-8); }
.automation-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.automation-header .subtitle { color: var(--text-2); font-size: .9rem; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }

/* Stats bar */
.stats-bar {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px,1fr));
  gap: 14px; margin-bottom: var(--sp-8);
}
.stat-item {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-xl); padding: 20px; text-align: center;
}

/* Create automation section */
.create-automation {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px; margin-bottom: var(--sp-6);
}
.create-automation h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-6); }
.automation-templates {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px;
}
.template-card {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-xl); padding: 20px;
  cursor: pointer; transition: all var(--t-base);
  display: flex; flex-direction: column; gap: 8px;
}
.template-card:hover { border-color: var(--violet); box-shadow: var(--shadow-violet); transform: translateY(-2px); }
.template-icon { font-size: 2rem; }
.template-card h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); }
.template-card p { font-size: .8rem; color: var(--text-2); line-height: 1.4; flex: 1; }

/* Active automations */
.active-automations {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 28px;
}
.active-automations h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-5); }
.automation-item {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 16px 0; border-bottom: 1px solid var(--border);
}
.automation-item:last-child { border-bottom: none; padding-bottom: 0; }
.automation-info { flex: 1; }
.automation-info h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.automation-type { font-size: .78rem; color: var(--text-3); }
.automation-status { min-width: 130px; }
.status-badge {
  display: inline-block; padding: 4px 12px;
  border-radius: var(--r-full); font-size: .75rem; font-weight: 700;
}
.status-badge.active  { background: rgba(16,185,129,.15); color: var(--green); }
.status-badge.paused  { background: rgba(245,158,11,.15); color: var(--amber); }
.next-run { font-size: .75rem; color: var(--text-3); margin-top: 6px; }
.automation-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

@media (max-width: 768px) {
  .automation-page { padding: var(--sp-4); }
  .automation-item { flex-direction: column; }
  .automation-templates { grid-template-columns: 1fr 1fr; }
}
""")

print('NodePage, CommunityPage, AutomationPage done')
