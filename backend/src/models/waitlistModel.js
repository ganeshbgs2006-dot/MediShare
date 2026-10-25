import { query } from '../config/db.js';
import { notificationService } from '../services/notificationService.js';

export const waitlistModel = {
  /**
   * Add seeker to equipment waitlist with duplicate prevention
   */
  async join({
    equipmentId,
    seekerId,
    requestedFrom = null,
    requestedTo = null,
    notes = null
  }) {
    // Check if user is already actively on the waitlist for this equipment
    const existing = await this.getActiveEntry(equipmentId, seekerId);
    if (existing) {
      const position = await this.getQueuePosition(equipmentId, existing.id);
      return {
        ...existing,
        queuePosition: position,
        alreadyWaitlisted: true
      };
    }

    const sql = `
      INSERT INTO waitlist (
        equipment_id,
        seeker_id,
        status,
        requested_from,
        requested_to,
        notes,
        created_at
      ) VALUES (?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const result = await query(sql, [
      equipmentId,
      seekerId,
      requestedFrom || null,
      requestedTo || null,
      notes ? notes.trim() : null
    ]);

    const entry = await this.findById(result.insertId);
    const position = await this.getQueuePosition(equipmentId, entry.id);
    return {
      ...entry,
      queuePosition: position,
      alreadyWaitlisted: false
    };
  },

  /**
   * Find waitlist entry by ID
   */
  async findById(id) {
    const sql = `
      SELECT 
        w.id,
        w.equipment_id,
        w.seeker_id,
        w.status,
        w.requested_from,
        w.requested_to,
        w.notes,
        w.notified_at,
        w.created_at,
        e.name AS equipment_name,
        e.category AS equipment_category,
        e.image_url AS equipment_image,
        e.service_area AS equipment_service_area,
        e.availability_status AS equipment_availability
      FROM waitlist w
      JOIN equipment e ON w.equipment_id = e.id
      WHERE w.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Get active waitlist entry for seeker and equipment
   */
  async getActiveEntry(equipmentId, seekerId) {
    const sql = `
      SELECT *
      FROM waitlist
      WHERE equipment_id = ?
        AND seeker_id = ?
        AND status = 'active'
      LIMIT 1
    `;
    const rows = await query(sql, [equipmentId, seekerId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Determine queue position for a waitlist entry (FIFO ordering)
   */
  async getQueuePosition(equipmentId, entryId) {
    const entry = await this.findById(entryId);
    if (!entry) return 0;

    const sql = `
      SELECT COUNT(*) AS ahead
      FROM waitlist
      WHERE equipment_id = ?
        AND status = 'active'
        AND created_at < ?
    `;
    const rows = await query(sql, [equipmentId, entry.created_at]);
    return (rows[0].ahead || 0) + 1;
  },

  /**
   * Get waitlist status for a specific seeker and equipment
   */
  async getStatusForSeeker(equipmentId, seekerId) {
    const active = await this.getActiveEntry(equipmentId, seekerId);
    const totalCount = await this.countActive(equipmentId);

    if (!active) {
      return {
        isWaitlisted: false,
        totalWaitlist: totalCount
      };
    }

    const queuePosition = await this.getQueuePosition(equipmentId, active.id);
    return {
      isWaitlisted: true,
      entry: active,
      queuePosition,
      totalWaitlist: totalCount
    };
  },

  /**
   * Count active waitlist requests for equipment
   */
  async countActive(equipmentId) {
    const sql = `
      SELECT COUNT(*) AS total
      FROM waitlist
      WHERE equipment_id = ? AND status = 'active'
    `;
    const rows = await query(sql, [equipmentId]);
    return rows[0].total || 0;
  },

  /**
   * Remove seeker from waitlist (mark cancelled)
   */
  async leave(id, seekerId) {
    const sql = `
      UPDATE waitlist
      SET status = 'cancelled'
      WHERE id = ? AND seeker_id = ?
    `;
    const result = await query(sql, [id, seekerId]);
    return result.affectedRows > 0;
  },

  /**
   * Cancel by equipment and seeker
   */
  async leaveByEquipment(equipmentId, seekerId) {
    const sql = `
      UPDATE waitlist
      SET status = 'cancelled'
      WHERE equipment_id = ? AND seeker_id = ? AND status = 'active'
    `;
    const result = await query(sql, [equipmentId, seekerId]);
    return result.affectedRows > 0;
  },

  /**
   * List waitlist entries for a seeker
   */
  async listBySeeker(seekerId) {
    const sql = `
      SELECT 
        w.id,
        w.equipment_id,
        w.seeker_id,
        w.status,
        w.requested_from,
        w.requested_to,
        w.notes,
        w.notified_at,
        w.created_at,
        e.name AS equipment_name,
        e.category AS equipment_category,
        e.image_url AS equipment_image,
        e.availability_status AS equipment_availability,
        e.service_area AS equipment_service_area
      FROM waitlist w
      JOIN equipment e ON w.equipment_id = e.id
      WHERE w.seeker_id = ?
      ORDER BY w.created_at DESC
    `;
    return query(sql, [seekerId]);
  },

  /**
   * Notify eligible waitlisted seekers when equipment becomes available
   */
  async notifyEligibleWaitlist(equipmentId) {
    // Select oldest active waitlist entries (FIFO order)
    const sql = `
      SELECT 
        w.id,
        w.seeker_id,
        e.id AS equipment_id,
        e.name AS equipment_name
      FROM waitlist w
      JOIN equipment e ON w.equipment_id = e.id
      WHERE w.equipment_id = ?
        AND w.status = 'active'
      ORDER BY w.created_at ASC
      LIMIT 3
    `;

    const candidates = await query(sql, [equipmentId]);
    for (const c of candidates) {
      // Clear any prior stale notified row for this seeker and equipment to satisfy unique constraint
      await query(`DELETE FROM waitlist WHERE equipment_id = ? AND seeker_id = ? AND status = 'notified' AND id != ?`, [c.equipment_id, c.seeker_id, c.id]);
      await query(`UPDATE waitlist SET status = 'notified', notified_at = CURRENT_TIMESTAMP WHERE id = ?`, [c.id]);
      await notificationService.notifyWaitlistAvailable({
        seekerId: c.seeker_id,
        equipment: { id: c.equipment_id, name: c.equipment_name }
      });
    }

    return candidates.length;
  }
};

export default waitlistModel;
