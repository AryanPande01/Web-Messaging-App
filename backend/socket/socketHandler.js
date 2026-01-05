const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

let onlineUsers = new Map(); // userId -> socketId

const handleSocketConnection = (io) => {
  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);
    
    // Update user online status
    User.findByIdAndUpdate(socket.userId, { isOnline: true, lastSeen: new Date() }).exec();

    // Emit online status to friends
    User.findById(socket.userId)
      .then(user => {
        if (user && user.friends.length > 0) {
          user.friends.forEach(friendId => {
            const friendSocketId = onlineUsers.get(friendId.toString());
            if (friendSocketId) {
              io.to(friendSocketId).emit('userOnline', { userId: socket.userId });
            }
          });
        }
      });

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    // Handle typing indicator
    socket.on('typing', async ({ receiverId, isTyping }) => {
      if (!receiverId) return;
      
      const receiverIdStr = receiverId.toString();
      const receiverSocketId = onlineUsers.get(receiverIdStr);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', {
          senderId: socket.userId,
          isTyping
        });
      }
    });

    // Handle sending message
    socket.on('sendMessage', async ({ receiverId, content, groupId }) => {
      try {
        // Validate input
        if (!content || !content.trim()) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // For one-to-one messages, validate friendship
        if (!groupId && receiverId) {
          const sender = await User.findById(socket.userId);
          if (!sender) {
            socket.emit('error', { message: 'User not found' });
            return;
          }

          // Check if users are friends
          const isFriend = sender.friends.some(
            friendId => friendId.toString() === receiverId.toString()
          );

          if (!isFriend) {
            socket.emit('error', { message: 'You can only message your friends' });
            return;
          }
        }

        const message = new Message({
          sender: socket.userId,
          receiver: receiverId || null,
          group: groupId || null,
          content: content.trim(),
          status: 'sent'
        });

        await message.save();
        await message.populate('sender', 'name username profilePicture');

        // If group message
        if (groupId) {
          const Group = require('../models/Group');
          const group = await Group.findById(groupId).populate('members');
          if (!group) {
            socket.emit('error', { message: 'Group not found' });
            return;
          }
          
          group.members.forEach(member => {
            if (member._id.toString() !== socket.userId) {
              const memberSocketId = onlineUsers.get(member._id.toString());
              if (memberSocketId) {
                io.to(memberSocketId).emit('newMessage', message);
              }
            }
          });
          
          // Also send to sender
          socket.emit('newMessage', message);
        } else {
          // One-to-one message
          if (!receiverId) {
            socket.emit('error', { message: 'Receiver ID is required' });
            return;
          }

          await message.populate('receiver', 'name username profilePicture');
          
          // Always send to sender first (so they see their message immediately)
          socket.emit('newMessage', message);
          
          // Send to receiver if online
          const receiverIdStr = receiverId.toString();
          const receiverSocketId = onlineUsers.get(receiverIdStr);
          
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', message);
            // Update message status to delivered
            message.status = 'delivered';
            await message.save();
          } else {
            // Receiver is offline, message will be delivered when they come online
            // Status remains 'sent'
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message: ' + error.message });
      }
    });

    // Handle message seen
    socket.on('messageSeen', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message && message.receiver && message.receiver.toString() === socket.userId) {
          message.status = 'seen';
          await message.save();
          
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('messageSeen', { messageId });
          }
        }
      } catch (error) {
        console.error('Error marking message as seen:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false, 
        lastSeen: new Date() 
      });

      // Emit offline status to friends
      const user = await User.findById(socket.userId);
      if (user && user.friends.length > 0) {
        user.friends.forEach(friendId => {
          const friendSocketId = onlineUsers.get(friendId.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('userOffline', { userId: socket.userId });
          }
        });
      }
    });
  });
};

module.exports = { handleSocketConnection, onlineUsers };

