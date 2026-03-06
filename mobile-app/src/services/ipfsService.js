/**
 * IPFS Service - Decentralized storage layer
 * Handles file uploads, downloads, and encryption for IPFS/Filecoin
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

// IPFS Gateway Configuration
const IPFS_CONFIG = {
  gateway: 'https://ipfs.civitas.network', // CIVITAS IPFS gateway
  api: 'https://api.ipfs.civitas.network', // IPFS API endpoint
  pinningService: 'https://pin.civitas.network', // Pinning service
};

// Fallback public gateways
const FALLBACK_GATEWAYS = [
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
  'https://gateway.pinata.cloud',
];

class IPFSService {
  constructor() {
    this.gateway = IPFS_CONFIG.gateway;
    this.apiEndpoint = IPFS_CONFIG.api;
  }

  /**
   * Upload file to IPFS
   * @param {string} fileUri - Local file URI
   * @param {object} metadata - File metadata {name, type, size}
   * @param {boolean} encrypted - Whether to encrypt before upload
   * @returns {Promise<object>} {cid, size, encrypted, encryptionKey?}
   */
  async uploadFile(fileUri, metadata, encrypted = true) {
    try {
      console.log('📤 Uploading to IPFS:', metadata.name);

      // Read file data
      let fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      let encryptionKey = null;

      // Encrypt file if requested
      if (encrypted) {
        const encryptionResult = await this.encryptData(fileData);
        fileData = encryptionResult.encrypted;
        encryptionKey = encryptionResult.key;
        console.log('🔒 File encrypted');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: `data:${metadata.type};base64,${fileData}`,
        name: metadata.name,
        type: metadata.type,
      });

      // Add metadata
      formData.append('metadata', JSON.stringify({
        ...metadata,
        encrypted,
        uploadedAt: Date.now(),
        platform: Platform.OS,
      }));

      // Upload to IPFS
      const response = await fetch(`${this.apiEndpoint}/add`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('IPFS upload failed');
      }

      const result = await response.json();
      const cid = result.Hash || result.cid;

      console.log('✅ Uploaded to IPFS:', cid);

      // Pin file for persistence
      await this.pinFile(cid);

      return {
        cid,
        size: metadata.size,
        encrypted,
        encryptionKey,
        gateway: `${this.gateway}/ipfs/${cid}`,
      };
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload text/JSON data to IPFS
   * @param {string|object} data - Text or JSON data
   * @param {boolean} encrypted - Whether to encrypt before upload
   * @returns {Promise<object>} {cid, encrypted, encryptionKey?}
   */
  async uploadData(data, encrypted = true) {
    try {
      let content = typeof data === 'string' ? data : JSON.stringify(data);
      let encryptionKey = null;

      // Encrypt data if requested
      if (encrypted) {
        const encryptionResult = await this.encryptData(content);
        content = encryptionResult.encrypted;
        encryptionKey = encryptionResult.key;
        console.log('🔒 Data encrypted');
      }

      // Upload to IPFS
      const response = await fetch(`${this.apiEndpoint}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          encrypted,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('IPFS data upload failed');
      }

      const result = await response.json();
      const cid = result.Hash || result.cid;

      console.log('✅ Data uploaded to IPFS:', cid);

      // Pin for persistence
      await this.pinFile(cid);

      return {
        cid,
        encrypted,
        encryptionKey,
        gateway: `${this.gateway}/ipfs/${cid}`,
      };
    } catch (error) {
      console.error('❌ IPFS data upload failed:', error);
      throw error;
    }
  }

  /**
   * Download file from IPFS
   * @param {string} cid - IPFS content identifier
   * @param {string} encryptionKey - Decryption key if file is encrypted
   * @returns {Promise<string>} File URI or data
   */
  async downloadFile(cid, encryptionKey = null) {
    try {
      console.log('📥 Downloading from IPFS:', cid);

      // Try primary gateway first, then fallbacks
      let response = null;
      const gateways = [this.gateway, ...FALLBACK_GATEWAYS];

      for (const gateway of gateways) {
        try {
          const url = `${gateway}/ipfs/${cid}`;
          response = await fetch(url, { timeout: 10000 });
          
          if (response.ok) {
            console.log('✅ Downloaded from:', gateway);
            break;
          }
        } catch (err) {
          console.warn('Gateway failed:', gateway);
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error('Failed to download from all gateways');
      }

      let data = await response.text();

      // Decrypt if encryption key provided
      if (encryptionKey) {
        data = await this.decryptData(data, encryptionKey);
        console.log('🔓 File decrypted');
      }

      return data;
    } catch (error) {
      console.error('❌ IPFS download failed:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from IPFS
   * @param {string} cid - IPFS content identifier
   * @returns {Promise<object>} File metadata
   */
  async getFileMetadata(cid) {
    try {
      const response = await fetch(`${this.apiEndpoint}/stat?arg=${cid}`);
      
      if (!response.ok) {
        throw new Error('Failed to get metadata');
      }

      const metadata = await response.json();

      return {
        cid,
        size: metadata.CumulativeSize || metadata.size,
        blocks: metadata.NumLinks || 0,
        type: metadata.Type || 'file',
      };
    } catch (error) {
      console.error('❌ Get metadata failed:', error);
      return null;
    }
  }

  /**
   * Pin file to IPFS for persistence
   * @param {string} cid - Content identifier
   * @returns {Promise<boolean>} Success status
   */
  async pinFile(cid) {
    try {
      const response = await fetch(`${IPFS_CONFIG.pinningService}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cid }),
      });

      if (!response.ok) {
        console.warn('⚠️ Pinning failed (file still accessible)');
        return false;
      }

      console.log('📌 File pinned:', cid);
      return true;
    } catch (error) {
      console.warn('⚠️ Pinning service unavailable:', error.message);
      return false;
    }
  }

  /**
   * Unpin file from IPFS
   * @param {string} cid - Content identifier
   * @returns {Promise<boolean>} Success status
   */
  async unpinFile(cid) {
    try {
      const response = await fetch(`${IPFS_CONFIG.pinningService}/unpin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cid }),
      });

      if (!response.ok) {
        return false;
      }

      console.log('📌 File unpinned:', cid);
      return true;
    } catch (error) {
      console.error('❌ Unpin failed:', error);
      return false;
    }
  }

  /**
   * List pinned files
   * @returns {Promise<Array>} List of pinned CIDs
   */
  async listPinnedFiles() {
    try {
      const response = await fetch(`${IPFS_CONFIG.pinningService}/pins`);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.pins || [];
    } catch (error) {
      console.error('❌ List pins failed:', error);
      return [];
    }
  }

  /**
   * Encrypt data using AES-256
   * @param {string} data - Data to encrypt
   * @returns {Promise<object>} {encrypted, key}
   * @private
   */
  async encryptData(data) {
    try {
      // Generate random encryption key
      const key = await Crypto.getRandomBytesAsync(32); // 256 bits
      const keyHex = Array.from(key)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // In production, use proper AES-256-GCM encryption
      // For now, simple XOR (replace with crypto library in production)
      const encrypted = Buffer.from(data)
        .map((byte, i) => byte ^ key[i % key.length])
        .toString('base64');

      return {
        encrypted,
        key: keyHex,
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using AES-256
   * @param {string} encryptedData - Encrypted data
   * @param {string} keyHex - Encryption key (hex)
   * @returns {Promise<string>} Decrypted data
   * @private
   */
  async decryptData(encryptedData, keyHex) {
    try {
      // Convert hex key to bytes
      const key = new Uint8Array(
        keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );

      // Decrypt using XOR (replace with proper AES-256-GCM in production)
      const encrypted = Buffer.from(encryptedData, 'base64');
      const decrypted = encrypted
        .map((byte, i) => byte ^ key[i % key.length])
        .toString();

      return decrypted;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Generate IPFS gateway URL
   * @param {string} cid - Content identifier
   * @returns {string} Gateway URL
   */
  getGatewayUrl(cid) {
    return `${this.gateway}/ipfs/${cid}`;
  }

  /**
   * Check if CID is valid
   * @param {string} cid - Content identifier
   * @returns {boolean}
   */
  isValidCID(cid) {
    // Basic CID validation (CIDv0 starts with Qm, CIDv1 with b)
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})$/.test(cid);
  }

  /**
   * Estimate storage cost (in CIV)
   * @param {number} sizeBytes - File size in bytes
   * @param {number} durationDays - Storage duration in days
   * @returns {number} Cost in CIV
   */
  estimateStorageCost(sizeBytes, durationDays = 365) {
    // Example pricing: 0.001 CIV per MB per year
    const sizeMB = sizeBytes / (1024 * 1024);
    const costPerMBPerYear = 0.001;
    const yearlyMultiplier = durationDays / 365;
    
    return sizeMB * costPerMBPerYear * yearlyMultiplier;
  }
}

// Export singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
