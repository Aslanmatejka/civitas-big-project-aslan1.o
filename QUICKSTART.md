# CIVITAS Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

### Option 1: Smart Contracts Only (Fastest)

```powershell
# Navigate to smart contracts
cd smart-contracts

# Install dependencies
npm install

# Start local blockchain
npx hardhat node

# In a new terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat test
```

You should see contract addresses printed. Save these for later!

### Option 2: Web App

```powershell
# Navigate to web app
cd web-app

# Install dependencies
npm install

# Start development server
npm start
```

Open http://localhost:3000 in your browser.

### Option 3: Mobile App

```powershell
# Navigate to mobile app
cd mobile-app

# Install dependencies
npm install

# Start Expo
npm start

# Scan QR code with Expo Go app on your phone
# OR press 'i' for iOS simulator, 'a' for Android emulator
```

### Option 4: Full Stack (Advanced)

#### Terminal 1: Blockchain

```powershell
cd blockchain
go mod download
go run cmd/civitasd/main.go start
```

#### Terminal 2: Smart Contracts

```powershell
cd smart-contracts
npm install
npx hardhat node
# In another window
npx hardhat run scripts/deploy.js --network localhost
```

#### Terminal 3: Web App

```powershell
cd web-app
npm install
npm start
```

#### Terminal 4: Mobile App

```powershell
cd mobile-app
npm install
npm start
```

## 🔧 Troubleshooting

### "Module not found"

```powershell
npm install
# or
go mod download
```

### "Port already in use"

Kill the process using the port:

```powershell
# Windows
netstat -ano | findstr :8545
taskkill /PID <PID> /F
```

### Hardhat issues

```powershell
cd smart-contracts
rm -r node_modules cache artifacts
npm install
```

### React Native issues

```powershell
cd mobile-app
npm start -- --reset-cache
```

## 📖 Next Steps

1. Read [IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) for detailed roadmap
2. Review [ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the system
3. Check contract code in `smart-contracts/contracts/`
4. Explore mobile UI in `mobile-app/src/screens/`
5. Check web UI in `web-app/src/pages/`

## 💡 Tips

- Use VS Code with Solidity and React extensions
- Join Discord (when available) for help
- Check GitHub Issues for known problems
- Start with one component, don't try to run everything at once

## 🎯 What to Build First

1. **If you're a blockchain developer**: Start with `blockchain/` and implement Cosmos modules
2. **If you're a smart contract developer**: Enhance contracts in `smart-contracts/`
3. **If you're a frontend developer**: Connect web/mobile apps to contracts
4. **If you're full-stack**: Follow the Implementation Guide priorities

Happy building! 🎉
