/**
 * Real-time message handler using in-memory store (no MongoDB).
 */
const store = require('../services/store');
const { v4: uuidv4 } = require('uuid');

module.exports = (io, socket) => {

  // Send a new message
  socket.on('send_message', async (data) => {
    try {
      const {
        recipient,
        groupId,
        type,
        content,
        fileUrl,
        fileName,
        fileSize,
        duration,
        replyTo
      } = data;

      const message = {
        messageId: uuidv4(),
        sender: socket.walletAddress,
        recipient: groupId ? null : recipient,
        groupId: groupId || null,
        type: type || 'text',
        content,
        fileUrl,
        fileName,
        fileSize,
        duration,
        replyTo,
        timestamp: new Date().toISOString(),
        delivered: false,
        read: false,
        edited: false,
        deleted: false,
        starred: false,
        reactions: []
      };

      // Persist to in-memory store
      store.addMessage(message);

      const messageData = {
        id: message.messageId,
        sender: socket.walletAddress,
        recipient: recipient || groupId,
        type: message.type,
        content,
        fileUrl,
        fileName,
        fileSize,
        duration,
        replyTo,
        timestamp: message.timestamp,
        delivered: true
      };

      if (groupId) {
        // Send to all group members
        const group = store.getGroup(groupId);
        if (group) {
          (group.members || []).forEach(member => {
            const addr = typeof member === 'string' ? member : member.walletAddress;
            if (addr !== socket.walletAddress) {
              io.to(addr).emit('new_message', messageData);
            }
          });
          group.lastMessage = {
            content: content || `${type} message`,
            sender: socket.walletAddress,
            timestamp: message.timestamp
          };
        }
      } else {
        io.to(recipient).emit('new_message', messageData);

        // Mark delivered if recipient is online
        const recipientSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.walletAddress === recipient);

        if (recipientSocket) {
          message.delivered = true;
          message.deliveredAt = new Date().toISOString();
          socket.emit('message_delivered', {
            messageId: message.messageId,
            deliveredAt: message.deliveredAt
          });
        }
      }

      socket.emit('message_sent', {
        tempId: data.tempId,
        messageId: message.messageId,
        timestamp: message.timestamp
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', {
        tempId: data.tempId,
        error: 'Failed to send message'
      });
    }
  });

  // Edit a message
  socket.on('edit_message', (data) => {
    try {
      const { messageId, newContent } = data;
      const message = store.getMessage(messageId);

      if (!message || message.sender !== socket.walletAddress) {
        socket.emit('error', { message: 'Message not found or unauthorized' });
        return;
      }

      message.content = newContent;
      message.edited = true;
      message.editedAt = new Date().toISOString();

      const updateData = {
        messageId,
        content: newContent,
        edited: true,
        editedAt: message.editedAt
      };

      if (message.groupId) {
        io.to(message.groupId).emit('message_edited', updateData);
      } else {
        io.to(message.recipient).emit('message_edited', updateData);
      }
      socket.emit('message_edited', updateData);
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Delete a message
  socket.on('delete_message', (data) => {
    try {
      const { messageId } = data;
      const message = store.getMessage(messageId);

      if (!message || message.sender !== socket.walletAddress) {
        socket.emit('error', { message: 'Message not found or unauthorized' });
        return;
      }

      message.deleted = true;
      const deleteData = { messageId };

      if (message.groupId) {
        io.to(message.groupId).emit('message_deleted', deleteData);
      } else {
        io.to(message.recipient).emit('message_deleted', deleteData);
      }
      socket.emit('message_deleted', deleteData);
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Add reaction to message
  socket.on('add_reaction', (data) => {
    try {
      const { messageId, emoji } = data;
      const message = store.getMessage(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      message.reactions = (message.reactions || []).filter(
        r => r.userId !== socket.walletAddress
      );
      message.reactions.push({
        userId: socket.walletAddress,
        emoji,
        timestamp: new Date().toISOString()
      });

      const reactionData = { messageId, userId: socket.walletAddress, emoji };

      if (message.groupId) {
        io.to(message.groupId).emit('reaction_added', reactionData);
      } else {
        io.to(message.sender).emit('reaction_added', reactionData);
        io.to(message.recipient).emit('reaction_added', reactionData);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Star/unstar message
  socket.on('toggle_star', (data) => {
    try {
      const { messageId } = data;
      const message = store.getMessage(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      message.starred = !message.starred;
      socket.emit('message_starred', {
        messageId,
        starred: message.starred
      });
    } catch (error) {
      console.error('Error starring message:', error);
      socket.emit('error', { message: 'Failed to star message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { to } = data;
    io.to(to).emit('user_typing', { from: socket.walletAddress });
  });

  socket.on('stop_typing', (data) => {
    const { to } = data;
    io.to(to).emit('user_stop_typing', { from: socket.walletAddress });
  });
};
