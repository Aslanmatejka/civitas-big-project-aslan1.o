# CIVITAS Development Environment Setup

## Prerequisites

### Required Software

- **Node.js**: v18+ (LTS recommended)
- **Go**: v1.21+ (for Cosmos SDK)
- **Python**: v3.10+ (for scripts)
- **Docker**: Latest version
- **Git**: Latest version

### Recommended Tools

- **Hardhat**: For smart contract development
- **React Native CLI**: For mobile development
- **IPFS Desktop**: For storage testing
- **MetaMask**: For wallet testing

## Installation Steps

### 1. Clone and Setup

```bash
cd civitas
npm install
```

### 2. Install Blockchain Dependencies (Cosmos SDK)

```bash
cd blockchain
go mod init civitas-chain
go mod tidy
```

### 3. Install Smart Contract Dependencies

```bash
cd smart-contracts
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat
```

### 4. Install Mobile App Dependencies

```bash
cd mobile-app
npm install
# For iOS
cd ios && pod install
```

### 5. Install Web App Dependencies

```bash
cd web-app
npm install
```

## Environment Configuration

Create `.env` files in respective directories:

### smart-contracts/.env

```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### web-app/.env

```env
REACT_APP_CHAIN_ID=1
REACT_APP_RPC_URL=http://localhost:8545
REACT_APP_IPFS_GATEWAY=https://ipfs.io
```

### mobile-app/.env

```env
API_URL=http://localhost:3000
CHAIN_RPC=http://localhost:8545
```

## Running the Project

### Blockchain Node (Local Development)

```bash
cd blockchain
go run cmd/civitasd/main.go start
```

### Smart Contracts (Local Network)

```bash
cd smart-contracts
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Web App

```bash
cd web-app
npm start
```

### Mobile App

```bash
cd mobile-app
# For iOS
npm run ios
# For Android
npm run android
```

## Testing

### Run All Tests

```bash
npm test
```

### Blockchain Tests

```bash
cd blockchain
go test ./...
```

### Smart Contract Tests

```bash
cd smart-contracts
npx hardhat test
```

### Frontend Tests

```bash
cd web-app
npm test
```

## Troubleshooting

### Common Issues

**Port conflicts**: Change ports in respective config files
**Go modules**: Run `go mod download` if packages fail
**React Native**: Clear cache with `npm start -- --reset-cache`

## Next Steps

1. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
2. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
3. Check [API.md](API.md) for API documentation
