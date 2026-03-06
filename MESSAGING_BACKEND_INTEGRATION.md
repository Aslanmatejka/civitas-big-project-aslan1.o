# CIVITAS Messaging Backend Integration

This document explains the backend implementation for the CIVITAS messaging system and how to integrate it with the frontend.

## Backend Architecture

### Technology Stack

- **Node.js** + **Express**: REST API server
- **Socket.io**: Real-time bidirectional communication
- **MongoDB**: NoSQL database for persistence
- **Mongoose**: MongoDB ODM
- **Multer**: File upload handling

### Features Implemented

#### 1. Real-Time Messaging

- ✅ One-on-one messaging
- ✅ Group messaging
- ✅ Message delivery and read receipts
- ✅ Typing indicators
- ✅ Message reactions (emojis)
- ✅ Message editing and deletion
- ✅ Starred messages
- ✅ Message search

#### 2. Voice/Video Calls

- ✅ WebRTC signaling via Socket.io
- ✅ Call initiation and acceptance
- ✅ ICE candidate exchange
- ✅ Mute/unmute controls
- ✅ Video toggle
- ✅ Call busy handling

#### 3. User Management

- ✅ Wallet-based authentication
- ✅ User profiles with avatars
- ✅ Contact management
- ✅ User blocking
- ✅ Online/offline status
- ✅ Last seen timestamp
- ✅ Privacy settings

#### 4. Group Features

- ✅ Group creation
- ✅ Member management
- ✅ Admin controls
- ✅ Group info editing
- ✅ Leave group functionality

#### 5. Status Updates

- ✅ Post text/media status
- ✅ 24-hour auto-expiry
- ✅ View tracking
- ✅ Status privacy controls

#### 6. File Handling

- ✅ File upload (images, videos, documents)
- ✅ Voice message upload
- ✅ Profile picture upload
- ✅ File size limits and validation

## Setup Instructions

### Backend Setup

1. **Install MongoDB**

   ```powershell
   # Install MongoDB Community Edition
   # Download from: https://www.mongodb.com/try/download/community

   # Or use MongoDB Docker container
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Install Backend Dependencies**

   ```powershell
   cd messaging-backend
   npm install
   ```

3. **Configure Environment**

   ```powershell
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/civitas-messaging
   CLIENT_URL=http://localhost:5173
   ```

4. **Create Upload Directories**

   ```powershell
   New-Item -ItemType Directory -Force -Path uploads/profiles
   ```

5. **Start Backend Server**

   ```powershell
   npm run dev
   ```

   Server will run on http://localhost:3001

### Frontend Setup

1. **Install Socket.io Client**

   ```powershell
   cd web-app
   npm install socket.io-client axios
   ```

2. **Configure Environment**

   ```powershell
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_SERVER_URL=http://localhost:3001
   ```

3. **Import Services**
   ```javascript
   import socketService from "./services/socket";
   import { messagesApi, groupsApi, statusApi } from "./services/api";
   ```

## Frontend Integration Guide

### 1. Connect to Socket Server

```javascript
import socketService from "./services/socket";
import { useApp } from "../context/AppContext";

function MessagingPage() {
  const { walletAddress } = useApp();

  useEffect(() => {
    if (walletAddress) {
      // Connect to socket server
      socketService.connect(walletAddress);

      // Set up event listeners
      socketService.on("new_message", handleNewMessage);
      socketService.on("message_delivered", handleMessageDelivered);
      socketService.on("message_read", handleMessageRead);
      socketService.on("typing", handleTyping);
      socketService.on("user_online", handleUserOnline);
      socketService.on("user_offline", handleUserOffline);

      // Cleanup on unmount
      return () => {
        socketService.removeAllListeners("new_message");
        socketService.removeAllListeners("message_delivered");
        // ... remove other listeners
      };
    }
  }, [walletAddress]);
}
```

### 2. Send Messages

```javascript
const handleSendMessage = async (content, type = "text") => {
  const tempId = Date.now().toString();

  // Optimistic UI update
  const tempMessage = {
    id: tempId,
    sender: walletAddress,
    recipient: selectedContact.address,
    type,
    content,
    timestamp: new Date(),
    pending: true,
  };

  setMessages((prev) => [...prev, tempMessage]);

  // Send via socket
  socketService.sendMessage({
    tempId,
    recipient: selectedContact.address,
    groupId: null,
    type,
    content,
  });
};

// Listen for confirmation
socketService.on("message_sent", ({ tempId, messageId, timestamp }) => {
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === tempId
        ? { ...msg, id: messageId, timestamp, pending: false }
        : msg,
    ),
  );
});
```

### 3. Load Messages from Database

```javascript
import { messagesApi } from "./services/api";

const loadMessages = async () => {
  try {
    const response = await messagesApi.getMessages(
      walletAddress,
      selectedContact.address,
      null, // groupId
      50, // limit
    );

    setMessages(response.data.messages);
  } catch (error) {
    console.error("Error loading messages:", error);
  }
};

useEffect(() => {
  if (selectedContact) {
    loadMessages();
  }
}, [selectedContact]);
```

### 4. Create Groups

```javascript
import { groupsApi } from "./services/api";

const handleCreateGroup = async () => {
  try {
    const response = await groupsApi.createGroup(
      walletAddress,
      groupName,
      groupIcon,
      "",
      selectedMembers,
    );

    const newGroup = response.data.group;
    setGroups((prev) => [newGroup, ...prev]);
    setShowGroupModal(false);
  } catch (error) {
    console.error("Error creating group:", error);
  }
};
```

### 5. Post Status

```javascript
import { statusApi } from "./services/api";

const handlePostStatus = async () => {
  try {
    await statusApi.postStatus(
      walletAddress,
      userProfile.name,
      userProfile.avatar,
      "text",
      statusText,
      null,
      selectedBackground,
    );

    setShowStatusModal(false);
  } catch (error) {
    console.error("Error posting status:", error);
  }
};
```

### 6. Handle Voice/Video Calls

```javascript
const handleVoiceCall = (contact) => {
  // Create WebRTC offer
  const offer = createOffer(); // Implement WebRTC logic

  // Send call initiation
  socketService.initiateCall(contact.address, "voice", offer);

  // Update UI
  setCallState("calling");
  setCallType("voice");
};

// Listen for incoming calls
socketService.on("incoming_call", ({ from, callType, offer }) => {
  setIncomingCall({ from, callType, offer });
});

// Accept call
const acceptCall = async () => {
  const answer = await createAnswer(incomingCall.offer);
  socketService.acceptCall(incomingCall.from, answer);
  setCallState("active");
};
```

### 7. Upload Files

```javascript
import { messagesApi } from "./services/api";

const handleFileUpload = async (file) => {
  try {
    const response = await messagesApi.uploadFile(file);
    const { fileUrl, fileName, fileSize } = response.data;

    // Send message with file
    socketService.sendMessage({
      recipient: selectedContact.address,
      type: "file",
      fileUrl,
      fileName,
      fileSize,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};
```

### 8. Update Profile

```javascript
import { profileApi } from "./services/api";

const handleUpdateProfile = async () => {
  try {
    await profileApi.updateProfile(
      walletAddress,
      userName,
      userAbout,
      userAvatar,
    );

    setUserProfile({ name: userName, about: userAbout, avatar: userAvatar });
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

// Upload profile picture
const handlePictureUpload = async (file) => {
  try {
    const response = await profileApi.uploadProfilePicture(walletAddress, file);
    const pictureUrl = response.data.pictureUrl;

    setUserProfile((prev) => ({ ...prev, avatar: pictureUrl }));
  } catch (error) {
    console.error("Error uploading picture:", error);
  }
};
```

## Database Schema

### Messages Collection

```javascript
{
  messageId: String,
  sender: String,
  recipient: String,
  groupId: String,
  type: 'text' | 'voice' | 'file' | 'image' | 'video',
  content: String,
  fileUrl: String,
  reactions: [{ userId, emoji, timestamp }],
  read: Boolean,
  delivered: Boolean,
  starred: Boolean,
  deleted: Boolean,
  edited: Boolean,
  timestamp: Date
}
```

### Users Collection

```javascript
{
  walletAddress: String,
  name: String,
  about: String,
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date,
  contacts: [{ walletAddress, name, addedAt }],
  blockedUsers: [String],
  settings: { ... }
}
```

### Groups Collection

```javascript
{
  groupId: String,
  name: String,
  icon: String,
  creator: String,
  admins: [String],
  members: [{ walletAddress, name, joinedAt }],
  lastMessage: { content, sender, timestamp }
}
```

### Status Collection

```javascript
{
  statusId: String,
  userId: String,
  type: 'text' | 'image' | 'video',
  content: String,
  mediaUrl: String,
  backgroundColor: String,
  viewedBy: [{ walletAddress, viewedAt }],
  expiresAt: Date (24 hours),
  timestamp: Date
}
```

## API Endpoints Reference

See `messaging-backend/README.md` for complete API documentation.

## Running the Full Stack

1. **Start MongoDB**

   ```powershell
   # If using local MongoDB
   mongod

   # If using Docker
   docker start mongodb
   ```

2. **Start Backend**

   ```powershell
   cd messaging-backend
   npm run dev
   ```

   Backend runs on http://localhost:3001

3. **Start Frontend**

   ```powershell
   cd web-app
   npm start
   ```

   Frontend runs on http://localhost:5173

4. **Verify Connection**
   - Open browser to http://localhost:5173
   - Connect wallet
   - Navigate to messaging page
   - Check browser console: "✅ Connected to messaging server"
   - Check backend console: "🔌 New client connected"

## Testing

### Test Backend Health

```powershell
curl http://localhost:3001/health
```

### Test User Registration

```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"walletAddress":"0x123","name":"Test User"}'
```

### Test Socket Connection

Open browser console and check for connection messages.

## Production Deployment

### Backend

1. Deploy to cloud (AWS, Digital Ocean, Heroku)
2. Use managed MongoDB (MongoDB Atlas)
3. Set up HTTPS with SSL certificates
4. Configure CORS for production domain
5. Use PM2 or similar for process management
6. Set up monitoring and logging
7. Configure backups for MongoDB

### Frontend

1. Update `.env` with production URLs
2. Build: `npm run build`
3. Deploy to CDN or hosting service
4. Ensure CORS allows your domain

## Security Considerations

- ✅ Wallet-based authentication (no passwords)
- ⚠️ Add JWT tokens for API authentication
- ⚠️ Implement rate limiting
- ⚠️ Add input sanitization
- ⚠️ Use HTTPS in production
- ⚠️ Validate all file uploads
- ⚠️ Add CSRF protection
- ⚠️ Implement proper CORS configuration

## Next Steps

1. ✅ Backend server created
2. ✅ Database models defined
3. ✅ Socket.io handlers implemented
4. ✅ API routes created
5. ✅ Frontend services created
6. ⏳ Update MessagingPage.js to use backend
7. ⏳ Test all features end-to-end
8. ⏳ Add error handling and retries
9. ⏳ Implement offline support
10. ⏳ Add message encryption

## Troubleshooting

### Cannot connect to MongoDB

```powershell
# Check if MongoDB is running
Get-Process mongod

# Start MongoDB
mongod --dbpath C:\data\db
```

### Socket.io not connecting

- Check if backend is running on port 3001
- Verify CORS settings in server.js
- Check browser console for errors
- Verify `.env` has correct SERVER_URL

### File uploads failing

- Check uploads directory exists
- Verify file size limits
- Check multer configuration
- Ensure proper permissions on uploads folder

## Support

For issues or questions:

- Check backend logs
- Check browser console
- Review MongoDB logs
- Test API endpoints with curl/Postman

---

**Backend Status**: ✅ Complete and ready to use
**Frontend Integration**: ⏳ Services created, MessagingPage.js needs updates
