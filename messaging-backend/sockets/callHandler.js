module.exports = (io, socket) => {
  
  // Initiate a call (voice or video)
  socket.on('initiate_call', async (data) => {
    try {
      const { to, callType, offer } = data;
      
      console.log(`📞 Call initiated: ${socket.walletAddress} -> ${to} (${callType})`);

      // Send call request to recipient
      io.to(to).emit('incoming_call', {
        from: socket.walletAddress,
        callType,
        offer,
        timestamp: new Date()
      });

      // Confirm to caller
      socket.emit('call_initiated', {
        to,
        callType,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error initiating call:', error);
      socket.emit('call_error', { message: 'Failed to initiate call' });
    }
  });

  // Accept a call
  socket.on('accept_call', async (data) => {
    try {
      const { from, answer } = data;
      
      console.log(`✅ Call accepted: ${socket.walletAddress} accepted call from ${from}`);

      // Notify caller that call was accepted
      io.to(from).emit('call_accepted', {
        by: socket.walletAddress,
        answer,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error accepting call:', error);
      socket.emit('call_error', { message: 'Failed to accept call' });
    }
  });

  // Reject a call
  socket.on('reject_call', async (data) => {
    try {
      const { from } = data;
      
      console.log(`❌ Call rejected: ${socket.walletAddress} rejected call from ${from}`);

      // Notify caller that call was rejected
      io.to(from).emit('call_rejected', {
        by: socket.walletAddress,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  });

  // End a call
  socket.on('end_call', async (data) => {
    try {
      const { to } = data;
      
      console.log(`📴 Call ended: ${socket.walletAddress} ended call with ${to}`);

      // Notify other party that call ended
      io.to(to).emit('call_ended', {
        by: socket.walletAddress,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error ending call:', error);
    }
  });

  // WebRTC signaling - ICE candidates
  socket.on('ice_candidate', async (data) => {
    try {
      const { to, candidate } = data;

      // Forward ICE candidate to the other peer
      io.to(to).emit('ice_candidate', {
        from: socket.walletAddress,
        candidate
      });

    } catch (error) {
      console.error('Error sending ICE candidate:', error);
    }
  });

  // Toggle mute status
  socket.on('toggle_mute', async (data) => {
    try {
      const { to, isMuted } = data;

      // Notify other party about mute status
      io.to(to).emit('peer_muted', {
        from: socket.walletAddress,
        isMuted
      });

    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  });

  // Toggle video status
  socket.on('toggle_video', async (data) => {
    try {
      const { to, isVideoEnabled } = data;

      // Notify other party about video status
      io.to(to).emit('peer_video_toggled', {
        from: socket.walletAddress,
        isVideoEnabled
      });

    } catch (error) {
      console.error('Error toggling video:', error);
    }
  });

  // Handle call busy (user already in another call)
  socket.on('call_busy', async (data) => {
    try {
      const { to } = data;

      io.to(to).emit('call_busy', {
        from: socket.walletAddress
      });

    } catch (error) {
      console.error('Error sending busy signal:', error);
    }
  });

};
