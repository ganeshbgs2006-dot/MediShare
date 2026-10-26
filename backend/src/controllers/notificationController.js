import { notificationModel } from '../models/notificationModel.js';

export const notificationController = {
  /**
   * Retrieve paginated notifications for authenticated user
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 20, page = 1, unreadOnly = 'false' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const isUnreadOnly = unreadOnly === 'true' || unreadOnly === true;
      const notifications = await notificationModel.listByUser(userId, {
        limit: Number(limit),
        offset,
        unreadOnly: isUnreadOnly
      });

      const unreadCount = await notificationModel.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        notifications,
        unreadCount,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get unread notifications badge count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await notificationModel.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        count
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const updated = await notificationModel.markAsRead(id, userId);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found or does not belong to you.'
        });
      }

      const unreadCount = await notificationModel.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        unreadCount
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const affectedRows = await notificationModel.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: `Marked ${affectedRows} notifications as read.`,
        unreadCount: 0
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Dismiss / delete notification
   */
  async dismiss(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await notificationModel.dismiss(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found or does not belong to you.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification dismissed.'
      });
    } catch (err) {
      next(err);
    }
  }
};

export default notificationController;

