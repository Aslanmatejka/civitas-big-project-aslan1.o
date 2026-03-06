/**
 * Decentralized In-Memory Store
 *
 * Replaces MongoDB for ephemeral / user-session data.
 * All critical data (profiles, files, credentials) lives on IPFS or on-chain.
 * This store holds only runtime state that would be re-created on reconnect:
 *   - Online presence
 *   - Contacts list (can be rebuilt from XMTP conversation history)
 *   - Groups metadata
 *   - Statuses (24-hour ephemeral)
 *   - Upload metadata cache
 *   - Wallet session cache
 *
 * For production: replace Maps with Redis or a lightweight SQLite for
 * persistence across restarts, but keep IPFS as the source of truth.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// ─── Ensure data directory exists ────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Load persisted data ──────────────────────────────────────────────────────
function loadPersisted() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (_) {}
  return { users: {}, contacts: {}, groups: {}, statuses: [], queue: [], files: {}, messages: {},
           marketplace: { listings: [], orders: [], listingSeq: 1, orderSeq: 1 },
           community: { posts: {}, comments: {}, follows: {}, postLikes: {}, commentLikes: {}, postSeq: 1, commentSeq: 1 },
           mobileMoney: { transactions: {}, walletHistory: {} },
           automations: { items: {}, nextId: 1 },
           nodes: {},
           appstore: { apps: {}, reviews: {} },
           aiConversations: {},
           chatMessages: [] };
}

let persisted = loadPersisted();

// ─── Auto-save every 30 s (safety net) + debounced save after mutations ──────
function savePersisted() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(persisted, null, 2));
  } catch (_) {}
}
let _saveTimer = null;
function debouncedSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(savePersisted, 100);
}
setInterval(savePersisted, 30_000);
process.on('exit', savePersisted);

// ─── Ephemeral (reset on restart) ────────────────────────────────────────────
const onlineUsers = new Map(); // walletAddress → { socketId, lastSeen }

// ─── API ──────────────────────────────────────────────────────────────────────

const store = {
  // ── Users ────────────────────────────────────────────────────────────────────
  getUser(address) {
    return persisted.users[address.toLowerCase()] || null;
  },
  upsertUser(address, data) {
    const addr = address.toLowerCase();
    persisted.users[addr] = { ...persisted.users[addr], ...data, walletAddress: addr, updatedAt: Date.now() };
    debouncedSave();
    return persisted.users[addr];
  },
  searchUsers(query) {
    const q = query.toLowerCase();
    return Object.values(persisted.users).filter(u => {
      const name = (u.name || '').toLowerCase();
      const addr = (u.walletAddress || '').toLowerCase();
      return name.includes(q) || addr.includes(q);
    }).map(u => ({
      walletAddress: u.walletAddress,
      name: u.name || 'Anonymous',
      avatar: u.avatar || '\uD83D\uDC64',
      about: u.about || '',
      isOnline: onlineUsers.has(u.walletAddress)
    }));
  },

  // ── Online presence ──────────────────────────────────────────────────────────
  setOnline(address) { onlineUsers.set(address.toLowerCase(), { lastSeen: Date.now() }); },
  setOffline(address) { onlineUsers.delete(address.toLowerCase()); },
  isOnline(address) { return onlineUsers.has(address.toLowerCase()); },

  // ── Contacts ─────────────────────────────────────────────────────────────────
  getContacts(address) {
    return persisted.contacts[address.toLowerCase()] || [];
  },
  addContact(address, contactAddress, name) {
    const addr = address.toLowerCase();
    const cAddr = contactAddress.toLowerCase();
    if (!persisted.contacts[addr]) persisted.contacts[addr] = [];
    if (!persisted.contacts[addr].find(c => c.walletAddress === cAddr)) {
      persisted.contacts[addr].push({ walletAddress: cAddr, name: name || cAddr, addedAt: Date.now() });
    }
    debouncedSave();
    return persisted.contacts[addr];
  },
  removeContact(address, contactAddress) {
    const addr = address.toLowerCase();
    persisted.contacts[addr] = (persisted.contacts[addr] || [])
      .filter(c => c.walletAddress !== contactAddress.toLowerCase());
    debouncedSave();
    return persisted.contacts[addr];
  },
  blockContact(address, blockAddress) {
    const addr = address.toLowerCase();
    if (!persisted.contacts[addr]) persisted.contacts[addr] = [];
    const existing = persisted.contacts[addr].find(c => c.walletAddress === blockAddress.toLowerCase());
    if (existing) existing.blocked = true;
    debouncedSave();
    return persisted.contacts[addr];
  },

  // ── Groups ───────────────────────────────────────────────────────────────────
  getGroup(groupId) { return persisted.groups[groupId] || null; },
  getGroupsForUser(address) {
    const addr = address.toLowerCase();
    return Object.values(persisted.groups).filter(g => g.members && g.members.includes(addr));
  },
  createGroup(data) {
    const id = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    persisted.groups[id] = { ...data, id, createdAt: Date.now(), updatedAt: Date.now() };
    debouncedSave();
    return persisted.groups[id];
  },
  updateGroup(groupId, data) {
    if (!persisted.groups[groupId]) return null;
    persisted.groups[groupId] = { ...persisted.groups[groupId], ...data, updatedAt: Date.now() };
    debouncedSave();
    return persisted.groups[groupId];
  },
  deleteGroup(groupId) { delete persisted.groups[groupId]; debouncedSave(); },

  // ── Statuses (24-hour ephemeral) ─────────────────────────────────────────────
  getStatuses() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    persisted.statuses = persisted.statuses.filter(s => s.createdAt > cutoff);
    return persisted.statuses;
  },
  addStatus(data) {
    const status = { ...data, id: `st_${Date.now()}`, createdAt: Date.now(), views: [] };
    persisted.statuses.push(status);
    debouncedSave();
    return status;
  },
  viewStatus(statusId, viewerAddress) {
    const s = persisted.statuses.find(x => x.id === statusId);
    if (s && !s.views.includes(viewerAddress)) s.views.push(viewerAddress);
    debouncedSave();
    return s;
  },
  deleteStatus(statusId, ownerAddress) {
    persisted.statuses = persisted.statuses.filter(
      s => !(s.id === statusId && s.userId === ownerAddress)
    );
    debouncedSave();
  },

  // ── File metadata cache ──────────────────────────────────────────────────────
  getFiles(address, folder) {
    const all = Object.values(persisted.files).filter(f => f.walletAddress === address.toLowerCase() && f.status !== 'deleted');
    return folder ? all.filter(f => f.folder === folder) : all;
  },
  getFile(id) { return persisted.files[id] || null; },
  saveFile(data) {
    const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    persisted.files[id] = { ...data, id, createdAt: Date.now(), downloads: 0, status: 'available' };
    debouncedSave();
    return persisted.files[id];
  },
  deleteFile(id) {
    if (persisted.files[id]) persisted.files[id].status = 'deleted';
    debouncedSave();
  },

  // ── Messages ─────────────────────────────────────────────────────────────────
  addMessage(msg) {
    if (!persisted.messages) persisted.messages = {};
    persisted.messages[msg.messageId] = msg;
    debouncedSave();
    return msg;
  },
  getMessage(messageId) {
    return (persisted.messages || {})[messageId] || null;
  },
  getMessages(filter) {
    const all = Object.values(persisted.messages || {});
    if (!filter) return all;
    return all.filter(m => {
      if (filter.sender && m.sender !== filter.sender) return false;
      if (filter.recipient && m.recipient !== filter.recipient) return false;
      if (filter.groupId && m.groupId !== filter.groupId) return false;
      return true;
    });
  },

  // ── Offline message queue ────────────────────────────────────────────────────
  getQueue(address) {
    return persisted.queue.filter(m => m.recipient === address.toLowerCase() && !m.delivered);
  },
  enqueue(message) {
    persisted.queue.push({ ...message, id: `q_${Date.now()}`, enqueuedAt: Date.now(), delivered: false });
    debouncedSave();
  },
  markDelivered(id) {
    const m = persisted.queue.find(x => x.id === id);
    if (m) m.delivered = true;
    debouncedSave();
  },
  clearDelivered() {
    persisted.queue = persisted.queue.filter(m => !m.delivered);
    debouncedSave();
  },

  // ── Generic persisted collection accessor ──────────────────────────────────
  // Routes can do: const mp = store.collection('marketplace');
  // Then mp.listings.push(...), and it auto-persists via deferred save.
  collection(name) {
    if (!persisted[name]) persisted[name] = {};
    return persisted[name];
  },

  // Force an immediate save (useful after batch operations)
  save() { savePersisted(); },

  // Express middleware: auto-save after mutating requests (POST/PUT/PATCH/DELETE)
  // Usage: app.use(store.autoSave());
  autoSave() {
    return (req, res, next) => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        res.on('finish', () => { if (res.statusCode < 400) debouncedSave(); });
      }
      next();
    };
  }
};

module.exports = store;
