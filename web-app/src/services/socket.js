import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.walletAddress = null;
    this.listeners = new Map();
  }

  // Connect to server
  connect(walletAddress) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.walletAddress = walletAddress;
    
    this.socket = io(SERVER_URL, {
      auth: { walletAddress },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to messaging server');
      this.registerUser(walletAddress);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from messaging server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.walletAddress = null;
      this.listeners.clear();
    }
  }

  // Register user with wallet address
  registerUser(walletAddress) {
    if (this.socket?.connected) {
      this.socket.emit('register', walletAddress);
    }
  }

  // Send a message
  sendMessage(data) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
    }
  }

  // Edit a message
  editMessage(messageId, newContent) {
    if (this.socket?.connected) {
      this.socket.emit('edit_message', { messageId, newContent });
    }
  }

  // Delete a message
  deleteMessage(messageId) {
    if (this.socket?.connected) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  // Add reaction to message
  addReaction(messageId, emoji) {
    if (this.socket?.connected) {
      this.socket.emit('add_reaction', { messageId, emoji });
    }
  }

  // Toggle star on message
  toggleStar(messageId) {
    if (this.socket?.connected) {
      this.socket.emit('toggle_star', { messageId });
    }
  }

  // Send typing indicator
  sendTyping(to, isTyping) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { to, isTyping });
    }
  }

  // Mark messages as read
  markAsRead(from) {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { from });
    }
  }

  // Call functions
  initiateCall(to, callType, offer) {
    if (this.socket?.connected) {
      this.socket.emit('initiate_call', { to, callType, offer });
    }
  }

  acceptCall(from, answer) {
    if (this.socket?.connected) {
      this.socket.emit('accept_call', { from, answer });
    }
  }

  rejectCall(from) {
    if (this.socket?.connected) {
      this.socket.emit('reject_call', { from });
    }
  }

  endCall(to) {
    if (this.socket?.connected) {
      this.socket.emit('end_call', { to });
    }
  }

  sendICECandidate(to, candidate) {
    if (this.socket?.connected) {
      this.socket.emit('ice_candidate', { to, candidate });
    }
  }

  toggleMute(to, isMuted) {
    if (this.socket?.connected) {
      this.socket.emit('toggle_mute', { to, isMuted });
    }
  }

  toggleVideo(to, isVideoEnabled) {
    if (this.socket?.connected) {
      this.socket.emit('toggle_video', { to, isVideoEnabled });
    }
  }

  sendCallBusy(to) {
    if (this.socket?.connected) {
      this.socket.emit('call_busy', { to });
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
