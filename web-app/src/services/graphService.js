/**
 * CIVITAS Graph Service
 * Queries The Graph Protocol subgraph for on-chain data.
 * Falls back gracefully to the backend REST API when The Graph is unavailable.
 */

// ── Endpoint Config ────────────────────────────────────────────────────────────
const GRAPH_ENDPOINTS = {
  // Hosted Service (legacy, still works for existing subgraphs)
  hosted: 'https://api.thegraph.com/subgraphs/name/civitas/civitas',
  // Decentralized Network (Subgraph Studio)
  studio: 'https://api.studio.thegraph.com/query/<YOUR_SUBGRAPH_ID>/civitas/v0.0.1',
  // Local Graph Node (for development with `graph-node` running alongside Hardhat)
  local:  'http://localhost:8000/subgraphs/name/civitas',
};

const ACTIVE_ENDPOINT =
  import.meta.env.VITE_GRAPH_URL ||
  GRAPH_ENDPOINTS.local;            // swap to .studio / .hosted for production

// ── Core Query Runner ──────────────────────────────────────────────────────────

/**
 * Run a GraphQL query against the CIVITAS subgraph.
 * @param {string} query     GraphQL query string
 * @param {object} variables Query variables
 * @returns {Promise<object|null>} Response data or null on failure
 */
async function graphQuery(query, variables = {}) {
  try {
    const res = await fetch(ACTIVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) {
      console.warn('[GraphService] Query errors:', json.errors);
      return null;
    }
    return json.data;
  } catch (err) {
    console.warn('[GraphService] Unavailable — falling back to REST API:', err.message);
    return null;
  }
}

// ── Queries ────────────────────────────────────────────────────────────────────

/**
 * Fetch a DID identity by its bytes32 hex id.
 * @param {string} didHex  keccak256 hash of the DID string (0x...)
 */
export async function getDIDOnChain(didHex) {
  const data = await graphQuery(`
    query GetDID($id: ID!) {
      dIDIdentity(id: $id) {
        id
        controller
        reputation
        active
        createdAt
        updatedAt
        profileCID
        reputationHistory(orderBy: timestamp, orderDirection: desc, first: 10) {
          id
          newReputation
          timestamp
          txHash
        }
        credentials(where: { revoked: false }) {
          id
          credentialHash
          issuer
          issuedAt
          expiresAt
        }
      }
    }
  `, { id: didHex.toLowerCase() });
  return data?.dIDIdentity || null;
}

/**
 * Fetch reputation history for a DID (latest 20 events).
 * @param {string} didHex
 */
export async function getReputationHistory(didHex) {
  const data = await graphQuery(`
    query ReputationHistory($did: String!) {
      reputationEvents(
        where: { did: $did }
        orderBy: timestamp
        orderDirection: desc
        first: 20
      ) {
        id
        newReputation
        timestamp
        blockNumber
        txHash
      }
    }
  `, { did: didHex.toLowerCase() });
  return data?.reputationEvents || [];
}

/**
 * Fetch active governance proposals (most recent first).
 * @param {number} limit
 */
export async function getProposals(limit = 10) {
  const data = await graphQuery(`
    query Proposals($limit: Int!) {
      proposals(
        first: $limit
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        proposer
        title
        votingDeadline
        forVotes
        againstVotes
        abstainVotes
        state
        createdAt
      }
    }
  `, { limit });
  return data?.proposals || [];
}

/**
 * Fetch votes cast by a specific wallet address.
 * @param {string} voterAddress  lowercase 0x address
 * @param {number} limit
 */
export async function getVotesByVoter(voterAddress, limit = 20) {
  const data = await graphQuery(`
    query VoterHistory($voter: Bytes!, $limit: Int!) {
      voteRecords(
        where: { voter: $voter }
        first: $limit
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        proposal { id title state }
        support
        weight
        timestamp
        txHash
      }
    }
  `, { voter: voterAddress.toLowerCase(), limit });
  return data?.voteRecords || [];
}

/**
 * Fetch platform-wide stats from the global entity.
 */
export async function getGlobalStats() {
  const data = await graphQuery(`
    query Stats {
      civitasStats(id: "global") {
        totalDIDs
        totalCredentials
        totalProposals
        totalVotes
        lastUpdatedAt
      }
    }
  `);
  return data?.civitasStats || null;
}

/**
 * Fetch the most recently created DIDs.
 * @param {number} limit
 */
export async function getRecentDIDs(limit = 5) {
  const data = await graphQuery(`
    query RecentDIDs($limit: Int!) {
      dIDIdentities(
        first: $limit
        orderBy: createdAt
        orderDirection: desc
        where: { active: true }
      ) {
        id
        controller
        reputation
        createdAt
      }
    }
  `, { limit });
  return data?.dIDIdentities || [];
}

/**
 * Check if The Graph endpoint is reachable.
 */
export async function graphHealthCheck() {
  const data = await graphQuery(`{ _meta { block { number } } }`);
  return data ? { available: true, syncedBlock: data._meta?.block?.number } : { available: false };
}
