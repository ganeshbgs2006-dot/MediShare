import { query } from '../config/db.js';

export const equipmentModel = {
  /**
   * Find equipment by ID with owner information and gallery photos
   */
  async findById(id) {
    const sql = `
      SELECT 
        e.id,
        e.owner_id,
        e.name,
        e.category,
        e.description,
        e.condition_grade,
        e.condition_details,
        e.known_damage,
        e.sharing_type,
        e.price_per_day,
        e.availability_status,
        e.moderation_status,
        e.moderation_reason,
        e.service_area,
        e.image_url,
        e.created_at,
        u.full_name AS owner_name,
        u.organization_name AS owner_organization,
        u.email AS owner_email,
        u.phone AS owner_phone
      FROM equipment e
      JOIN users u ON e.owner_id = u.id
      WHERE e.id = ?
      LIMIT 1
    `;

    const rows = await query(sql, [id]);
    if (rows.length === 0) return null;

    const item = rows[0];

    // Fetch gallery photos from equipment_media
    const mediaSql = `
      SELECT id, file_url, caption, media_type, stage 
      FROM equipment_media 
      WHERE equipment_id = ? 
      ORDER BY id ASC
    `;
    const media = await query(mediaSql, [id]);
    item.gallery = media.map((m) => m.file_url);
    if (item.gallery.length === 0 && item.image_url) {
      item.gallery = [item.image_url];
    }

    return item;
  },

  /**
   * List equipment catalog for marketplace
   */
  async list({
    category = null,
    sharingType = null,
    availability = null,
    search = '',
    moderationStatus = 'approved',
    limit = 50,
    offset = 0
  } = {}) {
    const conditions = [];
    const params = [];

    if (moderationStatus && moderationStatus !== 'all') {
      conditions.push('e.moderation_status = ?');
      params.push(moderationStatus);
    }

    if (category && category !== 'All Categories') {
      conditions.push('e.category = ?');
      params.push(category);
    }

    if (sharingType && sharingType !== 'all') {
      conditions.push('e.sharing_type = ?');
      params.push(sharingType);
    }

    if (availability && availability !== 'all') {
      if (availability === 'available') {
        conditions.push("e.availability_status = 'available'");
      } else {
        conditions.push("e.availability_status != 'available'");
      }
    }

    if (search && search.trim()) {
      conditions.push('(e.name LIKE ? OR e.description LIKE ? OR e.category LIKE ? OR e.service_area LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        e.id,
        e.owner_id,
        e.name,
        e.category,
        e.description,
        e.condition_grade,
        e.sharing_type,
        e.price_per_day,
        e.availability_status,
        e.moderation_status,
        e.service_area,
        e.image_url,
        e.created_at,
        u.full_name AS owner_name,
        u.organization_name AS owner_organization
      FROM equipment e
      JOIN users u ON e.owner_id = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  /**
   * List equipment owned by a specific owner
   */
  async listByOwner(ownerId) {
    const sql = `
      SELECT 
        e.*,
        COUNT(b.id) AS total_bookings_count
      FROM equipment e
      LEFT JOIN bookings b ON e.id = b.equipment_id
      WHERE e.owner_id = ?
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;
    return query(sql, [ownerId]);
  },

  /**
   * Admin: update moderation status of a listing
   */
  async updateModeration(id, moderationStatus, reason = null) {
    const sql = `
      UPDATE equipment
      SET moderation_status = ?, moderation_reason = ?
      WHERE id = ?
    `;
    await query(sql, [moderationStatus, reason, id]);
    return this.findById(id);
  },

  /**
   * Count equipment matching filters
   */
  async count({ category = null, sharingType = null, search = '', moderationStatus = 'approved' } = {}) {
    const conditions = [];
    const params = [];

    if (moderationStatus && moderationStatus !== 'all') {
      conditions.push('e.moderation_status = ?');
      params.push(moderationStatus);
    }

    if (category && category !== 'All Categories') {
      conditions.push('e.category = ?');
      params.push(category);
    }

    if (sharingType && sharingType !== 'all') {
      conditions.push('e.sharing_type = ?');
      params.push(sharingType);
    }

    if (search && search.trim()) {
      conditions.push('(e.name LIKE ? OR e.description LIKE ? OR e.category LIKE ? OR e.service_area LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM equipment e ${whereClause}`;
    const rows = await query(sql, params);
    return rows[0].total;
  }
};

export default equipmentModel;
