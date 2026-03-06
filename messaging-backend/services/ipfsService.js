/**
 * IPFS Service - Backend decentralized storage integration
 * Implements real IPFS file storage for the CIVITAS platform
 * 
 * Requirements:
 * - IPFS node running locally (ipfs daemon) or use Infura/Pinata
 * - npm install ipfs-http-client
 */

// ipfs-http-client is ESM-only (v56+); loaded dynamically only when IPFS is enabled
let create;
const crypto = require('crypto');
const fs = require('fs').promises;

// IPFS Configuration
const IPFS_CONFIG = {
  // Local IPFS node (default)
  local: {
    host: process.env.IPFS_HOST || 'localhost',
    port: process.env.IPFS_PORT || '5001',
    protocol: 'http'
  },
  // Infura IPFS (fallback for development)
  infura: {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: process.env.INFURA_PROJECT_ID 
        ? `Basic ${Buffer.from(process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_PROJECT_SECRET).toString('base64')}`
        : undefined
    }
  },
  // Pinata (alternative)
  pinata: {
    host: 'api.pinata.cloud',
    port: 443,
    protocol: 'https',
    headers: {
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_KEY
    }
  }
};

class IPFSService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.mode = process.env.IPFS_MODE || 'local'; // 'local', 'infura', 'pinata', 'disabled'
  }

  /**
   * Initialize IPFS client
   */
  async initialize() {
    if (this.mode === 'disabled') {
      console.warn('⚠️  IPFS is disabled. Using local storage fallback.');
      this.initialized = false;
      return false;
    }

    // Dynamically import ESM-only ipfs-http-client only when IPFS is enabled
    if (!create) {
      const mod = await import('ipfs-http-client');
      create = mod.create;
    }

    try {
      const config = IPFS_CONFIG[this.mode];
      
      if (!config) {
        throw new Error(`Invalid IPFS mode: ${this.mode}`);
      }

      // Remove undefined headers
      if (config.headers) {
        Object.keys(config.headers).forEach(key => {
          if (config.headers[key] === undefined) {
            delete config.headers[key];
          }
        });
      }

      this.client = create(config);

      // Test connection
      const version = await this.client.version();
      console.log(`✅ IPFS connected (${this.mode}):`, version.version);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ IPFS initialization failed:', error.message);
      console.warn('⚠️  Falling back to local storage mode.');
      this.initialized = false;
      return false;
    }
  }

  /**
   * Upload file to IPFS
   * @param {Buffer|string} fileData - File data as Buffer or base64 string
   * @param {object} options - Upload options {filename, mimeType, encrypt}
   * @returns {Promise<object>} {cid, size, hash, encrypted}
   */
  async uploadFile(fileData, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      // Fallback: return mock CID for local storage mode
      return this.generateMockCID(fileData, options);
    }

    try {
      const { filename, mimeType, encrypt = false } = options;
      
      // Convert string to Buffer if needed
      let buffer = Buffer.isBuffer(fileData) 
        ? fileData 
        : Buffer.from(fileData, 'base64');

      // Encrypt if requested
      let encryptionKey = null;
      if (encrypt) {
        const encrypted = this.encryptBuffer(buffer);
        buffer = encrypted.data;
        encryptionKey = encrypted.key;
      }

      // Calculate hash
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Add to IPFS
      const result = await this.client.add(buffer, {
        pin: true, // Pin by default for persistence
        wrapWithDirectory: false,
        progress: (bytes) => {
          console.log(`📤 IPFS upload progress: ${bytes} bytes`);
        }
      });

      const cid = result.cid.toString();

      console.log(`✅ File uploaded to IPFS: ${cid}`);

      return {
        cid,
        hash,
        size: buffer.length,
        encrypted: encrypt,
        encryptionKey: encrypt ? encryptionKey.toString('hex') : null,
        url: this.getGatewayUrl(cid)
      };
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Download file from IPFS
   * @param {string} cid - IPFS Content Identifier
   * @param {object} options - Download options {decrypt, encryptionKey}
   * @returns {Promise<Buffer>} File data
   */
  async downloadFile(cid, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      throw new Error('IPFS not available. Cannot download file.');
    }

    try {
      const { decrypt = false, encryptionKey } = options;

      // Get file from IPFS
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      
      let buffer = Buffer.concat(chunks);

      // Decrypt if needed
      if (decrypt && encryptionKey) {
        buffer = this.decryptBuffer(buffer, Buffer.from(encryptionKey, 'hex'));
      }

      console.log(`✅ File downloaded from IPFS: ${cid}`);

      return buffer;
    } catch (error) {
      console.error('❌ IPFS download failed:', error);
      throw new Error(`IPFS download failed: ${error.message}`);
    }
  }

  /**
   * Pin file to ensure persistence
   * @param {string} cid - Content Identifier
   */
  async pinFile(cid) {
    if (!this.initialized) return false;

    try {
      await this.client.pin.add(cid);
      console.log(`📌 Pinned: ${cid}`);
      return true;
    } catch (error) {
      console.error('❌ Pin failed:', error);
      return false;
    }
  }

  /**
   * Unpin file
   * @param {string} cid - Content Identifier
   */
  async unpinFile(cid) {
    if (!this.initialized) return false;

    try {
      await this.client.pin.rm(cid);
      console.log(`📍 Unpinned: ${cid}`);
      return true;
    } catch (error) {
      console.error('❌ Unpin failed:', error);
      return false;
    }
  }

  /**
   * Check if file is pinned
   * @param {string} cid - Content Identifier
   */
  async isPinned(cid) {
    if (!this.initialized) return false;

    try {
      for await (const { cid: pinnedCid } of this.client.pin.ls({ paths: cid })) {
        if (pinnedCid.toString() === cid) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt buffer using AES-256-GCM
   * @param {Buffer} buffer - Data to encrypt
   * @returns {object} {data: Buffer, key: Buffer, iv: Buffer}
   */
  encryptBuffer(buffer) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(16);  // 128-bit IV
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + encrypted data
    const combined = Buffer.concat([iv, authTag, encrypted]);

    return { data: combined, key };
  }

  /**
   * Decrypt buffer using AES-256-GCM
   * @param {Buffer} combined - Encrypted data (iv + authTag + data)
   * @param {Buffer} key - Encryption key
   * @returns {Buffer} Decrypted data
   */
  decryptBuffer(combined, key) {
    const algorithm = 'aes-256-gcm';
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(16, 32);
    const encrypted = combined.slice(32);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Get gateway URL for CID
   * @param {string} cid - Content Identifier
   * @returns {string} Gateway URL
   */
  getGatewayUrl(cid) {
    const gateways = {
      local: `http://localhost:8080/ipfs/${cid}`,
      infura: `https://ipfs.infura.io/ipfs/${cid}`,
      pinata: `https://gateway.pinata.cloud/ipfs/${cid}`
    };

    return gateways[this.mode] || `https://ipfs.io/ipfs/${cid}`;
  }

  /**
   * Generate mock CID for fallback mode (local storage)
   * This maintains compatibility when IPFS is unavailable
   */
  generateMockCID(fileData, options) {
    const buffer = Buffer.isBuffer(fileData) 
      ? fileData 
      : Buffer.from(fileData, 'base64');
      
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Generate pseudo-CID that looks like IPFS but isn't
    // Prefix with 'Qm' like real IPFS v0 CIDs
    const mockCID = 'Qm' + hash.substring(0, 44);

    console.warn(`⚠️  Generated mock CID (IPFS unavailable): ${mockCID}`);

    return {
      cid: mockCID,
      hash,
      size: buffer.length,
      encrypted: false,
      encryptionKey: null,
      url: null,
      mock: true // Flag to indicate this isn't real IPFS
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      mode: this.mode,
      available: this.initialized
    };
  }
}

// Create singleton instance
const ipfsService = new IPFSService();

module.exports = ipfsService;
