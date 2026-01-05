const notificationService = require('../services/notificationService');

class NotificationController {
  async getUserNotifications(req, res) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user._id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user._id);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const result = await notificationService.markAllAsRead(req.user._id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const count = await notificationService.getUnreadCount(req.user._id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new NotificationController();

