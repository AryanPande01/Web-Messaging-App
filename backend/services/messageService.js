const Message = require('../models/Message');
const User = require('../models/User');

class MessageService {
  async getChatMessages(userId, otherUserId) {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ],
      isDeleted: false,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'name username profilePicture')
    .populate('receiver', 'name username profilePicture')
    .sort({ createdAt: 1 })
    .limit(100);

    return messages;
  }

  async getGroupMessages(groupId, userId) {
    const messages = await Message.find({
      group: groupId,
      isDeleted: false,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'name username profilePicture')
    .sort({ createdAt: 1 })
    .limit(100);

    return messages;
  }

  async getChatList(userId) {
    // Get user with friends
    const user = await User.findById(userId).populate('friends', 'name username profilePicture isOnline');
    
    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      group: null,
      isDeleted: false,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'name username profilePicture isOnline')
    .populate('receiver', 'name username profilePicture isOnline')
    .sort({ createdAt: -1 });

    // Group by chat partner and get latest message
    const chatMap = new Map();
    messages.forEach(msg => {
      const partnerId = msg.sender._id.toString() === userId.toString() 
        ? msg.receiver._id.toString() 
        : msg.sender._id.toString();
      
      if (!chatMap.has(partnerId)) {
        chatMap.set(partnerId, {
          user: msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0
        });
      }
    });

    // Add all friends to chat list, even if no messages exist
    if (user && user.friends) {
      user.friends.forEach(friend => {
        const friendId = friend._id.toString();
        if (!chatMap.has(friendId)) {
          chatMap.set(friendId, {
            user: friend,
            lastMessage: null,
            unreadCount: 0
          });
        }
      });
    }

    // Count unread messages
    const unreadMessages = await Message.find({
      receiver: userId,
      status: { $ne: 'seen' },
      group: null
    });

    unreadMessages.forEach(msg => {
      const partnerId = msg.sender._id.toString();
      if (chatMap.has(partnerId)) {
        chatMap.get(partnerId).unreadCount++;
      }
    });

    // Sort: chats with messages first (by date), then chats without messages (by friend name)
    return Array.from(chatMap.values()).sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      }
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      // Both have no messages, sort by name
      return a.user.name.localeCompare(b.user.name);
    });
  }

  async markMessagesAsSeen(userId, otherUserId) {
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: userId,
        status: { $ne: 'seen' }
      },
      {
        $set: { status: 'seen' }
      }
    );
  }

  async deleteMessage(messageId, userId, deleteForEveryone = false) {
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.sender.toString() !== userId.toString()) {
      throw new Error('Unauthorized');
    }

    if (deleteForEveryone) {
      message.isDeleted = true;
      await message.save();
    } else {
      message.deletedFor.push(userId);
      await message.save();
    }

    return { message: 'Message deleted successfully' };
  }
}

module.exports = new MessageService();

