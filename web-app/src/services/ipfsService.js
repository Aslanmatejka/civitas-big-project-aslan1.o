import { create } from 'ipfs-http-client';

/**
 * IPFS Service for Web App
 * Handles file uploads to IPFS for decentralized file sharing
 */

class IPFSService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.useBackend = true; // Use backend IPFS service as fallback
  }

  /**
   * Initialize IPFS client
   */
  async initialize() {
    try {
      // Try to connect to local IPFS node first
      this.client = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http'
      });

      // Test connection
      await this.client.id();
      this.isInitialized = true;
      this.useBackend = false;
      console.log('✅ IPFS client initialized (local node)');
    } catch (error) {
      console.warn('⚠️ Local IPFS not available, will use backend service');
      this.useBackend = true;
      this.isInitialized = true;
    }
  }

  /**
   * Upload file to IPFS
   * @param {File} file - File to upload
   * @returns {Promise<{cid: string, url: string}>}
   */
  async uploadFile(file) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // If using backend, upload via API
      if (this.useBackend) {
        return await this.uploadViaBackend(file);
      }

      // Direct IPFS upload
      const buffer = await file.arrayBuffer();
      const result = await this.client.add(Buffer.from(buffer), {
        progress: (prog) => console.log(`Upload progress: ${prog}`)
      });

      const cid = result.path;
      const url = `https://ipfs.io/ipfs/${cid}`;

      console.log('✅ File uploaded to IPFS:', cid);

      return { cid, url };
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      
      // Fallback to backend
      if (!this.useBackend) {
        console.log('Retrying via backend...');
        return await this.uploadViaBackend(file);
      }
      
      throw error;
    }
  }

  /**
   * Upload file via backend API
   * @param {File} file 
   * @returns {Promise<{cid: string, url: string}>}
   */
  async uploadViaBackend(file) {
    const formData = new FormData();
    formData.append('file', file);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    
    const response = await fetch(`${API_BASE_URL}/storage/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Backend upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      cid: data.cid,
      url: data.url || `https://ipfs.io/ipfs/${data.cid}`
    };
  }

  /**
   * Get file from IPFS
   * @param {string} cid - IPFS content identifier
   * @returns {Promise<Blob>}
   */
  async getFile(cid) {
    try {
      if (this.useBackend || !this.isInitialized) {
        // Fetch from public gateway
        const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
        return await response.blob();
      }

      // Get from local node
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      return new Blob(chunks);
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload JSON data to IPFS
   * @param {object} data - JSON data to upload
   * @returns {Promise<{cid: string, url: string}>}
   */
  async uploadJSON(data) {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'data.json', { type: 'application/json' });
    return await this.uploadFile(file);
  }

  /**
   * Get JSON data from IPFS
   * @param {string} cid 
   * @returns {Promise<object>}
   */
  async getJSON(cid) {
    const blob = await this.getFile(cid);
    const text = await blob.text();
    return JSON.parse(text);
  }

  /**
   * Check if using backend
   */
  isUsingBackend() {
    return this.useBackend;
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
export default ipfsService;
