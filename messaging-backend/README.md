# CIVITAS Messaging Backend

Real-time messaging backend for CIVITAS platform with Socket.io, Express, and MongoDB.

## Features

- 🔄 Real-time messaging with Socket.io
- 📱 One-on-one and group chats
- 📞 Voice and video call signaling
- 📝 Message editing and deletion
- ⭐ Message reactions and starred messages
- 📊 Read receipts and typing indicators
- 👤 User profiles with custom avatars
- 📢 Status updates (24-hour expiry)
- 📁 File upload support (images, videos, documents)
- 🔍 Message search functionality
- 🔐 Wallet-based authentication

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm >= 9.0.0

## Installation

1. Install dependencies:

```bash
cd messaging-backend
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/civitas-messaging
CLIENT_URL=http://localhost:5173
```

4. Create upload directories:

```bash
mkdir -p uploads/profiles
```

5. Start MongoDB (if not already running):

```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
```

## Running the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register/login user
- `POST /api/auth/logout` - Logout user

### Messages

- `GET /api/messages` - Get messages (paginated)
- `GET /api/messages/unread-count` - Get unread count
- `GET /api/messages/starred` - Get starred messages
- `GET /api/messages/search` - Search messages
- `POST /api/messages/upload` - Upload file

### Contacts

- `GET /api/contacts` - Get user's contacts
- `POST /api/contacts/add` - Add contact
- `DELETE /api/contacts/:address` - Remove contact
- `POST /api/contacts/block` - Block user

### Groups

- `GET /api/groups` - Get user's groups
- `GET /api/groups/:groupId` - Get group details
- `POST /api/groups/create` - Create group
- `PUT /api/groups/:groupId` - Update group info
- `POST /api/groups/:groupId/members` - Add members
- `DELETE /api/groups/:groupId/members/:address` - Remove member
- `POST /api/groups/:groupId/leave` - Leave group

### Profile

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/upload-picture` - Upload profile picture
- `PUT /api/profile/settings` - Update settings

### Status

- `GET /api/status` - Get statuses
- `POST /api/status` - Post new status
- `POST /api/status/:statusId/view` - Mark as viewed
- `DELETE /api/status/:statusId` - Delete status

## Socket.io Events

### Client → Server

#### Connection

- `register` - Register user with wallet address
- `disconnect` - User disconnected

#### Messages

- `send_message` - Send new message
- `edit_message` - Edit existing message
- `delete_message` - Delete message
- `add_reaction` - Add emoji reaction
- `toggle_star` - Star/unstar message
- `typing` - Send typing indicator
- `mark_read` - Mark messages as read

#### Calls

- `initiate_call` - Start voice/video call
- `accept_call` - Accept incoming call
- `reject_call` - Reject incoming call
- `end_call` - End active call
- `ice_candidate` - Exchange ICE candidates
- `toggle_mute` - Toggle mute status
- `toggle_video` - Toggle video status
- `call_busy` - User busy signal

### Server → Client

#### Messages

- `new_message` - Incoming message
- `message_sent` - Confirm message sent
- `message_delivered` - Message delivered
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `message_starred` - Message starred/unstarred
- `reaction_added` - Reaction added to message
- `messages_read` - Messages marked as read
- `message_error` - Error sending message

#### Presence

- `user_online` - User came online
- `user_offline` - User went offline
- `typing` - User typing indicator

#### Calls

- `incoming_call` - Incoming call notification
- `call_initiated` - Call started
- `call_accepted` - Call accepted
- `call_rejected` - Call rejected
- `call_ended` - Call ended
- `call_busy` - Recipient busy
- `ice_candidate` - ICE candidate received
- `peer_muted` - Peer muted/unmuted
- `peer_video_toggled` - Peer video on/off

## Project Structure

```
messaging-backend/
├── models/
│   ├── Message.js      # Message schema
│   ├── User.js         # User/profile schema
│   ├── Group.js        # Group schema
│   └── Status.js       # Status schema
├── routes/
│   ├── auth.js         # Authentication routes
│   ├── messages.js     # Message routes
│   ├── contacts.js     # Contact management
│   ├── groups.js       # Group management
│   ├── profile.js      # Profile management
│   └── status.js       # Status routes
├── sockets/
│   ├── messageHandler.js  # Message socket handlers
│   └── callHandler.js     # Call socket handlers
├── uploads/            # File uploads directory
├── .env.example        # Environment template
├── .gitignore
├── package.json
├── README.md
└── server.js           # Main server file
```

## Database Schema

### Message

- messageId, sender, recipient, groupId
- type (text, voice, file, image, video)
- content, fileUrl, fileName, fileSize, duration
- reactions, read, delivered, starred
- edited, deleted, timestamp

### User

- walletAddress (unique)
- name, about, avatar
- isOnline, lastSeen
- contacts, blockedUsers, settings

### Group

- groupId, name, icon, description
- creator, admins, members
- settings, lastMessage

### Status

- statusId, userId, userName, userAvatar
- type (text, image, video)
- content, mediaUrl, backgroundColor
- viewedBy, expiresAt (24 hours)

## Development

Run with nodemon for auto-reload:

```bash
npm run dev
```

Test API endpoints:

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x123...", "name": "John Doe"}'
```

## Production Deployment

1. Set environment variables:

```bash
export NODE_ENV=production
export MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/civitas
export CLIENT_URL=https://your-domain.com
```

2. Use process manager (PM2):

```bash
npm install -g pm2
pm2 start server.js --name civitas-messaging
pm2 save
pm2 startup
```

## Security Considerations

- Change JWT_SECRET in production
- Use HTTPS in production
- Configure CORS properly
- Implement rate limiting
- Add authentication middleware
- Sanitize user inputs
- Use environment variables for sensitive data

## License

MIT
