import { query } from '../config/db.js';

export const reviewModel = {
  /**
   * Submit a review for a completed (returned) booking
   */
  async create({
    bookingId,
    reviewerId,
    revieweeId,
    equipmentId,
    rating,
    comment
  }) {
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      throw new Error('Rating must be an integer between 1 and 5 stars.');
    }

    // Check if booking already has a review (enforced by DB unique key on booking_id)
    const existing = await this.getByBooking(bookingId);
    if (existing) {
      throw new Error('A review has already been submitted for this completed loan.');
    }

    const sql = `
      INSERT INTO reviews (
        booking_id,
        reviewer_id,
        reviewee_id,
        equipment_id,
        rating,
        comment,
        moderation_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
    `;

    const result = await query(sql, [
      bookingId,
      reviewerId,
      revieweeId,
      equipmentId,
      numRating,
      comment ? comment.trim() : null
    ]);

    return this.findById(result.insertId);
  },

  /**
   * Find review by ID
   */
  async findById(id) {
    const sql = `
      SELECT 
        r.id,
        r.booking_id,
        r.reviewer_id,
        r.reviewee_id,
        r.equipment_id,
        r.rating,
        r.comment,
        r.moderation_status,
        r.moderation_reason,
        r.created_at,
        reviewer.full_name AS reviewer_name,
        equipment.name AS equipment_name
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN equipment equipment ON r.equipment_id = equipment.id
      WHERE r.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Find review for a specific booking
   */
  async getByBooking(bookingId) {
    const sql = `
      SELECT 
        r.id,
        r.booking_id,
        r.reviewer_id,
        r.reviewee_id,
        r.equipment_id,
        r.rating,
        r.comment,
        r.moderation_status,
        r.created_at,
        u.full_name AS reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.booking_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [bookingId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * List approved reviews for an equipment item
   */
  async listByEquipment(equipmentId, { limit = 20, offset = 0 } = {}) {
    const sql = `
      SELECT 
        r.id,
        r.booking_id,
        r.reviewer_id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS reviewer_name
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.equipment_id = ?
        AND r.moderation_status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    return query(sql, [equipmentId, Number(limit), Number(offset)]);
  },

  /**
   * Calculate verified rating summary for equipment from real database records
   */
  async getEquipmentRatingSummary(equipmentId) {
    const sql = `
      SELECT 
        COUNT(*) AS total_reviews,
        COALESCE(AVG(rating), 0) AS average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS count_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS count_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS count_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS count_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS count_1
      FROM reviews
      WHERE equipment_id = ?
        AND moderation_status = 'approved'
    `;
    const rows = await query(sql, [equipmentId]);
    const summary = rows[0] || {};
    return {
      totalReviews: Number(summary.total_reviews || 0),
      averageRating: Number(Number(summary.average_rating || 0).toFixed(1)),
      breakdown: {
        5: Number(summary.count_5 || 0),
        4: Number(summary.count_4 || 0),
        3: Number(summary.count_3 || 0),
        2: Number(summary.count_2 || 0),
        1: Number(summary.count_1 || 0)
      }
    };
  },

  /**
   * Admin list all reviews with moderation filters
   */
  async listAllAdmin({ status = 'all', page = 1, limit = 20 } = {}) {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('r.moderation_status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const sql = `
      SELECT 
        r.id,
        r.booking_id,
        r.reviewer_id,
        r.reviewee_id,
        r.equipment_id,
        r.rating,
        r.comment,
        r.moderation_status,
        r.moderation_reason,
        r.created_at,
        reviewer.full_name AS reviewer_name,
        reviewer.email AS reviewer_email,
        eq.name AS equipment_name
      FROM reviews r
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      JOIN equipment eq ON r.equipment_id = eq.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  /**
   * Admin count reviews matching filter
   */
  async countAllAdmin({ status = 'all' } = {}) {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('moderation_status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM reviews ${whereClause}`;
    const rows = await query(sql, params);
    return rows[0].total;
  },

  /**
   * Admin update review moderation status
   */
  async updateModeration(id, moderationStatus, reason = null) {
    const sql = `
      UPDATE reviews
      SET moderation_status = ?, moderation_reason = ?
      WHERE id = ?
    `;
    await query(sql, [moderationStatus, reason, id]);
    return this.findById(id);
  }
};

export default reviewModel;

