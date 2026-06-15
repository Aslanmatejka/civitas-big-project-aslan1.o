import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

open(os.path.join(d, 'MessagingPage.css'), 'w', encoding='utf-8').write("""/* MessagingPage */
.messaging-page { height: calc(100vh - 60px); display: flex; overflow: hidden; animation: fadeIn 0.35s ease both; }
.messaging-container { display: flex; width: 100%; height: 100%; }
.not-connected { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: var(--sp-8); color: var(--text-2); text-align: center; }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }

/* ── Left panel (contacts) ─────────────────────────────────────────── */
.contacts-panel {
  width: 300px; flex-shrink: 0; display: flex; flex-direction: column;
  border-right: 1px solid var(--border); background: var(--bg-2);
}
.panel-header {
  padding: 16px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
}
.panel-header h2 { font-size: 1rem; font-weight: 700; color: var(--text-1); }
.header-actions { display: flex; gap: 4px; }
.icon-btn {
  width: 32px; height: 32px; border-radius: var(--r-full);
  background: none; border: none; color: var(--text-2);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 1rem; transition: all var(--t-fast);
}
.icon-btn:hover { background: var(--surface-2); color: var(--text-1); }
.search-bar { padding: 10px 16px; flex-shrink: 0; }
.search-bar input {
  width: 100%; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-full); padding: 8px 14px;
  color: var(--text-1); font-size: .85rem; box-sizing: border-box;
}
.search-bar input:focus { outline: none; border-color: var(--violet); }

/* Sections */
.contacts-section, .groups-section, .my-status-section { margin-bottom: 4px; }
.section-header {
  padding: 8px 16px; font-size: .7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em; color: var(--text-3);
}
.contacts-list { overflow-y: auto; flex: 1; }

/* Contact item */
.contact-info {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; cursor: pointer; transition: background var(--t-fast);
}
.contact-info:hover { background: var(--surface-2); }
.contact-info.active { background: var(--violet-dim); }
.user-avatar, .member-avatar, .status-user-avatar {
  width: 38px; height: 38px; border-radius: var(--r-full);
  background: var(--grad-primary); display: flex; align-items: center;
  justify-content: center; font-size: .85rem; font-weight: 700;
  color: #fff; flex-shrink: 0; position: relative;
}
.online-indicator {
  position: absolute; bottom: 1px; right: 1px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--green); border: 2px solid var(--bg-2);
}
.contact-details { flex: 1; min-width: 0; }
.contact-header { display: flex; justify-content: space-between; align-items: center; }
.contact-header span { font-size: .875rem; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.contact-time { font-size: .72rem; color: var(--text-3); flex-shrink: 0; }
.contact-last-message { font-size: .78rem; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.contact-status { display: flex; align-items: center; gap: 6px; }
.unread-badge {
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: var(--r-full); background: var(--violet);
  color: #fff; font-size: .65rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}

/* ── Chat panel (right) ────────────────────────────────────────────── */
.chat-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }

/* Chat header */
.chat-header {
  padding: 12px 20px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 12px; flex-shrink: 0;
  background: var(--bg-2);
}
.contact-info-header { flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; }
.contact-info-header span { font-size: .9rem; font-weight: 600; color: var(--text-1); }
.chat-actions { display: flex; gap: 4px; }

/* Messages area */
.messages-area {
  flex: 1; overflow-y: auto; padding: 20px;
  display: flex; flex-direction: column; gap: 8px;
}
.messages-area::-webkit-scrollbar { width: 6px; }
.messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* Message bubbles */
.message { display: flex; gap: 8px; max-width: 75%; }
.message.outgoing { align-self: flex-end; flex-direction: row-reverse; }
.message.incoming { align-self: flex-start; }
.message-content {
  padding: 10px 14px; border-radius: var(--r-xl);
  font-size: .9rem; line-height: 1.5; color: var(--text-1);
  position: relative;
}
.message.incoming .message-content { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-sm) var(--r-xl) var(--r-xl) var(--r-xl); }
.message.outgoing .message-content { background: var(--grad-primary); color: #fff; border-radius: var(--r-xl) var(--r-sm) var(--r-xl) var(--r-xl); }
.message-time { font-size: .7rem; opacity: .6; margin-top: 4px; text-align: right; }
.message-footer { display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 4px; }
.edited-indicator { font-size: .68rem; opacity: .6; }
.star-icon { font-size: .75rem; }
.message-reactions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.reaction { display: flex; align-items: center; gap: 3px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-full); padding: 2px 8px; font-size: .8rem; cursor: pointer; transition: background var(--t-fast); }
.reaction:hover { background: var(--violet-dim); border-color: var(--violet); }
.reply-indicator { display: flex; gap: 6px; border-left: 2px solid var(--violet); padding-left: 8px; margin-bottom: 6px; }
.reply-content { font-size: .78rem; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Media, file, voice messages */
.message-media img { max-width: 220px; border-radius: var(--r-lg); }
.image-placeholder { width: 220px; height: 140px; background: var(--surface-3); border-radius: var(--r-lg); display: flex; align-items: center; justify-content: center; font-size: 2rem; }
.message-file { display: flex; align-items: center; gap: 10px; }
.file-icon { font-size: 1.5rem; }
.file-preview { font-size: .85rem; color: var(--text-1); }
.message-voice { display: flex; align-items: center; gap: 10px; }
.voice-icon { font-size: 1.2rem; }
.voice-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; }
.voice-waveform { display: flex; align-items: center; gap: 2px; height: 24px; }
.voice-waveform span { width: 3px; background: var(--violet); border-radius: 2px; animation: pulse-glow 1.2s ease infinite; }
.voice-duration { font-size: .78rem; color: var(--text-2); }

/* Typing indicator */
.typing-indicator { padding: 8px 14px; }
.typing-dots { display: flex; gap: 4px; align-items: center; }
.typing-dots span { width: 6px; height: 6px; background: var(--text-3); border-radius: 50%; animation: pulse-glow 1s ease infinite; }
.typing-dots span:nth-child(2) { animation-delay: .15s; }
.typing-dots span:nth-child(3) { animation-delay: .3s; }

/* Emoji picker */
.emoji-picker { position: absolute; bottom: 60px; right: 0; background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 12px; display: flex; flex-wrap: wrap; gap: 6px; z-index: 100; box-shadow: var(--shadow-xl); }
.emoji-option { font-size: 1.3rem; cursor: pointer; padding: 4px; border-radius: var(--r-md); transition: background var(--t-fast); }
.emoji-option:hover { background: var(--surface-2); }
.emoji-avatar-picker { position: absolute; bottom: 40px; left: 0; background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); padding: 10px; display: flex; flex-wrap: wrap; gap: 4px; z-index: 100; }
.emoji-options { display: flex; gap: 4px; }

/* Context menu */
.context-menu {
  position: fixed; background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-xl); padding: 4px; z-index: 200; min-width: 140px;
  box-shadow: var(--shadow-xl);
}
.context-menu button {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 14px; background: none; border: none; border-radius: var(--r-md);
  color: var(--text-1); font-size: .85rem; cursor: pointer; text-align: left;
  transition: background var(--t-fast);
}
.context-menu button:hover { background: var(--surface-2); }
.context-menu button.delete { color: var(--red); }

/* Edit message */
.edit-content { width: 100%; background: transparent; border: none; color: var(--text-1); font-size: .9rem; resize: none; outline: none; }
.edit-preview { font-size: .8rem; color: var(--text-2); padding: 6px; background: var(--surface-3); border-radius: var(--r-md); margin-bottom: 6px; }
.reply-preview { padding: 8px; background: var(--surface-2); border-left: 3px solid var(--violet); border-radius: 0 var(--r-md) var(--r-md) 0; margin-bottom: 8px; font-size: .8rem; color: var(--text-2); }

/* Input area */
.message-input {
  display: flex; align-items: flex-end; gap: 10px;
  padding: 14px 16px; border-top: 1px solid var(--border); flex-shrink: 0;
  background: var(--bg-2); position: relative;
}
.message-input textarea {
  flex: 1; background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 10px 14px;
  color: var(--text-1); font-family: var(--font-sans); font-size: .9rem;
  resize: none; max-height: 100px; transition: border-color var(--t-base);
}
.message-input textarea:focus { outline: none; border-color: var(--violet); }
.char-count { font-size: .7rem; color: var(--text-3); }
.helper-text { font-size: .72rem; color: var(--text-3); position: absolute; bottom: 4px; left: 20px; }

/* Encryption note */
.encryption-note { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px; font-size: .72rem; color: var(--text-3); border-top: 1px solid var(--border); flex-shrink: 0; }

/* Empty state */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-3); text-align: center; gap: 12px; }
.empty-state p { font-size: .9rem; }

/* ── Call overlays ─────────────────────────────────────────────────── */
.call-overlay, .incoming-call {
  position: fixed; inset: 0; background: rgba(0,0,0,.85);
  backdrop-filter: blur(8px); z-index: 500;
  display: flex; align-items: center; justify-content: center;
}
.call-interface, .voice-call-container, .video-call-container {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 40px; text-align: center;
  min-width: 320px; display: flex; flex-direction: column; gap: 20px;
}
.call-avatar, .call-avatar-large, .video-avatar {
  width: 80px; height: 80px; border-radius: var(--r-full);
  background: var(--grad-primary); display: flex; align-items: center;
  justify-content: center; font-size: 2rem; font-weight: 700; color: #fff;
  margin: 0 auto;
}
.call-avatar-large { width: 100px; height: 100px; font-size: 2.5rem; }
.call-info h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-1); margin-bottom: 4px; }
.call-status-text, .call-type-text { font-size: .85rem; color: var(--text-3); }
.call-duration, .voice-duration { font-size: 1rem; font-weight: 600; color: var(--violet-light); }
.call-status { font-size: .85rem; color: var(--text-2); }
.calling-animation, .incoming-animation { animation: pulse-glow 1.5s ease infinite; }
.call-controls { display: flex; gap: 14px; justify-content: center; }
.control-btn {
  width: 52px; height: 52px; border-radius: var(--r-full); border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; cursor: pointer; transition: all var(--t-fast);
}
.control-btn:hover { transform: scale(1.1); }
.end-call-btn { background: var(--red); color: #fff; }
.end-call-btn:hover { background: #dc2626; }
.answer-btn { background: var(--green); color: #fff; }
.answer-btn:hover { background: #059669; }
.reject-btn { background: var(--red); color: #fff; }
.reject-btn:hover { background: #dc2626; }
.incoming-call-actions { display: flex; gap: 20px; justify-content: center; }

/* Video */
.local-video, .remote-video { background: var(--surface-2); border-radius: var(--r-xl); overflow: hidden; }
.local-video { width: 140px; height: 105px; }
.remote-video { width: 100%; aspect-ratio: 16/9; }
.video-placeholder, .video-placeholder-small { display: flex; align-items: center; justify-content: center; font-size: 3rem; background: var(--surface-3); }

/* ── Modals ────────────────────────────────────────────────────────── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.modal-header h3 { font-size: 1rem; font-weight: 700; color: var(--text-1); }
.modal-close { background: none; border: none; color: var(--text-2); cursor: pointer; font-size: 1rem; }
.modal-close:hover { color: var(--text-1); }
.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }

/* Group setup */
.group-setup-section { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--r-2xl); }
.group-name-section, .group-icon-section, .group-members-section { padding: 16px; border-bottom: 1px solid var(--border); }
.group-icon-preview { font-size: 3rem; text-align: center; }
.group-icon-picker, .icon-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.icon-options button { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 6px; font-size: 1.2rem; cursor: pointer; }
.icon-options button:hover { border-color: var(--violet); }
.members-list { display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
.member-checkbox { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--r-lg); cursor: pointer; transition: background var(--t-fast); }
.member-checkbox:hover { background: var(--surface-2); }
.member-info span { font-size: .875rem; color: var(--text-1); }
.group-actions { display: flex; gap: 10px; padding: 16px; }

/* Profile panel */
.user-profile-section { display: flex; flex-direction: column; align-items: center; padding: 24px; gap: 12px; }
.profile-pic-large { width: 80px; height: 80px; border-radius: var(--r-full); background: var(--grad-primary); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: #fff; }
.profile-pic-section { text-align: center; }
.profile-pic-actions { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
.profile-info-section { width: 100%; padding: 0 16px; }
.profile-field { padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.profile-field label { font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--text-3); }
.profile-field span { font-size: .875rem; color: var(--text-1); }
.profile-actions { display: flex; gap: 8px; padding: 16px; }

/* Status viewer */
.status-viewer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.95); z-index: 400; display: flex; flex-direction: column; }
.status-viewer { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.status-header { display: flex; align-items: center; gap: 12px; padding: 16px; width: 100%; }
.status-progress { flex: 1; height: 3px; background: rgba(255,255,255,.3); border-radius: 2px; }
.status-progress-fill { height: 100%; background: #fff; border-radius: 2px; }
.status-close { background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; }
.status-avatar-wrapper { position: relative; }
.status-avatar { width: 36px; height: 36px; border-radius: var(--r-full); background: var(--grad-primary); display: flex; align-items: center; justify-content: center; font-size: .85rem; font-weight: 700; color: #fff; border: 2px solid var(--violet); }
.status-user-info span { font-size: .875rem; font-weight: 600; color: #fff; display: block; }
.status-time { font-size: .72rem; color: rgba(255,255,255,.6); }
.status-content { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
.status-text { font-size: 1.6rem; color: #fff; text-align: center; padding: var(--sp-8); }
.status-actions { display: flex; gap: 10px; padding: 16px; }
.status-input { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); border-radius: var(--r-full); padding: 10px 16px; color: #fff; font-size: .9rem; flex: 1; }
.status-input::placeholder { color: rgba(255,255,255,.5); }
.status-info { text-align: center; }

@media (max-width: 768px) {
  .contacts-panel { width: 100%; position: absolute; z-index: 10; height: 100%; transition: transform var(--t-base); }
  .contacts-panel.hidden { transform: translateX(-100%); }
  .chat-panel { width: 100%; }
}
""")

print('MessagingPage.css done')
