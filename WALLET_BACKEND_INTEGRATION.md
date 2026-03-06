# Wallet Backend Integration - Quick Start Guide

## ✅ What Was Done

### Backend (messaging-backend/)

1. **Created Database Models**
   - `models/Wallet.js` - Wallet data (balance, tokens, NFTs, stats)
   - `models/Transaction.js` - Transaction history with full details

2. **Created API Routes** (`routes/wallet.js`)
   - `POST /api/wallet/connect` - Register wallet on backend
   - `GET /api/wallet/:address` - Get wallet details
   - `PUT /api/wallet/:address/balance` - Update balance
   - `GET /api/wallet/:address/transactions` - Get transaction history
   - `POST /api/wallet/:address/transactions` - Record new transaction
   - `GET /api/wallet/:address/nfts` - Get NFT collection
   - `GET /api/wallet/:address/tokens` - Get token balances
   - `POST /api/wallet/:address/disconnect` - Disconnect wallet

3. **Updated Server** (`server.js`)
   - Added wallet routes to Express server

### Frontend (web-app/)

1. **Updated API Service** (`src/services/api.js`)
   - Added `walletApi` with all wallet endpoints

2. **Updated AppContext** (`src/context/AppContext.js`)
   - **Wallet Connect**: Now registers with backend + connects Socket.io
   - **Wallet Disconnect**: Now notifies backend + disconnects Socket.io
   - **Send Transaction**: Now records transaction in backend database

3. **Updated WalletPage** (`src/pages/WalletPage.js`)
   - **Real Transaction History**: Fetches from backend instead of hardcoded
   - **Real NFT Collection**: Shows actual NFTs from backend
   - **Real Token Balances**: Displays all tokens from backend
   - **Loading States**: Shows loading while fetching data
   - **Empty States**: Friendly messages when no data
   - **Auto-Refresh**: Reloads transactions after sending

4. **Updated Styles** (`src/pages/WalletPage.css`)
   - Added loading and empty state styles
   - Added transaction status indicators (pending, failed)
   - Added NFT image support

## 🚀 How to Use

### 1. Start Backend Server

```powershell
# Navigate to backend directory
cd messaging-backend

# Install dependencies (first time only)
npm install

# Create .env file (first time only)
Copy-Item .env.example .env

# Create upload directories (first time only)
New-Item -ItemType Directory -Force -Path uploads/profiles

# Start MongoDB (if not already running)
mongod

# Start backend server
npm run dev
```

**Backend will run on:** http://localhost:3001

### 2. Start Frontend

```powershell
# Navigate to web app directory
cd web-app

# Install new dependencies (first time only)
npm install socket.io-client axios

# Create .env file if doesn't exist
Copy-Item .env.example .env

# Start frontend
npm start
```

**Frontend will run on:** http://localhost:5173

### 3. Test the Integration

1. **Open browser** to http://localhost:5173
2. **Connect your wallet** (MetaMask or similar)
3. **Check console logs**:
   - Should see: "✅ Wallet connected: 0x..."
   - Should see: "✅ Wallet registered with backend"
   - Should see: "✅ Connected to messaging server"

4. **Navigate to Wallet Page** (/wallet)
   - View your balance
   - Click "Transactions" tab to see history
   - Click "NFTs" tab to see collection

5. **Send a Transaction**:
   - Click "Send" button
   - Enter recipient address and amount
   - Confirm transaction
   - Transaction will appear in history

## 🎯 What Works Now

### ✅ Automatic Backend Registration

When you connect your wallet, the app automatically:

- Registers wallet address in backend database
- Creates user profile for messaging system
- Connects to Socket.io for real-time messaging
- Updates online status

### ✅ Transaction Recording

When you send tokens, the app automatically:

- Records transaction in backend database
- Includes all details (hash, amount, status, gas, etc.)
- Updates sender and recipient wallet stats
- Refreshes transaction history

### ✅ Transaction History

The Wallet Page now shows:

- Real transactions from backend
- Direction indicators (sent ↑ / received ↓)
- Transaction status (pending, confirmed, failed)
- Formatted timestamps ("2 hours ago")
- Formatted addresses (0x1234...5678)
- Token symbols and amounts

### ✅ Multi-Token Support

The Assets tab displays:

- Native CIV token
- All other tokens in your wallet
- Real balances from backend
- USD valuations

### ✅ NFT Collection

The NFTs tab shows:

- Your actual NFT collection
- NFT images or emoji placeholders
- NFT names and descriptions
- Metadata support

### ✅ Graceful Degradation

If backend is offline:

- App still works (just shows empty states)
- Console warnings instead of errors
- Can still connect wallet and use blockchain features

## 📊 Data Flow

### Wallet Connection Flow

```
1. User clicks "Connect Wallet"
   ↓
2. MetaMask/Web3 wallet approves
   ↓
3. AppContext.connectWallet() runs:
   - Gets wallet address
   - Fetches balance from blockchain
   - Calls walletApi.connectWallet()
   - Registers with backend
   - Connects Socket.io
   ↓
4. Backend creates/updates:
   - Wallet record in database
   - User record for messaging
   - Sets online status
   ↓
5. Frontend updates UI:
   - Shows wallet address
   - Displays balance
   - Enables features
```

### Transaction Flow

```
1. User clicks "Send" and submits form
   ↓
2. AppContext.sendCIV() runs:
   - Calls contractService.transferCIV()
   - Sends blockchain transaction
   ↓
3. Transaction confirmed on blockchain
   ↓
4. Calls walletApi.recordTransaction()
   - Stores in backend database
   - Updates wallet stats
   ↓
5. Frontend refreshes:
   - Reloads transaction history
   - Shows new transaction
   - Updates balance
```

### Data Display Flow

```
1. User navigates to Wallet Page
   ↓
2. User clicks "Transactions" tab
   ↓
3. WalletPage.loadTransactions() runs:
   - Calls walletApi.getTransactions()
   - Fetches from backend database
   ↓
4. Backend returns:
   - Transaction array
   - Enriched with 'direction' field
   - Sorted by timestamp (newest first)
   ↓
5. Frontend displays:
   - Maps over transactions
   - Shows formatted data
   - Applies styling based on direction
```

## 🔧 Configuration

### Environment Variables

**Backend** (messaging-backend/.env):

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/civitas-messaging
CLIENT_URL=http://localhost:5173
```

**Frontend** (web-app/.env):

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SERVER_URL=http://localhost:3001
```

## 🧪 Testing

### Test Backend Health

```powershell
curl http://localhost:3001/health
```

### Test Wallet Registration

```powershell
curl -X POST http://localhost:3001/api/wallet/connect `
  -H "Content-Type: application/json" `
  -d '{"address":"0x123...","balance":"100","name":"Test User"}'
```

### Test Get Transactions

```powershell
curl http://localhost:3001/api/wallet/0x123.../transactions
```

## 📝 Database Schema

### Wallet Collection

```javascript
{
  address: String (unique),
  balance: String,
  balanceUSD: String,
  totalSent: String,
  totalReceived: String,
  transactionCount: Number,
  nfts: Array,
  tokens: Array,
  reputation: Number,
  lastActive: Date
}
```

### Transaction Collection

```javascript
{
  txHash: String (unique),
  from: String,
  to: String,
  amount: String,
  tokenSymbol: String,
  type: 'send' | 'receive' | 'stake' | 'unstake' | 'reward' | 'swap',
  status: 'pending' | 'confirmed' | 'failed',
  blockNumber: Number,
  gasUsed: String,
  gasPrice: String,
  timestamp: Date
}
```

## 🐛 Troubleshooting

### Backend not connecting

- Make sure MongoDB is running: `mongod`
- Check backend is running on port 3001
- Verify .env file exists with correct settings

### Transactions not showing

- Check browser console for errors
- Verify wallet address matches
- Try clicking "Transactions" tab to trigger reload

### Socket.io not connecting

- Check backend logs for connection messages
- Verify CORS settings in server.js
- Check firewall isn't blocking port 3001

### "Backend may be offline" warnings

- This is normal if backend isn't running
- App will still work, just without backend features
- Start backend to enable full functionality

## 🎉 Success Indicators

When everything is working correctly, you should see:

**Browser Console:**

```
✅ App initialized
✅ Wallet connected: 0x...
✅ Wallet registered with backend
✅ Connected to messaging server
```

**Backend Console:**

```
✅ Connected to MongoDB
🔌 New client connected: xyz123
✅ User registered: 0x...
✅ New wallet registered: 0x...
```

**Wallet Page:**

- Balance displays correctly
- Transactions tab loads (even if empty)
- NFTs tab loads (even if empty)
- Assets tab shows tokens

## 🔄 What Happens Next

With wallet connected to backend, you now have:

- ✅ Transaction history tracking
- ✅ Multi-wallet support
- ✅ Real-time messaging (Socket.io connected)
- ✅ User profiles synced
- ✅ Online/offline status
- ✅ Foundation for more features

You can now navigate to the Messaging page and start chatting with other connected wallets!

## 📚 Related Documentation

- [MESSAGING_BACKEND_INTEGRATION.md](./MESSAGING_BACKEND_INTEGRATION.md) - Messaging system integration
- [messaging-backend/README.md](./messaging-backend/README.md) - Complete backend API docs

---

**Status**: ✅ Wallet backend integration complete and ready to use!
