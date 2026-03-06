/**
 * Reputation On-Chain Service
 * Reads and writes reputation scores directly from/to the DIDRegistry smart contract.
 * Falls back to in-memory values gracefully if blockchain is unavailable.
 */
const { ethers } = require('ethers');

// ── Contract Config ────────────────────────────────────────────────────────────
const DEPLOYMENTS = {
  localhost: {
    DIDRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    CIVITASGovernance: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  },
};

// Minimal ABI — only what we need
const DID_REGISTRY_ABI = [
  'function createDID(bytes32 didIdentifier, string didDocument) external',
  'function getDID(bytes32 didIdentifier) external view returns (tuple(address controller, string didDocument, string profileCID, uint256 createdAt, uint256 updatedAt, bool active, uint256 reputation))',
  'function updateReputation(bytes32 didIdentifier, uint256 newReputation) external',
  'function verifyDID(bytes32 didIdentifier, uint256 minReputation) external view returns (bool)',
  'event DIDCreated(bytes32 indexed didIdentifier, address indexed controller)',
  'event ReputationUpdated(bytes32 indexed didIdentifier, uint256 newReputation)',
];

// ── Provider & Contract ───────────────────────────────────────────────────────
const RPC_URL   = process.env.BLOCKCHAIN_RPC_URL   || 'http://127.0.0.1:8545';
const ADMIN_KEY = process.env.BLOCKCHAIN_ADMIN_KEY; // set to Hardhat deployer private key for writes
const NET       = process.env.BLOCKCHAIN_NETWORK    || 'localhost';
const DID_REGISTRY_ADDRESS = process.env.DID_REGISTRY_ADDRESS || DEPLOYMENTS[NET]?.DIDRegistry;

let provider  = null;
let signer    = null;
let contract  = null; // read-only
let writableContract = null; // signed

function _init() {
  if (contract) return; // already initialised
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    contract = new ethers.Contract(DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI, provider);

    if (ADMIN_KEY) {
      signer = new ethers.Wallet(ADMIN_KEY, provider);
      writableContract = new ethers.Contract(DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI, signer);
    }
    console.log(`⛓️  ReputationService connected → ${RPC_URL} (${NET})`);
  } catch (err) {
    console.warn(`⚠️  ReputationService: cannot connect to blockchain — ${err.message}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a DID string like "did:civitas:john.civitas" to bytes32 identifier.
 * Mirrors the off-chain hash used by the Solidity contract.
 */
function didToHash(didString) {
  return ethers.keccak256(ethers.toUtf8Bytes(didString));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch reputation from the DIDRegistry contract.
 * @param {string} didString  e.g. "did:civitas:john.civitas"
 * @returns {object|null}  { total, onChain, contractAddress, blockchain } or null on failure
 */
async function getReputation(didString) {
  _init();
  if (!contract || !didString) return null;
  try {
    const hash = didToHash(didString);
    const doc  = await contract.getDID(hash);
    if (doc.controller === ethers.ZeroAddress) return null; // DID not registered on-chain

    const total = Number(doc.reputation);
    return {
      total,
      onChain: true,
      factors: {
        transactionHistory:    Math.floor(total * 0.30),
        communityEngagement:   Math.floor(total * 0.20),
        governanceParticipation: Math.floor(total * 0.30),
        verifiedCredentials:   Math.floor(total * 0.20),
      },
      raw: {
        controller: doc.controller,
        active: doc.active,
        createdAt: Number(doc.createdAt) * 1000,
        updatedAt: Number(doc.updatedAt) * 1000,
      },
      contractAddress: DID_REGISTRY_ADDRESS,
      blockchain: NET,
    };
  } catch (err) {
    console.warn(`⚠️  getReputation chain read failed: ${err.message}`);
    return null;
  }
}

/**
 * Update reputation on-chain (requires BLOCKCHAIN_ADMIN_KEY in env).
 * @param {string} didString
 * @param {number} newTotal   0–1000
 * @returns {{ txHash: string, newTotal: number }|null}
 */
async function setReputation(didString, newTotal) {
  _init();
  if (!writableContract || !didString) return null;
  try {
    const clamped = Math.max(0, Math.min(1000, Math.round(newTotal)));
    const hash = didToHash(didString);
    const tx   = await writableContract.updateReputation(hash, clamped);
    const receipt = await tx.wait();
    console.log(`⛓️  Reputation updated on-chain: ${didString} → ${clamped} (tx: ${receipt.hash})`);
    return { txHash: receipt.hash, newTotal: clamped };
  } catch (err) {
    console.warn(`⚠️  setReputation chain write failed: ${err.message}`);
    return null;
  }
}

/**
 * Verify if a DID exists and meets a minimum reputation threshold on-chain.
 * @param {string} didString
 * @param {number} minReputation
 * @returns {boolean}
 */
async function verifyDID(didString, minReputation = 0) {
  _init();
  if (!contract || !didString) return false;
  try {
    return await contract.verifyDID(didToHash(didString), minReputation);
  } catch {
    return false;
  }
}

/**
 * Get raw DIDDocument from contract (controller, active, reputation, timestamps).
 */
async function getDIDDocument(didString) {
  _init();
  if (!contract || !didString) return null;
  try {
    const doc = await contract.getDID(didToHash(didString));
    if (doc.controller === ethers.ZeroAddress) return null;
    return {
      controller: doc.controller,
      didDocument: doc.didDocument,
      profileCID: doc.profileCID,
      createdAt: Number(doc.createdAt) * 1000,
      updatedAt: Number(doc.updatedAt) * 1000,
      active: doc.active,
      reputation: Number(doc.reputation),
      contractAddress: DID_REGISTRY_ADDRESS,
      blockchain: NET,
    };
  } catch (err) {
    console.warn(`⚠️  getDIDDocument failed: ${err.message}`);
    return null;
  }
}

/**
 * Status check — is the blockchain connection healthy?
 */
async function healthCheck() {
  _init();
  if (!provider) return { connected: false, reason: 'No provider' };
  try {
    const block = await provider.getBlockNumber();
    return { connected: true, blockNumber: block, rpc: RPC_URL, network: NET, contract: DID_REGISTRY_ADDRESS };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}

module.exports = { getReputation, setReputation, verifyDID, getDIDDocument, healthCheck, didToHash };
