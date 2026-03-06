# XMTP Quick Start Guide

## 🚀 Testing XMTP Messaging in CIVITAS

Follow these steps to test the new decentralized messaging system.

---

## Prerequisites

✅ MetaMask or another Web3 wallet installed  
✅ Test Ether (if on testnet)  
✅ Two different wallet addresses (to test messaging)

---

## Step 1: Start the Application

```bash
# Terminal 1: Start web app
cd web-app
npm start

# Application will open at http://localhost:3000 (or auto-assigned port)
```

---

## Step 2: Connect Your Wallet

1. Click **"Connect Wallet"** button in the app
2. MetaMask will prompt you to connect
3. Select an account and click **Connect**

---

## Step 3: Enable XMTP (First Time Only)

When you navigate to the Messaging page for the first time:

1. **XMTP will prompt you to sign a message**:

   ```
   "XMTP : Create Identity

   Enable XMTP identity for:
   [Your Wallet Address]

   This signature will be used to create your XMTP identity.
   For more info: https://xmtp.org/signatures"
   ```

2. **Click "Sign" in MetaMask**
   - This is a **free operation** (no gas fee)
   - Creates your XMTP encryption keys
   - Only needed once per wallet

3. **Wait for initialization** (~5-10 seconds)
   - You'll see: "✅ XMTP messaging initialized" in console

---

## Step 4: Add a Contact

### Option A: Add by Wallet Address

1. Go to **Messaging** page
2. Click **"Add Contact"** or **"New Message"**
3. Enter recipient's **Ethereum address**: `0x742d...3f9A`
4. Enter a **name** (optional): "Alice"
5. Click **Add**

### Option B: Test with Second Wallet

In a **new incognito window**:

1. Open the app again
2. Connect with a **different wallet**
3. Enable XMTP for that wallet
4. Each wallet can message the other

---

## Step 5: Send Your First Message

1. **Select the contact** from the list
2. **Type a message**: "Hello from CIVITAS!"
3. **Click Send** or press **Enter**

### What Happens:

```
Your Device:
  1. Message encrypted with recipient's public key
  2. Sent to XMTP network (decentralized)
  3. ✅ "Message sent via XMTP" in console

XMTP Network:
  - Stores encrypted message
  - Routes to recipient

Recipient's Device:
  - Streams new message from XMTP network
  - Decrypts with private key
  - Displays in UI
```

---

## Step 6: Test File Sharing

1. **Click the 📎 attachment icon**
2. **Select a file** (image, document, etc.)
3. **Click Send**

### What Happens:

```
1. File uploaded to IPFS (decentralized storage)
   → Returns CID: QmX4z...

2. File metadata sent via XMTP:
   {
     type: 'file',
     name: 'photo.jpg',
     cid: 'QmX4z...',
     url: 'https://ipfs.io/ipfs/QmX4z...'
   }

3. Recipient sees: 📎 photo.jpg
4. Click to download from IPFS
```

---

## Step 7: Verify Decentralization

### Check Browser Console:

Open DevTools (F12) and look for:

```javascript
✅ Web3 initialized: { chainId: '31337' }
✅ Wallet connected: 0x1234...
✅ XMTP client initialized for: 0x1234...
✅ Streaming all messages
✅ Message sent via XMTP
```

### Verify No Backend Needed:

1. **Stop the messaging-backend server** (if running)
2. **Messaging still works!** 🎉
3. XMTP messages go **directly peer-to-peer**
4. No MongoDB, no Socket.io server needed

---

## Step 8: Test Offline Mode

1. **Disconnect internet** (airplane mode or network settings)
2. **Type a message** and click Send
3. You'll see: "Message queued for offline"
4. **Reconnect internet**
5. Message automatically sends from queue

Check console:

```javascript
✅ Synced queued message: queued-1709139264
```

---

## Common Scenarios

### Scenario 1: Messaging a New User

**Problem**: "Peer not on XMTP network"

**Solution**:

- Recipient must connect their wallet to CIVITAS
- They must sign the XMTP identity message
- Then they can receive messages

### Scenario 2: Messages Not Appearing

**Check**:

1. Is XMTP initialized? `xmtpService.isReady()` in console
2. Is recipient's address correct?
3. Did recipient enable XMTP?
4. Check console for errors

### Scenario 3: Slow Message Delivery

- XMTP delivery: **1-3 seconds** normally
- If slower, check:
  - Internet connection
  - XMTP network status
  - Browser console for errors

---

## Testing Checklist

- [ ] Connect wallet
- [ ] Sign XMTP message (first time)
- [ ] See "XMTP initialized" in console
- [ ] Add contact by address
- [ ] Send text message
- [ ] Receive message (other wallet)
- [ ] Send file attachment
- [ ] Download file from IPFS
- [ ] Test offline queue:
  - [ ] Go offline
  - [ ] Queue message
  - [ ] Go online
  - [ ] Message sends automatically
- [ ] Verify no backend needed:
  - [ ] Stop messaging-backend
  - [ ] Messaging still works

---

## Advanced Testing

### 1. Test with Multiple Contacts

Add 3-5 different wallet addresses:

- Send messages to each
- Switch between conversations
- Verify message history loads correctly

### 2. Test Message Persistence

1. Send messages
2. Close browser / clear cache
3. Reopen and reconnect wallet
4. **Messages still there!** (stored on XMTP network)

### 3. Test Cross-Device

Same wallet on different devices:

1. Connect same wallet on phone (via mobile app)
2. Connect same wallet on laptop (via web)
3. Messages sync across devices 🔄

### 4. Test Interoperability

XMTP messages work across apps:

1. Send message from CIVITAS
2. Receive in another XMTP app (e.g., xmtp.chat)
3. Reply from other app
4. Reply appears in CIVITAS ✨

---

## Console Commands

Test XMTP directly from browser console:

```javascript
// Check if XMTP is ready
xmtpService.isReady();
// → true

// Check your XMTP address
xmtpService.getAddress();
// → "0x1234..."

// Check if peer can receive messages
await xmtpService.canMessage("0x742d...3f9A");
// → true/false

// List all conversations
await xmtpService.listConversations();
// → [Conversation, Conversation, ...]

// Send a test message
await xmtpService.sendMessage("0x742d...3f9A", "Test message", "text/plain");
// → { id: "...", status: "sent", ... }
```

---

## Troubleshooting

### "XMTP not initialized" Error

**Fix**:

1. Disconnect wallet
2. Reconnect wallet
3. Sign XMTP message again
4. Check console for errors

### "Cannot read properties of null" Error

**Fix**:

- Ensure wallet is connected first
- Check that Web3 provider is available
- Try refreshing page

### Messages Not Sending

**Check**:

1. Is wallet connected? ✅
2. Is XMTP initialized? ✅
3. Is recipient XMTP-enabled? ✅
4. Check browser console for specific error
5. Try with a different recipient

### Slow Performance

**Optimize**:

1. Clear browser cache
2. Disable browser extensions
3. Check internet speed
4. Try different XMTP environment (dev vs production)

---

## Understanding the Console Logs

### Good Logs (Normal Operation):

```javascript
✅ App initialized
✅ Wallet connected: 0x1234...
✅ XMTP messaging initialized
✅ Streaming all messages
✅ Message sent via XMTP
✅ New message: { id: "...", content: "Hello!" }
```

### Warning Logs (Non-Critical):

```javascript
⚠️ XMTP initialization failed: User rejected signature
⚠️ Backend registration failed (backend may be offline)
⚠️ Peer 0x742d... is not registered on XMTP network
```

### Error Logs (Need Attention):

```javascript
❌ Error sending message: Network error
❌ Failed to sync message: queued-1234
❌ XMTP client not initialized
```

---

## Security Notes

### What Gets Encrypted:

✅ Message content  
✅ File names (in metadata)  
✅ All message data

### What's Visible on Network:

- Sender wallet address
- Recipient wallet address
- Timestamp
- Message size (encrypted)

### Best Practices:

1. **Don't share private keys** (ever!)
2. **Use hardware wallet** for production
3. **Verify recipient address** before sending
4. **Don't send sensitive data** in file names (they're visible in metadata)

---

## Next Steps

After testing XMTP:

1. **Test with real users** (friends, community)
2. **Report bugs** (if any) with console logs
3. **Suggest improvements** (UX, features)
4. **Explore XMTP docs**: https://xmtp.org/docs

---

## Support

- **XMTP Discord**: https://discord.gg/xmtp
- **CIVITAS Issues**: (create GitHub issue)
- **Documentation**: See `XMTP_INTEGRATION.md`

---

**Happy Decentralized Messaging! 🎉**
