import { Client } from '@xmtp/browser-sdk';
import offlineService from './offlineService';

/**
 * XMTP Service — V3 (@xmtp/browser-sdk)
 *
 * XMTP V3 uses the MLS protocol for end-to-end encrypted,
 * wallet-to-wallet messaging stored on the XMTP network.
 */

class XMTPService {
  constructor() {
    this.client = null;
    this.conversations = new Map();
    this.messageListeners = new Map();
    this.walletAddress = null;
    this.signer = null;
    this.isInitialized = false;
    this.allMessagesStream = null;
    this.env = import.meta.env.VITE_XMTP_ENV || 'dev';
  }

  /**
   * Initialize XMTP V3 client with an ethers v6 signer.
   */
  async initialize(signer) {
    if (this.isInitialized && this.client) {
      console.log('✅ XMTP already initialized');
      return this.client;
    }

    try {
      console.log('🔄 Initializing XMTP V3 client...');
      this.signer = signer;
      this.walletAddress = await signer.getAddress();

      // V3 signer — browser-sdk requires getIdentifier() + Uint8Array signature
      const walletAddr = this.walletAddress.toLowerCase();
      const xmtpSigner = {
        // identifierKind 0 = Ethereum address
        getIdentifier: () => ({ identifier: walletAddr, identifierKind: 0 }),
        signMessage: async (message) => {
          const sig = await signer.signMessage(
            message instanceof Uint8Array ? message : message
          );
          // ethers v6 returns '0x...' hex — convert to Uint8Array
          const hex = sig.startsWith('0x') ? sig.slice(2) : sig;
          return Uint8Array.from(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
        }
      };

      // V3: Client.create(accountAddress, options)
      this.client = await Client.create(this.walletAddress, {
        signer: xmtpSigner,
        env: this.env
      });

      this.isInitialized = true;
      console.log('✅ XMTP V3 initialized for:', this.walletAddress);

      // Sync existing conversations
      await this.client.conversations.sync();

      // Stream new incoming messages
      this._startStreamingAll();

      return this.client;
    } catch (error) {
      console.error('❌ XMTP V3 init error:', error);
      if (!navigator.onLine) {
        await offlineService.queueAction('xmtp_init', { timestamp: Date.now() });
      }
      throw error;
    }
  }

  /**
   * Check if a wallet address can receive XMTP V3 messages.
   * V3: client.canMessage([address]) returns Map<string, boolean>
   */
  async canMessage(address) {
    try {
      if (!this.client) throw new Error('XMTP client not initialized');
      const result = await this.client.canMessage([address]);
      if (result instanceof Map) return result.get(address.toLowerCase()) ?? false;
      return Boolean(result);
    } catch (error) {
      console.error('canMessage error:', error);
      return false;
    }
  }

  /**
   * Get or create a V3 DM conversation with a peer.
   * V3: client.conversations.newDm(peerAddress) instead of newConversation()
   */
  async getConversation(peerAddress) {
    try {
      if (!this.client) throw new Error('XMTP client not initialized');
      const key = peerAddress.toLowerCase();
      if (this.conversations.has(key)) return this.conversations.get(key);

      const canMsg = await this.canMessage(peerAddress);
      if (!canMsg) throw new Error(`${peerAddress} is not on XMTP V3 network`);

      const conversation = await this.client.conversations.newDm(peerAddress);
      this.conversations.set(key, conversation);
      return conversation;
    } catch (error) {
      console.error('getConversation error:', error);
      throw error;
    }
  }

  /**
   * List all conversations. V3 API unchanged: client.conversations.list()
   */
  async listConversations() {
    try {
      if (!this.client) throw new Error('XMTP client not initialized');
      const convos = await this.client.conversations.list();
      for (const c of convos) {
        const peer = c.peerAddress ?? c.peerInboxId ?? 'unknown';
        this.conversations.set(peer.toLowerCase(), c);
      }
      return convos;
    } catch (error) {
      console.error('listConversations error:', error);
      return [];
    }
  }

  /**
   * Send a message. V3: conversation.send(text) — no contentType option in basic API.
   */
  async sendMessage(peerAddress, content, contentType = 'text/plain') {
    try {
      if (!this.client) throw new Error('XMTP client not initialized');
      const conv = await this.getConversation(peerAddress);
      // If content is already a string, send as-is; if object, stringify once
      const text = typeof content === 'object' ? JSON.stringify(content) : String(content);

      await conv.send(text);
      console.log('✅ Message sent via XMTP V3');

      return {
        id: `sent-${Date.now()}`,
        content: text,
        sender: this.walletAddress,
        recipient: peerAddress,
        timestamp: new Date(),
        contentType,
        status: 'sent'
      };
    } catch (error) {
      console.error('❌ sendMessage error:', error);
      if (!navigator.onLine) {
        const queued = { peerAddress, content, contentType, timestamp: Date.now(), sender: this.walletAddress };
        await offlineService.queueMessage(queued);
        return { ...queued, status: 'queued', id: `queued-${Date.now()}` };
      }
      throw error;
    }
  }

  /**
   * Get messages from a conversation. V3: conversation.sync() then conversation.messages()
   */
  async getMessages(peerAddress, limit = 50) {
    try {
      if (!this.client) throw new Error('XMTP client not initialized');
      const conv = await this.getConversation(peerAddress);
      await conv.sync();
      const msgs = await conv.messages({ limit });
      return msgs.map(m => this._formatMessage(m, peerAddress));
    } catch (error) {
      console.error('getMessages error:', error);
      if (!navigator.onLine) {
        return (await offlineService.getCachedMessages(peerAddress)) || [];
      }
      return [];
    }
  }

  // ── Streaming (V3: async iterable, not callback-based) ───────────────────────

  async _startStreamingAll() {
    if (!this.client) return;
    try {
      const stream = await this.client.conversations.streamAllMessages();
      this.allMessagesStream = stream;
      (async () => {
        for await (const message of stream) {
          try {
            const peer = message.conversation?.peerAddress ?? message.senderInboxId ?? '';
            const formatted = this._formatMessage(message, peer);
            await offlineService.cacheMessage(formatted).catch(() => {});
            this._notifyListeners(peer.toLowerCase(), formatted);
          } catch { /* skip */ }
        }
      })();
    } catch (err) {
      console.warn('XMTP stream unavailable:', err.message);
    }
  }

  // Keep old name as alias so any legacy callers don't break
  async startStreamingAllMessages() { return this._startStreamingAll(); }

  onMessage(peerAddress, callback) {
    const key = `${peerAddress.toLowerCase()}_callback`;
    if (!this.messageListeners.has(key)) this.messageListeners.set(key, []);
    this.messageListeners.get(key).push(callback);
  }

  /** @deprecated use onMessage */
  notifyMessageListeners(peerAddress, message) {
    this._notifyListeners(peerAddress, message);
  }

  _notifyListeners(peerAddress, message) {
    const key = `${peerAddress.toLowerCase()}_callback`;
    (this.messageListeners.get(key) || []).forEach(cb => cb(message));
  }

  _formatMessage(msg, peerAddress) {
    return {
      id:          msg.id,
      content:     msg.content ?? '',
      sender:      msg.senderAddress ?? msg.senderInboxId ?? 'unknown',
      recipient:   peerAddress,
      timestamp:   msg.sentAt ?? msg.sent ?? new Date(),
      contentType: msg.contentType ?? 'text/plain',
      status:      'delivered'
    };
  }

  // ── File / voice helpers ─────────────────────────────────────────────────────

  async sendFile(peerAddress, file, uploadToIPFS) {
    try {
      const { cid, url } = await uploadToIPFS(file);
      return this.sendMessage(
        peerAddress,
        { type: 'file', name: file.name, size: file.size, mimeType: file.type, cid, url, timestamp: Date.now() },
        'application/json'
      );
    } catch (error) {
      console.error('sendFile error:', error);
      throw error;
    }
  }

  async sendVoiceMessage(peerAddress, audioBlob, duration, uploadToIPFS) {
    try {
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const { cid, url } = await uploadToIPFS(audioFile);
      return this.sendMessage(
        peerAddress,
        { type: 'voice', duration, cid, url, timestamp: Date.now() },
        'application/json'
      );
    } catch (error) {
      console.error('sendVoiceMessage error:', error);
      throw error;
    }
  }

  // ── Accessors ────────────────────────────────────────────────────────────────

  getAddress() { return this.walletAddress; }
  isReady()    { return this.isInitialized && this.client !== null; }

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  async disconnect() {
    try {
      // Close async iterable stream if possible
      if (this.allMessagesStream?.return) {
        await this.allMessagesStream.return().catch(() => {});
      }
    } catch { /* ignore */ }

    this.conversations.clear();
    this.messageListeners.clear();
    this.client = null;
    this.signer = null;
    this.walletAddress = null;
    this.isInitialized = false;
    console.log('✅ XMTP disconnected');
  }

  async syncQueuedMessages() {
    if (!this.isReady()) return;
    try {
      const queued = await offlineService.getQueuedMessages();
      for (const msg of queued) {
        try {
          await this.sendMessage(msg.peerAddress, msg.content, msg.contentType);
          await offlineService.removeQueuedMessage(msg.id);
        } catch { /* leave in queue */ }
      }
    } catch (error) {
      console.error('syncQueuedMessages error:', error);
    }
  }
}

// Export singleton instance
export const xmtpService = new XMTPService();
export default xmtpService;
