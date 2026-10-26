import { query } from '../config/db.js';

/**
 * Helper to normalize executing queries either via a dedicated transaction connection
 * or via the shared pool query function.
 */
async function executeQuery(connection, sql, params = []) {
  if (connection && typeof connection.execute === 'function') {
    const [result] = await connection.execute(sql, params);
    return result;
  }
  return query(sql, params);
}

export const bookingModel = {
  /**
   * Check if confirmed booking overlaps with requested date range.
   * If connection is provided, runs inside an active transaction with FOR UPDATE.
   */
  async checkDateOverlap(equipmentId, startDate, endDate, excludeBookingId = null, connection = null) {
    let sql = `
      SELECT id, booking_reference, start_date, end_date, status
      FROM bookings
      WHERE equipment_id = ?
        AND status IN ('approved', 'active_loan')
        AND NOT (end_date < ? OR start_date > ?)
    `;
    const params = [equipmentId, startDate, endDate];

    if (excludeBookingId) {
      sql += ' AND id != ?';
      params.push(excludeBookingId);
    }

    if (connection) {
      sql += ' FOR UPDATE';
    }

    const rows = await executeQuery(connection, sql, params);
    return {
      hasOverlap: rows && rows.length > 0,
      conflicts: rows || []
    };
  },

  /**
   * Create a new booking request
   */
  async create({
    equipmentId,
    seekerId,
    startDate,
    endDate,
    seekerMessage = null,
    totalPrice = 0.00,
    bookingReference
  }, connection = null) {
    const sql = `
      INSERT INTO bookings (
        booking_reference,
        equipment_id,
        seeker_id,
        start_date,
        end_date,
        status,
        total_price,
        seeker_message
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `;

    const result = await executeQuery(connection, sql, [
      bookingReference,
      equipmentId,
      seekerId,
      startDate,
      endDate,
      totalPrice,
      seekerMessage ? seekerMessage.trim() : null
    ]);

    return this.findById(result.insertId, connection);
  },

  /**
   * Find booking by ID with joined equipment, seeker, and owner details
   */
  async findById(id, connection = null) {
    const sql = `
      SELECT 
        b.id,
        b.booking_reference,
        b.equipment_id,
        b.seeker_id,
        b.start_date,
        b.end_date,
        b.status,
        b.total_price,
        b.seeker_message,
        b.handover_notes,
        b.rejection_reason,
        b.cancellation_reason,
        b.seeker_return_video_url,
        b.seeker_return_notes,
        b.seeker_return_submitted_at,
        b.owner_return_video_url,
        b.owner_return_notes,
        b.owner_return_submitted_at,
        b.return_status,
        b.handover_condition_grade,
        b.return_condition_grade,
        b.is_disputed,
        b.dispute_reason,
        b.created_at,
        b.updated_at,
        e.name AS equipment_name,
        e.category AS equipment_category,
        e.image_url AS equipment_image,
        e.sharing_type AS equipment_sharing_type,
        e.price_per_day AS equipment_price_per_day,
        e.service_area AS equipment_service_area,
        e.owner_id,
        owner.full_name AS owner_name,
        owner.email AS owner_email,
        owner.phone AS owner_phone,
        owner.organization_name AS owner_organization,
        seeker.full_name AS seeker_name,
        seeker.email AS seeker_email,
        seeker.phone AS seeker_phone
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users owner ON e.owner_id = owner.id
      JOIN users seeker ON b.seeker_id = seeker.id
      WHERE b.id = ?
      LIMIT 1
    `;

    const rows = await executeQuery(connection, sql, [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  },

  /**
   * List bookings for a specific seeker
   */
  async listBySeeker(seekerId, { status = null, limit = 50, offset = 0 } = {}) {
    const conditions = ['b.seeker_id = ?'];
    const params = [seekerId];

    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    const sql = `
      SELECT 
        b.id,
        b.booking_reference,
        b.equipment_id,
        b.start_date,
        b.end_date,
        b.status,
        b.total_price,
        b.seeker_message,
        b.handover_notes,
        b.rejection_reason,
        b.cancellation_reason,
        b.seeker_return_video_url,
        b.seeker_return_notes,
        b.seeker_return_submitted_at,
        b.owner_return_video_url,
        b.owner_return_notes,
        b.owner_return_submitted_at,
        b.return_status,
        b.handover_condition_grade,
        b.return_condition_grade,
        b.is_disputed,
        b.dispute_reason,
        b.created_at,
        e.name AS equipment_name,
        e.category AS equipment_category,
        e.image_url AS equipment_image,
        e.price_per_day AS equipment_price_per_day,
        e.service_area AS equipment_service_area,
        owner.full_name AS owner_name,
        owner.phone AS owner_phone,
        owner.organization_name AS owner_organization,
        r.id AS review_id,
        r.rating AS review_rating
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users owner ON e.owner_id = owner.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  /**
   * List booking requests for an equipment owner (partner)
   */
  async listByOwner(ownerId, { status = null, limit = 50, offset = 0 } = {}) {
    const conditions = ['e.owner_id = ?'];
    const params = [ownerId];

    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    const sql = `
      SELECT 
        b.id,
        b.booking_reference,
        b.equipment_id,
        b.seeker_id,
        b.start_date,
        b.end_date,
        b.status,
        b.total_price,
        b.seeker_message,
        b.handover_notes,
        b.rejection_reason,
        b.cancellation_reason,
        b.seeker_return_video_url,
        b.seeker_return_notes,
        b.seeker_return_submitted_at,
        b.owner_return_video_url,
        b.owner_return_notes,
        b.owner_return_submitted_at,
        b.return_status,
        b.handover_condition_grade,
        b.return_condition_grade,
        b.is_disputed,
        b.dispute_reason,
        b.created_at,
        e.name AS equipment_name,
        e.category AS equipment_category,
        e.image_url AS equipment_image,
        seeker.full_name AS seeker_name,
        seeker.phone AS seeker_phone,
        seeker.service_area AS seeker_service_area
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users seeker ON b.seeker_id = seeker.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  /**
   * Update booking status
   */
  async updateStatus(id, newStatus, { rejectionReason = null, cancellationReason = null, handoverNotes = null } = {}, connection = null) {
    const sql = `
      UPDATE bookings 
      SET 
        status = ?,
        rejection_reason = COALESCE(?, rejection_reason),
        cancellation_reason = COALESCE(?, cancellation_reason),
        handover_notes = COALESCE(?, handover_notes)
      WHERE id = ?
    `;

    await executeQuery(connection, sql, [newStatus, rejectionReason, cancellationReason, handoverNotes, id]);
    return this.findById(id, connection);
  },

  /**
   * List all bookings for platform administrators
   */
  async listAllAdmin({ status = null, search = '', limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      conditions.push('(b.booking_reference LIKE ? OR e.name LIKE ? OR seeker.full_name LIKE ? OR owner.full_name LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        b.id,
        b.booking_reference,
        b.equipment_id,
        b.start_date,
        b.end_date,
        b.status,
        b.total_price,
        b.seeker_message,
        b.rejection_reason,
        b.cancellation_reason,
        b.seeker_return_video_url,
        b.seeker_return_notes,
        b.seeker_return_submitted_at,
        b.owner_return_video_url,
        b.owner_return_notes,
        b.owner_return_submitted_at,
        b.return_status,
        b.handover_condition_grade,
        b.return_condition_grade,
        b.is_disputed,
        b.dispute_reason,
        b.created_at,
        e.name AS equipment_name,
        e.category AS equipment_category,
        e.owner_id,
        owner.full_name AS owner_name,
        owner.email AS owner_email,
        seeker.id AS seeker_id,
        seeker.full_name AS seeker_name,
        seeker.email AS seeker_email
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users owner ON e.owner_id = owner.id
      JOIN users seeker ON b.seeker_id = seeker.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  /**
   * Count total bookings matching admin filters
   */
  async countAllAdmin({ status = null, search = '' } = {}) {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      conditions.push('(b.booking_reference LIKE ? OR e.name LIKE ? OR seeker.full_name LIKE ? OR owner.full_name LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT COUNT(*) AS total
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      JOIN users owner ON e.owner_id = owner.id
      JOIN users seeker ON b.seeker_id = seeker.id
      ${whereClause}
    `;

    const rows = await query(sql, params);
    return rows[0].total;
  },

  /**
   * Submit return condition inspection video and notes (Seeker or Owner)
   */
  async submitReturnInspection(id, { userRole, videoUrl, notes, conditionGrade, isDisputed = false, disputeReason = null }) {
    const booking = await this.findById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (userRole === 'seeker') {
      const willHaveBoth = Boolean(booking.owner_return_video_url);
      const newStatus = isDisputed ? 'disputed' : (willHaveBoth ? 'both_submitted' : 'seeker_submitted');
      const sql = `
        UPDATE bookings
        SET 
          seeker_return_video_url = ?,
          seeker_return_notes = ?,
          seeker_return_submitted_at = NOW(),
          handover_condition_grade = ?,
          return_status = ?,
          is_disputed = CASE WHEN ? = 1 THEN 1 ELSE is_disputed END,
          dispute_reason = CASE WHEN ? = 1 THEN ? ELSE dispute_reason END
        WHERE id = ?
      `;
      await query(sql, [
        videoUrl,
        notes || null,
        conditionGrade || 'Good',
        newStatus,
        isDisputed ? 1 : 0,
        isDisputed ? 1 : 0,
        disputeReason || null,
        id
      ]);
    } else {
      // Owner or Admin acting as owner
      const willHaveBoth = Boolean(booking.seeker_return_video_url);
      const newStatus = isDisputed ? 'disputed' : (willHaveBoth ? 'both_submitted' : 'owner_submitted');
      const sql = `
        UPDATE bookings
        SET 
          owner_return_video_url = ?,
          owner_return_notes = ?,
          owner_return_submitted_at = NOW(),
          return_condition_grade = ?,
          return_status = ?,
          is_disputed = CASE WHEN ? = 1 THEN 1 ELSE is_disputed END,
          dispute_reason = CASE WHEN ? = 1 THEN ? ELSE dispute_reason END
        WHERE id = ?
      `;
      await query(sql, [
        videoUrl,
        notes || null,
        conditionGrade || 'Good',
        newStatus,
        isDisputed ? 1 : 0,
        isDisputed ? 1 : 0,
        disputeReason || null,
        id
      ]);
    }

    return this.findById(id);
  }
};

export default bookingModel;

