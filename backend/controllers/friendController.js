const friendService = require('../services/friendService');
const { emitToUser } = require('../utils/socketEmitter');

class FriendController {
  async searchUsers(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.json([]);
      }

      const users = await friendService.searchUsers(q, req.user._id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async sendFriendRequest(req, res) {
    try {
      const { userId } = req.body;
      const result = await friendService.sendFriendRequest(req.user._id, userId);
      
      // Emit real-time update to receiver
      emitToUser(userId, 'friendRequestUpdate', { type: 'received' });
      // Emit update to sender
      emitToUser(req.user._id, 'friendRequestUpdate', { type: 'sent' });
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async acceptFriendRequest(req, res) {
    try {
      const { userId } = req.body;
      const result = await friendService.acceptFriendRequest(req.user._id, userId);
      
      // Emit real-time update to both users
      emitToUser(userId, 'friendRequestUpdate', { type: 'accepted' });
      emitToUser(req.user._id, 'friendRequestUpdate', { type: 'accepted' });
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async declineFriendRequest(req, res) {
    try {
      const { userId } = req.body;
      const result = await friendService.declineFriendRequest(req.user._id, userId);
      
      // Emit real-time update to both users
      emitToUser(userId, 'friendRequestUpdate', { type: 'declined' });
      emitToUser(req.user._id, 'friendRequestUpdate', { type: 'declined' });
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getSuggestedUsers(req, res) {
    try {
      const users = await friendService.getSuggestedUsers(req.user._id);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new FriendController();

