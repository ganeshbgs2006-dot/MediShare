import { query } from '../config/db.js';

export const notificationModel = {
  /**
   * Create an in-app notification with built-in de-duplication window
   */
  async create({
    userId,
    type,
    title,
    message,
    entityType = 'system',
    entityId = null
  }) {
    // De-duplication check: prevent identical unread notifications sent within the last 60 seconds
    const duplicateSql = `
      SELECT id FROM notifications
      WHERE user_id = ?
        AND type = ?
        AND entity_type = ?
        AND (entity_id = ? OR (entity_id IS NULL AND ? IS NULL))
        AND is_read = 0
        AND created_at >= NOW() - INTERVAL 60 SECOND
      LIMIT 1
    `;
    const existing = await query(duplicateSql, [userId, type, entityType, entityId, entityId]);
    if (existing.length > 0) {
      return existing[0].id;
    }

    const sql = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        is_read,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `;

    const result = await query(sql, [
      userId,
      type,
      title.trim(),
      message.trim(),
      entityType,
      entityId
    ]);

    return result.insertId;
  },

  /**
   * List notifications for a specific user with pagination
   */
  async listByUser(userId, { limit = 30, offset = 0, unreadOnly = false } = {}) {
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (unreadOnly) {
      conditions.push('is_read = 0');
    }

    const sql = `
      SELECT 
        id,
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        is_read,
        created_at,
        read_at
      FROM notifications
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  /**
   * Retrieve total unread notifications count for recipient
   */
  async getUnreadCount(userId) {
    const sql = `
      SELECT COUNT(*) AS total
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `;
    const rows = await query(sql, [userId]);
    return rows[0].total || 0;
  },

  /**
   * Mark a single notification as read (Strictly enforces recipient ownership)
   */
  async markAsRead(id, userId) {
    const sql = `
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
    const result = await query(sql, [id, userId]);
    return result.affectedRows > 0;
  },

  /**
   * Mark all unread notifications as read for recipient
   */
  async markAllAsRead(userId) {
    const sql = `
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = 0
    `;
    const result = await query(sql, [userId]);
    return result.affectedRows;
  },

  /**
   * Dismiss/delete a notification for recipient
   */
  async dismiss(id, userId) {
    const sql = `
      DELETE FROM notifications
      WHERE id = ? AND user_id = ?
    `;
    const result = await query(sql, [id, userId]);
    return result.affectedRows > 0;
  }
};

export default notificationModel;
