/**
 * Profile Storage Service
 * 
 * Handles decentralized storage of user profiles using IPFS + Blockchain
 * 
 * Architecture:
 * 1. Profile data encrypted client-side
 * 2. Encrypted data uploaded to IPFS
 * 3. IPFS CID stored on blockchain (DIDRegistry)
 * 4. No profile data stored in MongoDB (except cache)
 * 
 * Privacy:
 * - Client-side encryption for private fields
 * - Public fields (name, avatar) stored unencrypted
 * - User controls decryption keys
 */

const ipfsService = require('./ipfsService');
const crypto = require('crypto');

class ProfileStorageService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Store profile on IPFS
   * @param {Object} profileData - Profile data to store
   * @param {string} profileData.walletAddress - User's wallet address
   * @param {string} profileData.name - Display name
   * @param {string} profileData.about - Bio/about text
   * @param {string} profileData.avatar - Avatar URL or emoji
   * @param {Object} profileData.settings - User settings (encrypted)
   * @param {boolean} encrypt - Whether to encrypt sensitive data
   * @returns {Promise<Object>} { cid, encryptionKey }
   */
  async storeProfile(profileData, encrypt = true) {
    try {
      // Separate public and private data
      const publicData = {
        version: '1.0',
        walletAddress: profileData.walletAddress,
        name: profileData.name || 'Anonymous',
        avatar: profileData.avatar || '👤',
        timestamp: Date.now()
      };

      const privateData = {
        about: profileData.about || '',
        settings: profileData.settings || {},
        contacts: profileData.contacts || [],
        blockedUsers: profileData.blockedUsers || []
      };

      // Create profile package
      let profilePackage;
      let encryptionKey = null;

      if (encrypt) {
        // Encrypt private data
        const encrypted = this.encryptData(JSON.stringify(privateData));
        encryptionKey = encrypted.key;

        profilePackage = {
          public: publicData,
          private: {
            encrypted: encrypted.data.toString('base64'),
            iv: encrypted.iv.toString('base64'),
            authTag: encrypted.authTag.toString('base64')
          }
        };
      } else {
        profilePackage = {
          public: publicData,
          private: privateData
        };
      }

      // Upload to IPFS
      const profileBuffer = Buffer.from(JSON.stringify(profilePackage, null, 2));
      const result = await ipfsService.uploadFile(profileBuffer, {
        filename: `profile-${profileData.walletAddress}.json`,
        mimeType: 'application/json',
        encrypt: false // Already encrypted above
      });

      return {
        cid: result.cid,
        encryptionKey: encryptionKey ? encryptionKey.toString('base64') : null,
        size: result.size,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error storing profile:', error);
      throw new Error(`Failed to store profile: ${error.message}`);
    }
  }

  /**
   * Retrieve profile from IPFS
   * @param {string} cid - IPFS CID of the profile
   * @param {string} encryptionKey - Base64 encoded encryption key (optional)
   * @returns {Promise<Object>} Profile data
   */
  async retrieveProfile(cid, encryptionKey = null) {
    try {
      // Download from IPFS
      const result = await ipfsService.downloadFile(cid, {});
      const profilePackage = JSON.parse(result.data.toString());

      // Extract public data
      const profile = {
        ...profilePackage.public
      };

      // Decrypt private data if key provided
      if (encryptionKey && profilePackage.private.encrypted) {
        try {
          const encrypted = Buffer.from(profilePackage.private.encrypted, 'base64');
          const iv = Buffer.from(profilePackage.private.iv, 'base64');
          const authTag = Buffer.from(profilePackage.private.authTag, 'base64');
          const key = Buffer.from(encryptionKey, 'base64');

          const decrypted = this.decryptData(encrypted, key, iv, authTag);
          const privateData = JSON.parse(decrypted.toString());

          // Merge private data
          Object.assign(profile, privateData);
        } catch (decryptError) {
          console.warn('Failed to decrypt private data:', decryptError.message);
          // Return public data only
        }
      } else if (profilePackage.private && !profilePackage.private.encrypted) {
        // Unencrypted private data
        Object.assign(profile, profilePackage.private);
      }

      return profile;

    } catch (error) {
      console.error('Error retrieving profile:', error);
      throw new Error(`Failed to retrieve profile: ${error.message}`);
    }
  }

  /**
   * Update profile (creates new IPFS entry)
   * @param {string} oldCid - Previous profile CID
   * @param {Object} updates - Fields to update
   * @param {string} encryptionKey - Encryption key for private data
   * @returns {Promise<Object>} New CID and key
   */
  async updateProfile(oldCid, updates, encryptionKey = null) {
    try {
      // Retrieve existing profile
      const existingProfile = await this.retrieveProfile(oldCid, encryptionKey);

      // Merge updates
      const updatedProfile = {
        ...existingProfile,
        ...updates,
        timestamp: Date.now()
      };

      // Store updated profile
      return await this.storeProfile(updatedProfile, true);

    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  /**
   * Store profile avatar on IPFS
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} mimeType - Image MIME type
   * @returns {Promise<string>} IPFS CID of avatar
   */
  async storeAvatar(imageBuffer, mimeType) {
    try {
      const result = await ipfsService.uploadFile(imageBuffer, {
        filename: `avatar-${Date.now()}.${mimeType.split('/')[1]}`,
        mimeType,
        encrypt: false
      });

      // Return IPFS gateway URL
      return ipfsService.getGatewayUrl(result.cid);

    } catch (error) {
      console.error('Error storing avatar:', error);
      throw new Error(`Failed to store avatar: ${error.message}`);
    }
  }

  /**
   * Encrypt profile data
   * @param {string} data - Data to encrypt
   * @returns {Object} { data, key, iv, authTag }
   */
  encryptData(data) {
    const key = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      key,
      iv,
      authTag
    };
  }

  /**
   * Decrypt profile data
   * @param {Buffer} encrypted - Encrypted data
   * @param {Buffer} key - Encryption key
   * @param {Buffer} iv - Initialization vector
   * @param {Buffer} authTag - Authentication tag
   * @returns {Buffer} Decrypted data
   */
  decryptData(encrypted, key, iv, authTag) {
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  /**
   * Create profile cache entry for MongoDB (temporary)
   * @param {Object} profile - Full profile data
   * @param {string} cid - IPFS CID
   * @returns {Object} Cache entry
   */
  createCacheEntry(profile, cid) {
    return {
      walletAddress: profile.walletAddress,
      name: profile.name,
      avatar: profile.avatar,
      ipfsCID: cid,
      cachedAt: Date.now(),
      // Keep frequently accessed data
      isOnline: false,
      lastSeen: Date.now()
    };
  }

  /**
   * Generate profile CID deterministically (for verification)
   * @param {Object} profile - Profile data
   * @returns {string} Hash of profile content
   */
  generateProfileHash(profile) {
    const content = JSON.stringify(profile, Object.keys(profile).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validate profile data structure
   * @param {Object} profile - Profile to validate
   * @returns {boolean} True if valid
   */
  validateProfile(profile) {
    const requiredFields = ['walletAddress', 'name'];
    
    for (const field of requiredFields) {
      if (!profile[field]) {
        return false;
      }
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(profile.walletAddress)) {
      return false;
    }

    // Validate name length
    if (profile.name.length > 50) {
      return false;
    }

    // Validate about length
    if (profile.about && profile.about.length > 200) {
      return false;
    }

    return true;
  }
}

// Singleton instance
const profileStorageService = new ProfileStorageService();

module.exports = profileStorageService;
