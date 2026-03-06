# CIVITAS Subgraph — The Graph Protocol

Indexes `DIDRegistry` and `CIVITASGovernance` events for decentralized, censorship-resistant querying.

## Entities

| Entity             | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `DIDIdentity`      | On-chain DID — controller, reputation, active flag, timestamps |
| `IssuedCredential` | Verifiable credentials issued to a DID                         |
| `ReputationEvent`  | Every reputation change with tx hash + block                   |
| `Proposal`         | Governance proposals with vote tallies                         |
| `VoteRecord`       | Individual votes (support, weight, voter)                      |
| `CivitasStats`     | Global platform statistics                                     |

## Setup (Local Development)

### 1 — Prerequisites

```bash
# Install graph-cli globally
npm install -g @graphprotocol/graph-cli

# Install subgraph deps
cd subgraph
npm install
```

### 2 — Run a local Graph Node (alongside Hardhat)

```bash
# In a new terminal — start Hardhat node if not already running
cd smart-contracts
npx hardhat node

# In another terminal — start the local Graph node (requires Docker)
docker run -it \
  -e postgres_host=host.docker.internal \
  -e postgres_user=graph-node \
  -e postgres_pass=let-me-in \
  -e postgres_db=graph-node \
  -e ipfs=host.docker.internal:5001 \
  -e ethereum=mainnet:http://host.docker.internal:8545 \
  -p 8000:8000 -p 8001:8001 -p 8020:8020 \
  graphprotocol/graph-node
```

### 3 — Deploy

```bash
cd subgraph

# Generate AssemblyScript types from ABI + schema
npm run codegen

# Build WASM
npm run build

# Create + deploy to local node
npm run create:local
npm run deploy:local
```

### 4 — Query

GraphQL playground: **http://localhost:8000/subgraphs/name/civitas**

```graphql
# Example: fetch top-5 DIDs by reputation
{
  dIDIdentities(first: 5, orderBy: reputation, orderDirection: desc) {
    id
    controller
    reputation
    active
  }
}

# Example: governance proposals
{
  proposals(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    title
    state
    forVotes
    againstVotes
  }
}
```

## Production Deployment

1. Go to [Subgraph Studio](https://thegraph.com/studio/) and create a new subgraph named `civitas`.
2. Update `subgraph.yaml` — change `network: mainnet` to your target network (e.g., `sepolia`).
3. Update contract addresses to match your production deployment.
4. Run:

```bash
graph auth --studio <DEPLOY_KEY>
npm run deploy
```

5. Set `REACT_APP_GRAPH_URL` in `web-app/.env` to the Studio query URL.

## Contract Addresses (Localhost)

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| DIDRegistry       | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| CIVITASGovernance | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| CIVToken          | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| CIVITASWallet     | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
