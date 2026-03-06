# Backend Integration - Dependencies & Setup

## 📦 Required Dependencies

Add these to your `mobile-app/package.json`:

```json
{
  "dependencies": {
    "ethers": "^6.10.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "expo-file-system": "~16.0.0",
    "expo-crypto": "~13.0.0",
    "expo-document-picker": "~12.0.0",
    "buffer": "^6.0.3"
  }
}
```

## 🔧 Installation Commands

```bash
# Navigate to mobile-app directory
cd mobile-app

# Install new dependencies
npm install ethers@^6.10.0
npm install @react-native-async-storage/async-storage
npm install expo-file-system expo-crypto expo-document-picker
npm install buffer

# Or install all at once
npm install ethers@^6.10.0 @react-native-async-storage/async-storage expo-file-system expo-crypto expo-document-picker buffer
```

## 📂 Project Structure After Integration

```
mobile-app/
├── src/
│   ├── screens/               # UI screens (existing)
│   │   ├── WalletScreen.js
│   │   ├── IdentityScreen.js
│   │   └── ... (14 more screens)
│   │
│   ├── services/              # ✨ NEW: Backend services
│   │   ├── web3Service.js     # Web3 provider & wallet
│   │   ├── contractService.js # Smart contract interactions
│   │   ├── ipfsService.js     # IPFS/Filecoin storage
│   │   ├── blockchainService.js # Network queries & analytics
│   │   └── index.js           # Service exports
│   │
│   ├── context/               # ✨ NEW: Global state
│   │   └── AppContext.js      # App-wide state provider
│   │
│   ├── hooks/                 # ✨ NEW: Custom hooks
│   │   └── useServices.js     # Services hook
│   │
│   └── BACKEND_INTEGRATION_GUIDE.js  # ✨ NEW: Integration examples
│
├── App.js                     # Wrap with AppProvider
├── App.example.js             # ✨ NEW: Example App.js with context
└── package.json               # Add new dependencies

```

## 🚀 Quick Start Integration

### Step 1: Update App.js

Replace your current `App.js` with the pattern from `App.example.js`:

```javascript
import { AppProvider } from "./src/context/AppContext";

export default function App() {
  return <AppProvider>{/* Your existing navigation */}</AppProvider>;
}
```

### Step 2: Update a Screen (Example: WalletScreen)

```javascript
// Add these imports
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

const WalletScreen = () => {
  // Remove mock state
  // const [balance, setBalance] = useState('1,247.50'); ❌

  // Use real data instead
  const { wallet, balance, isConnected } = useApp(); ✅
  const { sendTransaction, refresh } = useServices(); ✅

  // Use real functions
  const handleSend = async (to, amount) => {
    try {
      await sendTransaction(to, amount);
      await refresh(); // Refresh balance
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>{balance} CIV</Text>
      {/* Display real balance from blockchain */}
    </View>
  );
};
```

### Step 3: Configure Contract Addresses

Update `src/services/contractService.js` with deployed contract addresses:

```javascript
const CONTRACT_ADDRESSES = {
  CIV_TOKEN: "0xYourDeployedTokenAddress",
  DID_REGISTRY: "0xYourDeployedDIDAddress",
  GOVERNANCE: "0xYourDeployedGovernanceAddress",
  WALLET_FACTORY: "0xYourDeployedWalletFactoryAddress",
};
```

### Step 4: Configure RPC Endpoints

Update `src/services/web3Service.js` with your RPC URLs:

```javascript
const CIVITAS_CHAIN_CONFIG = {
  chainId: "0x434956",
  chainName: "CIVITAS Network",
  rpcUrls: ["https://your-rpc-endpoint.com"], // 👈 Update this
  blockExplorerUrls: ["https://your-explorer.com"],
};
```

## 🧪 Testing

### Local Development (Mock Mode)

The services will automatically fall back to mock data when blockchain is unavailable:

```bash
npm start
```

### Testnet Testing

1. Deploy contracts to testnet (Sepolia, Mumbai, etc.)
2. Update CONTRACT_ADDRESSES in contractService.js
3. Update RPC URLs in web3Service.js
4. Fund test wallets with testnet tokens
5. Run the app and test all features

### Mainnet Deployment

1. Deploy contracts to CIVITAS mainnet
2. Update all contract addresses to production addresses
3. Enable proper wallet encryption (implement biometric/PIN encryption)
4. Set up production IPFS gateway
5. Configure production RPC endpoints
6. Add error tracking (Sentry, etc.)
7. Test thoroughly before release

## 🔐 Security Checklist

- [ ] Replace simple XOR encryption in ipfsService with AES-256-GCM
- [ ] Implement biometric/PIN encryption for stored wallets
- [ ] Use secure storage (Keychain/Keystore) instead of AsyncStorage
- [ ] Validate all user inputs before blockchain transactions
- [ ] Implement rate limiting for API calls
- [ ] Add transaction confirmation dialogs
- [ ] Sanitize all IPFS uploads
- [ ] Implement proper error handling everywhere
- [ ] Add logging and monitoring
- [ ] Use environment variables for sensitive config

## 📖 Available Services

### Web3 Service

- `web3Service.initialize()` - Initialize Web3 provider
- `web3Service.createWallet()` - Generate new wallet
- `web3Service.connectWallet(mnemonic)` - Connect existing wallet
- `web3Service.getBalance(address)` - Get native balance
- `web3Service.sendTransaction(to, amount)` - Send native tokens

### Contract Service

- `contractService.getCIVBalance(address)` - Get CIV token balance
- `contractService.transferCIV(to, amount)` - Transfer CIV tokens
- `contractService.createDID(didData)` - Create DID on-chain
- `contractService.issueCredential()` - Issue verifiable credential
- `contractService.createProposal()` - Create governance proposal
- `contractService.voteOnProposal()` - Vote on proposal

### IPFS Service

- `ipfsService.uploadFile(uri, metadata)` - Upload file to IPFS
- `ipfsService.downloadFile(cid, key)` - Download from IPFS
- `ipfsService.uploadData(data)` - Upload JSON data
- `ipfsService.pinFile(cid)` - Pin file for persistence

### Blockchain Service

- `blockchainService.getNetworkStats()` - Get network statistics
- `blockchainService.getValidators()` - Get validator list
- `blockchainService.getUserAnalytics()` - Get user analytics
- `blockchainService.getGlobalAnalytics()` - Get global analytics
- `blockchainService.getCarbonOffsetData()` - Get carbon stats

## 🎯 Integration Progress

Track your integration progress:

- [ ] Install dependencies
- [ ] Wrap App.js with AppProvider
- [ ] Update WalletScreen with real data
- [ ] Update IdentityScreen with DID operations
- [ ] Update GovernanceScreen with voting
- [ ] Update StorageScreen with IPFS
- [ ] Update MessagingScreen with encryption
- [ ] Update MarketplaceScreen with contracts
- [ ] Update NodeScreen with validator data
- [ ] Update AnalyticsScreen with real stats
- [ ] Update SettingsScreen with mesh network
- [ ] Test all screens end-to-end
- [ ] Deploy to testnet
- [ ] Production testing
- [ ] Launch! 🚀

## 💡 Tips

1. **Start with one screen**: Integrate WalletScreen first, then expand
2. **Keep mock data initially**: Services fall back to mock data automatically
3. **Test incrementally**: Test each screen integration separately
4. **Handle errors gracefully**: Always use try/catch blocks
5. **Add loading states**: Blockchain operations take time
6. **Implement offline mode**: Check `isOnline` from useApp()
7. **Use TypeScript**: Consider converting to TypeScript for better type safety

## 🐛 Troubleshooting

**Problem**: "Web3 provider not initialized"

- **Solution**: Make sure app is wrapped with AppProvider

**Problem**: "Contract interaction failed"

- **Solution**: Check CONTRACT_ADDRESSES are correct and contracts are deployed

**Problem**: "IPFS upload failed"

- **Solution**: Check IPFS gateway URL and network connection

**Problem**: "Transaction failed"

- **Solution**: Ensure wallet has sufficient balance for gas + amount

**Problem**: "App crashes on startup"

- **Solution**: Check all dependencies are installed: `npm install`

## 📚 Additional Resources

- [ethers.js Documentation](https://docs.ethers.org/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [React Context API](https://react.dev/reference/react/useContext)
- [Expo AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [CIVITAS Project Document](../document%20of%20the%20project)

## ✅ Next Steps After Backend Integration

1. **State Management Enhancement**: Consider Redux if app complexity grows
2. **Caching Strategy**: Implement proper caching for blockchain data
3. **Offline Queue**: Build transaction queue for offline operations
4. **Push Notifications**: Add notifications for transaction confirmations
5. **Deep Linking**: Enable deep links for payments, invoices, etc.
6. **Biometric Auth**: Integrate TouchID/FaceID for secure access
7. **Testing Suite**: Write unit and integration tests
8. **Performance Optimization**: Optimize re-renders and API calls
9. **Analytics**: Add analytics tracking (Mixpanel, Amplitude)
10. **Documentation**: Document all API endpoints and services

---

**Questions?** Check `BACKEND_INTEGRATION_GUIDE.js` for detailed code examples!
