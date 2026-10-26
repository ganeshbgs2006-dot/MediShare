import { query } from '../config/db.js';

export const conditionLogModel = {
  /**
   * Log an inspection verification checklist
   */
  async create({
    bookingId,
    equipmentId,
    loggedBy,
    stage,
    conditionGrade,
    notes,
    checklistJson = null,
    verifiedBySeeker = false,
    verifiedByOwner = false,
    isDisputed = false,
    disputeReason = null
  }) {
    const sql = `
      INSERT INTO condition_logs (
        booking_id,
        equipment_id,
        logged_by,
        stage,
        condition_grade,
        notes,
        checklist_json,
        verified_by_seeker,
        verified_by_owner,
        is_disputed,
        dispute_reason,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const result = await query(sql, [
      bookingId,
      equipmentId,
      loggedBy,
      stage,
      conditionGrade,
      notes.trim(),
      checklistJson ? JSON.stringify(checklistJson) : null,
      verifiedBySeeker ? 1 : 0,
      verifiedByOwner ? 1 : 0,
      isDisputed ? 1 : 0,
      disputeReason ? disputeReason.trim() : null
    ]);

    return this.findById(result.insertId);
  },

  /**
   * Find condition log by ID
   */
  async findById(id) {
    const sql = `
      SELECT 
        c.*,
        u.full_name AS logged_by_name,
        e.name AS equipment_name,
        b.booking_reference
      FROM condition_logs c
      JOIN users u ON c.logged_by = u.id
      JOIN equipment e ON c.equipment_id = e.id
      LEFT JOIN bookings b ON c.booking_id = b.id
      WHERE c.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * List logs for a specific booking
   */
  async listByBooking(bookingId) {
    const sql = `
      SELECT 
        c.*,
        u.full_name AS logged_by_name
      FROM condition_logs c
      JOIN users u ON c.logged_by = u.id
      WHERE c.booking_id = ?
      ORDER BY c.created_at ASC
    `;
    return query(sql, [bookingId]);
  },

  /**
   * List open or resolved condition disputes
   */
  async listDisputes({ resolved = false, limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT 
        c.id,
        c.booking_id,
        c.equipment_id,
        c.stage,
        c.condition_grade,
        c.notes,
        c.is_disputed,
        c.dispute_reason,
        c.dispute_resolved,
        c.dispute_resolution,
        c.created_at,
        u.full_name AS logged_by_name,
        e.name AS equipment_name,
        b.booking_reference,
        seeker.full_name AS seeker_name,
        owner.full_name AS owner_name
      FROM condition_logs c
      JOIN users u ON c.logged_by = u.id
      JOIN equipment e ON c.equipment_id = e.id
      JOIN bookings b ON c.booking_id = b.id
      JOIN users seeker ON b.seeker_id = seeker.id
      JOIN users owner ON e.owner_id = owner.id
      WHERE c.is_disputed = 1
        AND c.dispute_resolved = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    return query(sql, [resolved ? 1 : 0, Number(limit), Number(offset)]);
  },

  /**
   * Count open disputes
   */
  async countOpenDisputes() {
    const sql = `
      SELECT COUNT(*) AS total
      FROM condition_logs
      WHERE is_disputed = 1 AND dispute_resolved = 0
    `;
    const rows = await query(sql);
    return rows[0].total || 0;
  },

  /**
   * Resolve a dispute (Admin action)
   */
  async resolveDispute(id, resolution) {
    const sql = `
      UPDATE condition_logs
      SET dispute_resolved = 1, dispute_resolution = ?
      WHERE id = ?
    `;
    await query(sql, [resolution.trim(), id]);
    return this.findById(id);
  }
};

export default conditionLogModel;

