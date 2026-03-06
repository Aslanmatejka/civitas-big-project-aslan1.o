# CIVITAS Layer-1 Blockchain Node

**Protocol:** Cosmos SDK v0.47 + CometBFT (Tendermint) v0.37  
**Chain ID:** `civitas-1`  
**Native denom:** `uciv` (1 CIV = 1,000,000 uciv)

## Overview

The CIVITAS L1 blockchain is the base ledger for the decentralized personal ecosystem.
It provides DID anchoring, credential attestation, node registry, and cross-chain reputation scoring.
The EVM layer (Polygon/Hardhat) handles value transfer and complex smart contract logic;
L1 provides finality proofs, identity state, and governance coordination.

## Directory Structure

```
blockchain/
├── cmd/civitasd/main.go     — CLI entry point, Cosmos SDK server wiring
├── app/
│   ├── app.go               — CIVITASApp: module manager, keeper init
│   └── genesis.go           — Default genesis: supply, gov params, staking
├── x/
│   ├── identity/            — W3C DID anchoring + credential registry
│   │   ├── module.go
│   │   ├── keeper/keeper.go — DID CRUD, credential issue/revoke
│   │   └── types/           — Store keys, message types
│   ├── escrow/              — L1 escrow audit log (mirrors SmartEscrow.sol)
│   │   ├── module.go
│   │   ├── keeper/keeper.go
│   │   └── types/
│   ├── noderegistry/        — Node operators, tiers, epoch rewards, slashing
│   │   ├── module.go        — BeginBlock epoch reward distribution
│   │   ├── keeper/keeper.go
│   │   └── types/
│   └── reputation/          — Cross-chain reputation: stake+gov+escrow+creds
│       ├── module.go        — EndBlock sync every 1000 blocks
│       └── types/
└── config/config.go         — NetworkConfig: mainnet / testnet / local presets
```

## Architecture

### Consensus: CometBFT Proof of Stake

- CometBFT BFT consensus (Cosmos SDK 0.47 fork of Tendermint)
- Validator set: up to 100 validators
- Block time: ~5 seconds
- Slashing: double-sign and downtime

### Cosmos SDK Modules

| Module    | Purpose                                   |
| --------- | ----------------------------------------- |
| `auth`    | Account authentication, fee deduction     |
| `bank`    | CIV token transfers, genesis balances     |
| `staking` | Validator bonding, delegations, unbonding |
| `gov`     | On-chain governance proposals and voting  |
| `params`  | Subspace-based parameter management       |

### CIVITAS Custom Modules

| Module         | Store          | BeginBlock      | EndBlock            | Purpose                                              |
| -------------- | -------------- | --------------- | ------------------- | ---------------------------------------------------- |
| `identity`     | `identity`     | —               | —                   | W3C DID anchoring, credential issue/revoke           |
| `escrow`       | `escrow`       | —               | ✓                   | Audit log of EVM escrow state transitions            |
| `noderegistry` | `noderegistry` | ✓ epoch payouts | —                   | Node tiers, uptime EMA, epoch reward distribution    |
| `reputation`   | `reputation`   | —               | ✓ every 1000 blocks | Weighted score aggregation from all activity sources |

## Token Distribution (Genesis)

| Allocation                   | Amount                |
| ---------------------------- | --------------------- |
| Community Pool / Governance  | 400,000,000 CIV       |
| Foundation Multi-sig         | 300,000,000 CIV       |
| Node Operator Rewards Escrow | 200,000,000 CIV       |
| Bridge Reserve (IBC)         | 100,000,000 CIV       |
| **Total**                    | **1,000,000,000 CIV** |

## Node Tiers

| Tier     | Stake Required | Reward Multiplier |
| -------- | -------------- | ----------------- |
| Bronze   | 5,000 CIV      | 1×                |
| Silver   | 50,000 CIV     | 2×                |
| Gold     | 200,000 CIV    | 3×                |
| Platinum | 500,000 CIV    | 4×                |

Epoch reward: `1 CIV × (uptime/10000) × (storageGB/1000 + 1) × tierMultiplier` per 24h epoch

## Reputation Score Components

| Component                       | Weight |
| ------------------------------- | ------ |
| Staking                         | 25%    |
| Governance participation        | 20%    |
| Escrow buyer completion         | 15%    |
| Escrow seller completion        | 15%    |
| Node uptime (operators)         | 10%    |
| Verified credentials (×6 types) | 8%     |
| Community endorsements          | 7%     |

## Development

### Build

```bash
cd blockchain
go mod tidy
go build -o civitasd ./cmd/civitasd
```

### Local Devnet

```bash
# Initialize single-node devnet
./civitasd init devnode --chain-id civitas-local
./civitasd keys add validator --keyring-backend test

# Fund the validator
./civitasd add-genesis-account \
  $(./civitasd keys show validator -a --keyring-backend test) \
  1000000000000uciv

# Create genesis transaction
./civitasd gentx validator 5000000000uciv \
  --chain-id civitas-local \
  --keyring-backend test

./civitasd collect-gentxs
./civitasd start
```

### Create a Validator

```bash
./civitasd tx staking create-validator \
  --amount=5000000000uciv \
  --pubkey=$(./civitasd tendermint show-validator) \
  --moniker="my-validator" \
  --chain-id=civitas-1 \
  --commission-rate="0.05" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.02" \
  --min-self-delegation="5000000000" \
  --from mykey
```

### Register a Node Operator

```bash
./civitasd tx noderegistry register \
  --moniker "my-storage-node" \
  --endpoint "https://node.mydomain.com" \
  --p2p "/ip4/1.2.3.4/tcp/26656/p2p/QmXXX" \
  --storage-gb 2000 \
  --amount 5000000000uciv \
  --from mykey --chain-id civitas-1
```

## Testing

```bash
cd blockchain
go test ./...
```

## Deployment

- **Local:** `civitas-local` — 1s blocks, 1h unbonding, 30m voting
- **Testnet:** `civitas-testnet-1` — 5s blocks, 3d unbonding, 1d voting
- **Mainnet:** `civitas-1` — 5s blocks, 21d unbonding, 7d voting

Configuration presets in `config/config.go` — `Local()`, `Testnet()`, `Mainnet()`.

## EVM Bridge

The EVM layer (Hardhat/Polygon) mirrors L1 state via relayers:

| EVM Contract       | L1 Module                             | Sync direction           |
| ------------------ | ------------------------------------- | ------------------------ |
| `SmartEscrow.sol`  | `x/escrow`                            | EVM → L1 audit log       |
| `StakingPool.sol`  | `x/reputation` (staking score)        | EVM → L1                 |
| `ZKVerifier.sol`   | `x/identity` (credential attestation) | EVM → L1                 |
| `NodeRegistry.sol` | `x/noderegistry`                      | EVM ↔ L1 (dual-registry) |
| `DIDRegistry.sol`  | `x/identity` (DID documents)          | L1 → EVM                 |
