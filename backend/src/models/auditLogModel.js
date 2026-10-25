import { query } from '../config/db.js';

export const auditLogModel = {
  /**
   * Record an administrative audit log event
   */
  async create({
    adminId,
    action,
    entityType,
    entityId,
    oldValue = null,
    newValue = null,
    reason = null,
    ipAddress = null
  }) {
    const sql = `
      INSERT INTO audit_logs (
        admin_id,
        action,
        entity_type,
        entity_id,
        old_value,
        new_value,
        reason,
        ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      adminId,
      action,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      reason ? reason.trim() : null,
      ipAddress
    ]);

    return result.insertId;
  },

  /**
   * List audit logs with pagination and filters
   */
  async list({ action = null, entityType = null, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];

    if (action && action !== 'all') {
      conditions.push('a.action = ?');
      params.push(action);
    }

    if (entityType && entityType !== 'all') {
      conditions.push('a.entity_type = ?');
      params.push(entityType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        a.id,
        a.admin_id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.old_value,
        a.new_value,
        a.reason,
        a.ip_address,
        a.created_at,
        u.full_name AS admin_name,
        u.email AS admin_email
      FROM audit_logs a
      JOIN users u ON a.admin_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    const rows = await query(sql, params);
    return rows.map((r) => ({
      ...r,
      old_value: typeof r.old_value === 'string' ? JSON.parse(r.old_value) : r.old_value,
      new_value: typeof r.new_value === 'string' ? JSON.parse(r.new_value) : r.new_value
    }));
  },

  /**
   * Count audit logs matching filters
   */
  async count({ action = null, entityType = null } = {}) {
    const conditions = [];
    const params = [];

    if (action && action !== 'all') {
      conditions.push('a.action = ?');
      params.push(action);
    }

    if (entityType && entityType !== 'all') {
      conditions.push('a.entity_type = ?');
      params.push(entityType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM audit_logs a ${whereClause}`;
    const rows = await query(sql, params);
    return rows[0].total;
  }
};

export default auditLogModel;
