const messageService = require('../services/messageService');

class MessageController {
  async getChatMessages(req, res) {
    try {
      const { userId } = req.params;
      const messages = await messageService.getChatMessages(req.user._id, userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getGroupMessages(req, res) {
    try {
      const { groupId } = req.params;
      const messages = await messageService.getGroupMessages(groupId, req.user._id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getChatList(req, res) {
    try {
      const chats = await messageService.getChatList(req.user._id);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async markMessagesAsSeen(req, res) {
    try {
      const { userId } = req.params;
      await messageService.markMessagesAsSeen(req.user._id, userId);
      res.json({ message: 'Messages marked as seen' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { deleteForEveryone } = req.body;
      const result = await messageService.deleteMessage(messageId, req.user._id, deleteForEveryone);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new MessageController();

