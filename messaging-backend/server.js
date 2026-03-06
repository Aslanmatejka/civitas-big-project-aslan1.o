require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Decentralized route modules
const storageRoutes    = require('./routes/storage');
const profileRoutes    = require('./routes/profile');
const identityRoutes   = require('./routes/identity');
const governanceRoutes = require('./routes/governance');
const walletRoutes     = require('./routes/wallet');
const contactsRoutes   = require('./routes/contacts');
const groupsRoutes     = require('./routes/groups');
const statusRoutes     = require('./routes/status');
const authRoutes       = require('./routes/auth');
const queueRoutes      = require('./routes/queue');
const appStoreRoutes   = require('./routes/appstore');
const dataVaultRoutes  = require('./routes/dataVault');
const mobileMoneyRoutes  = require('./routes/mobileMoney');
const communityRoutes    = require('./routes/community');
const messagesRoutes     = require('./routes/messages');
const analyticsRoutes    = require('./routes/analytics');
const marketplaceRoutes  = require('./routes/marketplace');
const dashboardRoutes    = require('./routes/dashboard');
const aiRoutes           = require('./routes/ai');
const automationRoutes   = require('./routes/automation');
const nodeRoutes         = require('./routes/node');

// IPFS service (disabled-friendly)
const ipfsService = require('./services/ipfsService');

const { Server } = require('socket.io');
const messageHandler = require('./sockets/messageHandler');
const callHandler    = require('./sockets/callHandler');
const store          = require('./services/store');

// Auth middleware
const { optionalAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3002',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Auto-save store after mutating requests (POST/PUT/PATCH/DELETE)
app.use(store.autoSave());

// Attach wallet address from headers when present (non-blocking)
app.use(optionalAuth);

// ─── IPFS init (non-blocking) ──────────────────────────────────────────────────
ipfsService.initialize()
  .then(success => {
    if (success) {
      console.log(`✅ IPFS initialized in ${ipfsService.getStatus().mode} mode`);
    } else {
      console.warn('⚠️  IPFS disabled — using local file fallback for uploads');
    }
  })
  .catch(err => console.warn('⚠️  IPFS init error:', err.message));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/storage',     storageRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/identity',    identityRoutes);
app.use('/api/governance',  governanceRoutes);
app.use('/api/wallet',      walletRoutes);
app.use('/api/contacts',    contactsRoutes);
app.use('/api/groups',      groupsRoutes);
app.use('/api/status',      statusRoutes);
app.use('/api/auth',        authRoutes);
app.use('/api/queue',       queueRoutes);
app.use('/api/appstore',    appStoreRoutes);
app.use('/api/datavault',   dataVaultRoutes);
app.use('/api/mobile-money', mobileMoneyRoutes);
app.use('/api/messages',    messagesRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/dashboard',   dashboardRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/automation',  automationRoutes);
app.use('/api/node',        nodeRoutes);

// Community – in-memory with ledger-verified content
app.use('/api/community', communityRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({
    status: 'OK',
    architecture: 'decentralized',
    messaging: 'XMTP',
    storage: 'IPFS',
    identity: 'DID / on-chain',
    database: 'none',
    timestamp: new Date().toISOString()
  });
});
app.get('/health', (_, res) => res.redirect('/api/health'));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3002',
    credentials: true
  }
});

io.on('connection', (socket) => {
  const walletAddress = socket.handshake.auth?.walletAddress
    || socket.handshake.query?.walletAddress;

  if (!walletAddress) {
    socket.disconnect(true);
    return;
  }

  socket.walletAddress = walletAddress.toLowerCase();
  socket.join(socket.walletAddress);
  store.setOnline(socket.walletAddress);
  console.log(`🔌 Connected: ${socket.walletAddress}`);

  // Wire handlers
  messageHandler(io, socket);
  callHandler(io, socket);

  socket.on('disconnect', () => {
    store.setOffline(socket.walletAddress);
    console.log(`❌ Disconnected: ${socket.walletAddress}`);
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   CIVITAS Decentralized Backend          ║
  ╠══════════════════════════════════════════╣
  ║  🚀 Port     : ${PORT}                      ║
  ║  💬 Messaging : XMTP (E2E encrypted)     ║
  ║  🗄️  Storage   : IPFS                    ║
  ║  🪪 Identity  : DID Registry (on-chain)  ║
  ║  🏛️  Governance: Smart Contracts         ║
  ║  🔌 Sockets   : Socket.io (real-time)    ║
  ║  ❌ MongoDB   : REMOVED                  ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
