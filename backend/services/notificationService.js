const Notification = require('../models/Notification');

class NotificationService {
  async getUserNotifications(userId, limit = 50) {
    const notifications = await Notification.find({ user: userId })
      .populate('from', 'name username profilePicture')
      .populate('group', 'name groupImage')
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications;
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.user.toString() !== userId.toString()) {
      throw new Error('Unauthorized');
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false
    });

    return count;
  }
}

module.exports = new NotificationService();

