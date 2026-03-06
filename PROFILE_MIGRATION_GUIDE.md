# Profile Decentralization Migration Guide

## Overview

This guide explains how to migrate user profiles from centralized MongoDB storage to decentralized IPFS + Blockchain architecture.

## Architecture Change

### Before (Centralized)

```
User Profile → MongoDB → Backend API → Frontend
```

- All profile data stored in MongoDB
- Server can read all user data
- Single point of failure
- Censorship risk

### After (Decentralized)

```
User Profile → IPFS (encrypted) → Blockchain (CID) → Backend Cache → Frontend
```

- Profile data stored on IPFS (encrypted)
- IPFS CID registered on blockchain
- Server only caches public data
- User controls encryption key
- Censorship resistant

## Smart Contract Updates

### DIDRegistry.sol Changes

**Added:**

1. `profileCID` field to `DIDDocument` struct
2. `updateProfile()` function to store profile CID
3. `ProfileUpdated` event

**New Function:**

```solidity
function updateProfile(
    bytes32 didIdentifier,
    string memory profileCID
) external {
    require(dids[didIdentifier].controller == msg.sender, "Not authorized");
    require(dids[didIdentifier].active, "DID is deactivated");
    require(bytes(profileCID).length > 0, "Profile CID cannot be empty");

    dids[didIdentifier].profileCID = profileCID;
    dids[didIdentifier].updatedAt = block.timestamp;

    emit ProfileUpdated(didIdentifier, profileCID);
}
```

## Backend Services

### New Files

#### 1. `services/profileStorageService.js` (310 lines)

Handles IPFS profile storage with encryption.

**Key Features:**

- Store profile on IPFS with AES-256-GCM encryption
- Separate public and private profile data
- Avatar upload to IPFS
- Profile retrieval with decryption
- Update profile (creates new IPFS entry)

**API:**

```javascript
const profileStorageService = require("./services/profileStorageService");

// Store profile
const result = await profileStorageService.storeProfile(
  {
    walletAddress: "0x123...",
    name: "Alice",
    about: "Builder of decentralized systems",
    avatar: "👩‍💻",
    settings: { notifications: true },
  },
  (encrypt = true),
);
// Returns: { cid, encryptionKey, size }

// Retrieve profile
const profile = await profileStorageService.retrieveProfile(cid, encryptionKey);

// Update profile
const updated = await profileStorageService.updateProfile(
  oldCid,
  { name: "Alice Updated" },
  encryptionKey,
);

// Store avatar
const avatarUrl = await profileStorageService.storeAvatar(
  imageBuffer,
  "image/png",
);
```

#### 2. `routes/profileDecentralized.js` (500+ lines)

New API endpoints for decentralized profiles.

**Endpoints:**

##### GET `/api/profile/decentralized`

Fetch profile from IPFS.

```bash
curl "http://localhost:3001/api/profile/decentralized?walletAddress=0x123&encryptionKey=base64key"
```

**Response:**

```json
{
  "success": true,
  "source": "ipfs",
  "profile": {
    "walletAddress": "0x123...",
    "name": "Alice",
    "about": "Builder",
    "avatar": "👩‍💻",
    "settings": { "notifications": true }
  },
  "cid": "QmXXX...",
  "encrypted": true,
  "ipfsGateway": "https://ipfs.io/ipfs/QmXXX..."
}
```

##### POST `/api/profile/decentralized`

Create new decentralized profile.

```bash
curl -X POST http://localhost:3001/api/profile/decentralized \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "name": "Alice",
    "about": "Builder",
    "avatar": "👩‍💻",
    "encrypt": true
  }'
```

**Response:**

```json
{
  "success": true,
  "cid": "QmXXX...",
  "encryptionKey": "base64encodedkey",
  "size": 1234,
  "ipfsGateway": "https://ipfs.io/ipfs/QmXXX...",
  "nextStep": {
    "action": "Call smart contract",
    "contract": "DIDRegistry.updateProfile()",
    "parameters": {
      "didIdentifier": "0xabc...",
      "profileCID": "QmXXX..."
    }
  }
}
```

⚠️ **IMPORTANT**: Save the `encryptionKey`! You need it to decrypt private data.

##### PUT `/api/profile/decentralized`

Update existing profile.

```bash
curl -X PUT http://localhost:3001/api/profile/decentralized \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "updates": {
      "name": "Alice Updated",
      "about": "New bio"
    },
    "encryptionKey": "base64key"
  }'
```

##### POST `/api/profile/decentralized/avatar`

Upload avatar to IPFS.

```bash
curl -X POST http://localhost:3001/api/profile/decentralized/avatar \
  -F "avatar=@avatar.png"
```

**Response:**

```json
{
  "success": true,
  "avatarUrl": "https://ipfs.io/ipfs/QmAVATAR...",
  "nextStep": "Update your profile with this avatar URL"
}
```

##### POST `/api/profile/migrate`

Migrate existing MongoDB profile to IPFS.

```bash
curl -X POST http://localhost:3001/api/profile/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "encrypt": true
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Profile migrated to IPFS successfully",
  "migration": {
    "from": "MongoDB",
    "to": "IPFS",
    "cid": "QmXXX...",
    "encrypted": true,
    "encryptionKey": "base64key"
  },
  "warning": "SAVE THE ENCRYPTION KEY!",
  "nextStep": {
    "action": "Register CID on blockchain",
    "contract": "DIDRegistry.updateProfile()"
  }
}
```

##### GET `/api/profile/status`

Check profile decentralization status.

```bash
curl "http://localhost:3001/api/profile/status?walletAddress=0x123"
```

**Response:**

```json
{
  "exists": true,
  "decentralized": true,
  "storage": "IPFS",
  "cid": "QmXXX...",
  "migratedAt": "2024-02-28T10:00:00.000Z",
  "preview": {
    "name": "Alice",
    "avatar": "👩‍💻"
  },
  "nextStep": "Verify CID is registered on DIDRegistry contract"
}
```

##### POST `/api/profile/verify`

Verify profile CID matches blockchain.

```bash
curl -X POST http://localhost:3001/api/profile/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "cid": "QmXXX..."
  }'
```

## Migration Process

### Step 1: Install Dependencies

Already done - `ipfs-http-client` added to package.json.

### Step 2: Setup IPFS

Choose one option:

**Option A: Local IPFS (Recommended)**

```bash
# Install IPFS
choco install ipfs  # Windows
brew install ipfs   # Mac

# Initialize and start
ipfs init
ipfs daemon
```

**Option B: Infura**

```bash
# Get API keys from https://infura.io
# Add to .env:
IPFS_MODE=infura
INFURA_PROJECT_ID=your_id
INFURA_PROJECT_SECRET=your_secret
```

**Option C: Pinata**

```bash
# Get API keys from https://pinata.cloud
# Add to .env:
IPFS_MODE=pinata
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
```

### Step 3: Update Smart Contract

Re-deploy updated DIDRegistry.sol with `profileCID` support.

```bash
cd smart-contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network <your-network>
```

### Step 4: Migrate Existing Users

**Batch Migration Script** (create as `scripts/migrateProfiles.js`):

```javascript
const mongoose = require("mongoose");
const User = require("../models/User");
const profileStorageService = require("../services/profileStorageService");

async function migrateProfiles() {
  await mongoose.connect(process.env.MONGODB_URI);

  const users = await User.find({ ipfsCID: { $exists: false } });
  console.log(`Found ${users.length} users to migrate`);

  for (const user of users) {
    try {
      console.log(`Migrating ${user.walletAddress}...`);

      const profileData = {
        walletAddress: user.walletAddress,
        name: user.name,
        about: user.about || "",
        avatar: user.avatar,
        settings: user.settings || {},
        contacts: user.contacts || [],
        blockedUsers: user.blockedUsers || [],
      };

      const result = await profileStorageService.storeProfile(
        profileData,
        true,
      );

      user.ipfsCID = result.cid;
      user.ipfsEncrypted = true;
      user.migratedToIPFS = true;
      user.migratedAt = new Date();
      await user.save();

      console.log(`✅ Migrated ${user.walletAddress} - CID: ${result.cid}`);
      console.log(`🔑 Encryption Key: ${result.encryptionKey}`);
      console.log("⚠️  Send encryption key to user via secure channel!\n");
    } catch (error) {
      console.error(
        `❌ Failed to migrate ${user.walletAddress}:`,
        error.message,
      );
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrateProfiles();
```

Run migration:

```bash
cd messaging-backend
node scripts/migrateProfiles.js
```

### Step 5: Update Frontend

**Old Code (web-app/src/services/profileService.js):**

```javascript
export const fetchProfile = async (walletAddress) => {
  const response = await fetch(
    `http://localhost:3001/api/profile?walletAddress=${walletAddress}`,
  );
  return response.json();
};
```

**New Code:**

```javascript
export const fetchProfile = async (walletAddress, encryptionKey) => {
  // Try decentralized endpoint first
  const decentralizedUrl = `http://localhost:3001/api/profile/decentralized?walletAddress=${walletAddress}&encryptionKey=${encryptionKey}`;

  try {
    const response = await fetch(decentralizedUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.profile;
      }
    }
  } catch (error) {
    console.warn("Decentralized fetch failed, falling back to legacy");
  }

  // Fallback to legacy MongoDB endpoint
  const legacyUrl = `http://localhost:3001/api/profile?walletAddress=${walletAddress}`;
  const response = await fetch(legacyUrl);
  return (await response.json()).profile;
};
```

### Step 6: Blockchain Integration

**Frontend: Register Profile CID On-chain**

```javascript
import { ethers } from "ethers";
import DIDRegistryABI from "../contracts/DIDRegistry.json";

export const registerProfileOnChain = async (walletAddress, profileCID) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contractAddress = process.env.REACT_APP_DID_REGISTRY_ADDRESS;
  const contract = new ethers.Contract(
    contractAddress,
    DIDRegistryABI.abi,
    signer,
  );

  // Generate DID identifier
  const didString = `did:civitas:${walletAddress}`;
  const didIdentifier = ethers.keccak256(ethers.toUtf8Bytes(didString));

  // Update profile on-chain
  const tx = await contract.updateProfile(didIdentifier, profileCID);
  console.log("Transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Profile CID registered on-chain!", receipt);

  return receipt;
};
```

**Usage:**

```javascript
// After uploading profile to IPFS
const response = await fetch(
  "http://localhost:3001/api/profile/decentralized",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      name,
      about,
      avatar,
      encrypt: true,
    }),
  },
);

const { cid, encryptionKey } = await response.json();

// Save encryption key securely (localStorage with user password encryption)
saveEncryptionKey(walletAddress, encryptionKey);

// Register CID on blockchain
await registerProfileOnChain(walletAddress, cid);

alert("Profile decentralized successfully!");
```

## Data Structure

### IPFS Profile Package

```json
{
  "version": "1.0",
  "public": {
    "walletAddress": "0x123...",
    "name": "Alice",
    "avatar": "👩‍💻",
    "timestamp": 1709116800000
  },
  "private": {
    "encrypted": "base64encrypteddata...",
    "iv": "base64iv...",
    "authTag": "base64tag..."
  }
}
```

### MongoDB Cache Schema (Updated)

```javascript
{
  walletAddress: String,
  name: String,
  avatar: String,
  ipfsCID: String,              // NEW
  ipfsEncrypted: Boolean,        // NEW
  migratedToIPFS: Boolean,       // NEW
  migratedAt: Date,              // NEW
  isOnline: Boolean,
  lastSeen: Date
}
```

## Security Considerations

### 1. Encryption Key Management

- **Client-Side Storage**: Store encryption keys in browser (encrypted with user password)
- **Never Send Keys to Server**: Keys should only exist client-side
- **Backup Strategy**: Users must backup keys securely
- **Key Rotation**: Support for changing encryption keys

### 2. Privacy Layers

- **Public Data**: Name, avatar (unencrypted on IPFS)
- **Private Data**: About, settings, contacts (encrypted)
- **Server Cache**: Only public data cached in MongoDB

### 3. Access Control

- Profile updates require wallet signature
- Only profile owner can update blockchain CID
- Smart contract enforces authorization

## Rollback Plan

If issues occur, you can rollback:

1. **Keep Using Legacy Endpoints**: Old `/api/profile` endpoints still work
2. **MongoDB as Source of Truth**: Profiles still cached in MongoDB
3. **Gradual Migration**: Migrate users incrementally
4. **Dual System**: Run both systems in parallel

## Testing

### Test Decentralized Profile Flow

1. **Create Profile**:

```bash
curl -X POST http://localhost:3001/api/profile/decentralized \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xtest123",
    "name": "Test User",
    "about": "Testing decentralized profiles",
    "avatar": "🧪"
  }'
```

2. **Check IPFS**:

```bash
# Get CID from response, then:
curl "https://ipfs.io/ipfs/<CID>"
```

3. **Fetch Profile**:

```bash
curl "http://localhost:3001/api/profile/decentralized?walletAddress=0xtest123&encryptionKey=<KEY>"
```

4. **Check Status**:

```bash
curl "http://localhost:3001/api/profile/status?walletAddress=0xtest123"
```

## Monitoring

### Key Metrics

- **Migration Progress**: % of users migrated to IPFS
- **IPFS Availability**: Uptime of IPFS service
- **CID Verification**: % of CIDs registered on-chain
- **Encryption Rate**: % of profiles encrypted

### Logs to Monitor

- Profile creation failures
- IPFS upload errors
- Blockchain transaction failures
- Decryption errors

## Future Enhancements

1. **The Graph Integration**: Index profile CIDs from blockchain
2. **Multi-Provider IPFS**: Replicate across multiple IPFS providers
3. **Filecoin Backup**: Long-term storage on Filecoin
4. **ENS Integration**: Resolve profiles via ENS names
5. **Zero-Knowledge Proofs**: Prove profile attributes without revealing data

## Support

- Check [REALIGNMENT_GUIDE.md](./REALIGNMENT_GUIDE.md) for overall mission
- Review [DECENTRALIZATION_AUDIT.md](./DECENTRALIZATION_AUDIT.md) for full analysis
- Monitor IPFS status: `ipfs stats repo`

---

**Remember**: This is about returning to the core mission of self-sovereignty and decentralization. Every profile migrated to IPFS is a step toward true digital freedom for users in underserved regions.
