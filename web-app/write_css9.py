import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── GovernancePage.css ────────────────────────────────────────────────────────
open(os.path.join(d, 'GovernancePage.css'), 'w', encoding='utf-8').write("""/* GovernancePage */
.governance-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.governance-container { max-width: 900px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }
.not-connected p { margin-bottom: var(--sp-6); }

/* Header */
.governance-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: var(--sp-6); }
.governance-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.governance-header .subtitle { color: var(--text-2); font-size: .9rem; }
.create-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 22px; background: var(--grad-primary); color: #fff;
  border: none; border-radius: var(--r-full); font-size: .875rem;
  font-weight: 600; cursor: pointer; transition: all var(--t-fast); white-space: nowrap;
}
.create-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

/* Info banner */
.info-banner {
  display: flex; align-items: flex-start; gap: 14px;
  background: rgba(139,92,246,.08); border: 1px solid rgba(139,92,246,.2);
  border-radius: var(--r-xl); padding: 14px 18px; margin-bottom: var(--sp-6);
  font-size: .875rem; color: var(--text-2); line-height: 1.5;
}
.info-icon { font-size: 1.3rem; flex-shrink: 0; }
.info-content {}

/* Voting power card */
.voting-power-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 24px; margin-bottom: var(--sp-6);
}
.voting-power-card h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.power-display { display: flex; align-items: center; gap: 24px; margin-bottom: var(--sp-4); }
.power-number { font-size: 2.5rem; font-weight: 900; color: var(--violet-light); line-height: 1; }
.power-info {}
.power-text { font-size: .8rem; color: var(--text-3); }
.power-value { font-size: .95rem; font-weight: 600; color: var(--text-1); margin-top: 2px; }
.power-breakdown { display: flex; gap: 10px; flex-wrap: wrap; }
.power-item { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 12px 16px; flex: 1; min-width: 120px; }
.power-label { font-size: .72rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
.voting-stats { display: flex; gap: 20px; flex-wrap: wrap; padding-top: var(--sp-4); border-top: 1px solid var(--border); }
.stat { text-align: center; }
.stat-value { font-size: 1.2rem; font-weight: 800; color: var(--text-1); }
.stat-label { font-size: .72rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; }

/* Proposals section */
.proposals-section { margin-bottom: var(--sp-6); }
.proposals-section h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-5); }
.loading-proposals { text-align: center; padding: var(--sp-8); color: var(--text-3); }
.spinner {
  width: 36px; height: 36px; border: 3px solid var(--border);
  border-top-color: var(--violet); border-radius: 50%;
  animation: spin .8s linear infinite; margin: 0 auto var(--sp-3);
}
.no-proposals { text-align: center; padding: var(--sp-8); color: var(--text-3); font-size: .9rem; }

/* Proposal card */
.proposal-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 24px; margin-bottom: var(--sp-4);
  transition: all var(--t-base);
}
.proposal-card:hover { border-color: var(--border-accent); }
.proposal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
.proposal-id { font-size: .72rem; font-family: var(--font-mono); color: var(--text-3); }
.proposal-title { font-size: 1.05rem; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.proposal-description { font-size: .875rem; color: var(--text-2); line-height: 1.5; margin-bottom: var(--sp-4); }
.proposal-meta { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: var(--sp-4); }
.proposal-proposer { font-size: .78rem; color: var(--text-3); font-family: var(--font-mono); }
.proposal-time { font-size: .78rem; color: var(--text-3); }

/* Vote progress */
.vote-progress { margin-bottom: var(--sp-4); }
.progress-bar-container { height: 8px; background: var(--surface-3); border-radius: var(--r-full); overflow: hidden; display: flex; }

/* Vote actions */
.vote-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* Completed section */
.completed-section { margin-bottom: var(--sp-6); }
.completed-section h2 { font-size: 1.05rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-5); }
.completed-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px; margin-bottom: var(--sp-3);
  opacity: .8; transition: all var(--t-base);
}
.completed-card:hover { opacity: 1; border-color: var(--border-accent); }
.completed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.completed-stats { display: flex; gap: 12px; margin-top: 8px; font-size: .8rem; color: var(--text-3); }
.completed-date { font-size: .75rem; color: var(--text-3); }

/* CTA to create */
.create-proposal-cta {
  background: var(--surface-1); border: 1px dashed var(--border-accent);
  border-radius: var(--r-2xl); padding: 32px; text-align: center;
  transition: all var(--t-base);
}
.create-proposal-cta:hover { background: var(--violet-dim); }
.create-proposal-cta h3 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.create-proposal-cta p { font-size: .875rem; color: var(--text-2); margin-bottom: var(--sp-5); }

@media (max-width: 768px) {
  .governance-page { padding: var(--sp-4); }
  .governance-header { flex-direction: column; }
  .vote-actions { flex-direction: column; }
  .power-breakdown { flex-direction: column; }
}
""")

# ── AIPage.css ────────────────────────────────────────────────────────────────
open(os.path.join(d, 'AIPage.css'), 'w', encoding='utf-8').write("""/* AIPage */
.ai-page { height: calc(100vh - 80px); display: flex; flex-direction: column; overflow: hidden; animation: fadeIn 0.35s ease both; }
.ai-container { display: flex; flex-direction: column; height: 100%; max-width: 800px; margin: 0 auto; width: 100%; padding: var(--sp-6); box-sizing: border-box; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }

/* Header */
.ai-header { margin-bottom: var(--sp-5); flex-shrink: 0; }
.ai-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.ai-header .subtitle { color: var(--text-2); font-size: .9rem; }

/* Feature chips */
.ai-features { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: var(--sp-5); flex-shrink: 0; }
.feature-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; background: var(--violet-dim);
  border: 1px solid rgba(139,92,246,.3); border-radius: var(--r-full);
  color: var(--violet-light); font-size: .78rem; font-weight: 500;
}

/* Chat container */
.chat-container {
  flex: 1; display: flex; flex-direction: column;
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); overflow: hidden; min-height: 0;
}

/* Messages area */
.messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.messages::-webkit-scrollbar { width: 6px; }
.messages::-webkit-scrollbar-track { background: transparent; }
.messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Message bubbles */
.message { display: flex; align-items: flex-start; gap: 10px; }
.message.user { flex-direction: row-reverse; }
.message-avatar {
  width: 32px; height: 32px; border-radius: var(--r-full); flex-shrink: 0;
  background: var(--surface-3); display: flex; align-items: center;
  justify-content: center; font-size: .8rem; font-weight: 700; color: var(--text-2);
}
.message.user .message-avatar { background: var(--grad-primary); color: #fff; }
.message-content {
  max-width: 75%; padding: 12px 16px; border-radius: var(--r-2xl);
  font-size: .9rem; line-height: 1.6; color: var(--text-1);
}
.message.assistant .message-content { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-sm) var(--r-2xl) var(--r-2xl) var(--r-2xl); }
.message.user .message-content { background: var(--grad-primary); color: #fff; border-radius: var(--r-2xl) var(--r-sm) var(--r-2xl) var(--r-2xl); }
.message.thinking .message-content { opacity: .6; }

/* Suggestions */
.suggestions-section { padding: 0 20px 12px; flex-shrink: 0; }
.suggestions-section p { font-size: .75rem; color: var(--text-3); margin-bottom: 8px; }
.suggestions { display: flex; gap: 6px; flex-wrap: wrap; }
.suggestion-btn {
  padding: 6px 14px; border: 1px solid var(--border);
  border-radius: var(--r-full); background: var(--surface-2);
  color: var(--text-2); font-size: .78rem; cursor: pointer;
  transition: all var(--t-fast);
}
.suggestion-btn:hover { border-color: var(--violet); color: var(--violet-light); background: var(--violet-dim); }

/* Input area */
.input-area {
  display: flex; align-items: flex-end; gap: 10px;
  padding: 16px 20px; border-top: 1px solid var(--border); flex-shrink: 0;
}
.input-area textarea {
  flex: 1; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 10px 14px;
  color: var(--text-1); font-family: var(--font-sans); font-size: .9rem;
  resize: none; max-height: 120px; transition: border-color var(--t-base);
}
.input-area textarea:focus { outline: none; border-color: var(--violet); }
.send-btn {
  width: 40px; height: 40px; border-radius: var(--r-full);
  background: var(--grad-primary); color: #fff; border: none;
  font-size: 1rem; cursor: pointer; flex-shrink: 0;
  transition: all var(--t-fast); display: flex; align-items: center; justify-content: center;
}
.send-btn:hover:not(:disabled) { filter: brightness(1.1); transform: scale(1.05); }
.send-btn:disabled { opacity: .5; cursor: not-allowed; }

@media (max-width: 768px) {
  .ai-page { height: auto; }
  .ai-container { padding: var(--sp-4); }
  .chat-container { height: 500px; }
}
""")

# ── StoragePage.css ────────────────────────────────────────────────────────────
open(os.path.join(d, 'StoragePage.css'), 'w', encoding='utf-8').write("""/* StoragePage */
.storage-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.storage-container { max-width: 900px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }

/* Header */
.storage-header { margin-bottom: var(--sp-6); }
.storage-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.storage-header .subtitle { color: var(--text-2); font-size: .9rem; }

/* Stats */
.storage-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 14px; margin-bottom: var(--sp-6); }
.stat-card { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 20px; text-align: center; }
.stat-value { font-size: 1.5rem; font-weight: 800; color: var(--violet-light); margin-bottom: 4px; }
.stat-label { font-size: .72rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .06em; }

/* Upload section */
.upload-section {
  background: var(--surface-1); border: 2px dashed var(--border);
  border-radius: var(--r-2xl); padding: 40px; text-align: center;
  margin-bottom: var(--sp-6); transition: all var(--t-base); cursor: pointer;
}
.upload-section:hover, .upload-section.drag-over { border-color: var(--violet); background: var(--violet-dim); }
.upload-section h3 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.upload-section p { font-size: .875rem; color: var(--text-2); margin-bottom: var(--sp-4); }

/* Files section */
.files-section { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 24px; }
.files-section h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.files-list { display: flex; flex-direction: column; gap: 2px; }
.file-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: var(--r-xl); transition: background var(--t-fast); }
.file-item:hover { background: var(--surface-2); }
.file-icon { font-size: 1.4rem; flex-shrink: 0; }
.file-info { flex: 1; }
.file-info h4 { font-size: .875rem; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
.file-meta { display: flex; gap: 12px; font-size: .75rem; color: var(--text-3); }
.file-cid { font-family: var(--font-mono); font-size: .72rem; color: var(--cyan); }
.file-actions { display: flex; gap: 6px; }

@media (max-width: 768px) {
  .storage-page { padding: var(--sp-4); }
  .storage-stats { grid-template-columns: repeat(2,1fr); }
}
""")

print('GovernancePage, AIPage, StoragePage done')
