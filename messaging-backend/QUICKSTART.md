# Quick Start Guide - CIVITAS Messaging Backend

## Prerequisites Installation

### 1. Install MongoDB (Windows)

**Option A: Install MongoDB Community Edition**

1. Download from: https://www.mongodb.com/try/download/community
2. Run installer (choose Complete installation)
3. Install as Windows Service
4. MongoDB Compass will be installed automatically

**Option B: Use MongoDB Docker (if you have Docker)**

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Verify MongoDB is Running

```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Or check process
Get-Process mongod
```

## Backend Setup

### 1. Navigate to Backend Directory

```powershell
cd "C:\Users\aslan\Desktop\Project CIVITAS\civitas\messaging-backend"
```

### 2. Install Dependencies

```powershell
npm install
```

This will install:

- express (web server)
- socket.io (real-time communication)
- mongoose (MongoDB driver)
- cors, helmet, compression (middleware)
- multer (file uploads)
- dotenv (environment variables)
- nodemon (development auto-reload)

### 3. Create Environment File

```powershell
Copy-Item .env.example .env
```

The `.env` file should contain:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/civitas-messaging
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MAX_FILE_SIZE=52428800
```

### 4. Create Upload Directories

```powershell
New-Item -ItemType Directory -Force -Path uploads
New-Item -ItemType Directory -Force -Path uploads/profiles
```

### 5. Start Backend Server

```powershell
npm run dev
```

You should see:

```
🚀 CIVITAS Messaging Backend Server
====================================
📡 Server running on port 3001
🌐 Client URL: http://localhost:5173
💾 MongoDB: mongodb://localhost:27017/civitas-messaging
✅ Connected to MongoDB
⏰ Started at: 2026-02-27T...
```

## Frontend Setup

### 1. Navigate to Web App Directory

```powershell
cd "C:\Users\aslan\Desktop\Project CIVITAS\civitas\web-app"
```

### 2. Install Socket.io Client

```powershell
npm install socket.io-client axios
```

### 3. Create Environment File

```powershell
Copy-Item .env.example .env
```

The `.env` file should contain:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SERVER_URL=http://localhost:3001
```

### 4. Start Frontend

```powershell
npm start
```

Frontend will run on http://localhost:5173

## Verify Everything is Working

### 1. Check Backend Health

Open browser or use PowerShell:

```powershell
Invoke-WebRequest http://localhost:3001/health | Select-Object -ExpandProperty Content
```

Should return:

```json
{
  "status": "OK",
  "timestamp": "2026-02-27T...",
  "mongodb": "Connected"
}
```

### 2. Test User Registration

```powershell
$body = @{
    walletAddress = "0x1234567890abcdef"
    name = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 3. Open Frontend

1. Navigate to http://localhost:5173
2. Connect your wallet
3. Go to messaging page
4. Open browser console (F12)
5. You should see: `✅ Connected to messaging server`

### 4. Check Backend Console

Backend should show:

```
🔌 New client connected: <socket-id>
✅ User registered: 0x...
```

## Running Commands Summary

### Every Time You Want to Start Development

**Terminal 1 - Backend:**

```powershell
cd "C:\Users\aslan\Desktop\Project CIVITAS\civitas\messaging-backend"
npm run dev
```

**Terminal 2 - Frontend:**

```powershell
cd "C:\Users\aslan\Desktop\Project CIVITAS\civitas\web-app"
npm start
```

**Terminal 3 - MongoDB (if not running as service):**

```powershell
mongod --dbpath C:\data\db
```

## Test the Features

### 1. Send a Message

1. Connect wallet in frontend
2. Navigate to messaging page
3. Select a contact
4. Type and send a message
5. Message should appear instantly
6. Check backend console - you'll see socket events
7. Check MongoDB - message will be persisted

### 2. Create a Group

1. Click the 👥 button in header
2. Choose icon, enter name
3. Select at least 2 members
4. Click Create
5. Group appears in Groups section

### 3. Post a Status

1. Click 📝 button in header
2. Type status text
3. Choose background color
4. Post
5. Status appears with green ring around avatar

### 4. Voice/Video Call

1. Click 📞 or 📹 button on a contact
2. Call interface appears
3. Socket events are sent to other user
4. (Full WebRTC needs to be implemented for actual video/audio)

## Troubleshooting

### MongoDB Not Connecting

```powershell
# Check if MongoDB is running
Get-Service MongoDB

# Start MongoDB service
Start-Service MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

### Backend Port Already in Use

```powershell
# Find process using port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess
netstat -ano | findstr :3001

# Kill the process (replace <PID> with actual number)
Stop-Process -Id <PID> -Force
```

### Socket.io Not Connecting

1. Verify backend is running on port 3001
2. Check `.env` has correct `VITE_SERVER_URL`
3. Check browser console for errors
4. Try disabling browser extensions
5. Clear browser cache

### File Upload Fails

```powershell
# Ensure uploads directory exists with proper permissions
New-Item -ItemType Directory -Force -Path uploads
New-Item -ItemType Directory -Force -Path uploads/profiles
```

### Cannot Install Dependencies

```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## Database Management

### View MongoDB Data

1. Open MongoDB Compass (installed with MongoDB)
2. Connect to: `mongodb://localhost:27017`
3. Database: `civitas-messaging`
4. Collections: messages, users, groups, statuses

### Clear All Data (Reset)

```powershell
# In MongoDB shell or Compass, drop database
mongo
use civitas-messaging
db.dropDatabase()
```

### Backup Database

```powershell
# Backup to folder
mongodump --db=civitas-messaging --out=C:\backup\

# Restore from backup
mongorestore --db=civitas-messaging C:\backup\civitas-messaging\
```

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` in `.env`
- [ ] Update `CLIENT_URL` to production domain
- [ ] Use MongoDB Atlas or managed MongoDB
- [ ] Set up HTTPS with SSL certificates
- [ ] Enable rate limiting
- [ ] Add authentication middleware
- [ ] Configure proper CORS
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure backups
- [ ] Use environment variables for secrets
- [ ] Add logging (Winston, Morgan)
- [ ] Use PM2 for process management
- [ ] Set up CI/CD pipeline

## Next Steps

1. ✅ Backend is ready to use
2. ✅ Frontend services are created
3. ⏳ Update MessagingPage.js to use the services
4. ⏳ Test all features end-to-end
5. ⏳ Add error handling in UI
6. ⏳ Implement retry logic
7. ⏳ Add loading states
8. ⏳ Implement offline support

## Useful Commands

```powershell
# Backend
npm run dev          # Start with auto-reload
npm start            # Start production mode
npm test             # Run tests

# Frontend
npm start            # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# MongoDB
mongod               # Start MongoDB
mongo                # Open MongoDB shell
mongosh              # Modern MongoDB shell

# View logs
Get-Content -Wait -Tail 50 logs\server.log
```

## Getting Help

If you encounter issues:

1. Check backend console for errors
2. Check browser console (F12)
3. Review MongoDB logs
4. Test API with curl or Postman
5. Check `messaging-backend/README.md` for detailed docs
6. Review `MESSAGING_BACKEND_INTEGRATION.md` for integration guide

---

**Status**: ✅ Backend fully implemented and ready to use!

The backend provides:

- Real-time messaging via Socket.io
- MongoDB persistence
- REST API for all operations
- File uploads
- Voice/video call signaling
- Group management
- Status updates
- User profiles

The frontend services (`api.js` and `socket.js`) are created and ready to be integrated into your React components.
