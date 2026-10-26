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
        e.video_url,
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
    item.gallery = media.filter((m) => m.media_type === 'image').map((m) => m.file_url);
    if (item.gallery.length === 0 && item.image_url) {
      item.gallery = [item.image_url];
    }
    const videoMedia = media.find((m) => m.media_type === 'video');
    if (!item.video_url && videoMedia) {
      item.video_url = videoMedia.file_url;
    }
    item.media = media;

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
        e.video_url,
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
  },

  /**
   * Create a new equipment listing
   */
  async create({
    ownerId,
    name,
    category,
    description,
    conditionGrade = 'Good',
    conditionDetails = null,
    knownDamage = null,
    sharingType = 'free',
    pricePerDay = 0,
    serviceArea,
    imageUrl = null,
    videoUrl = null,
    gallery = []
  }) {
    const primaryImage = imageUrl || (gallery.length > 0 ? gallery[0] : null);
    const sql = `
      INSERT INTO equipment (
        owner_id, name, category, description, condition_grade,
        condition_details, known_damage, sharing_type, price_per_day,
        availability_status, moderation_status, service_area, image_url, video_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 'approved', ?, ?, ?)
    `;

    const result = await query(sql, [
      ownerId,
      name.trim(),
      category.trim(),
      description.trim(),
      conditionGrade,
      conditionDetails ? conditionDetails.trim() : null,
      knownDamage ? knownDamage.trim() : null,
      sharingType,
      Number(pricePerDay) || 0,
      serviceArea.trim(),
      primaryImage,
      videoUrl ? videoUrl.trim() : null
    ]);

    const newId = result.insertId;

    // Insert gallery images into equipment_media if provided
    if (Array.isArray(gallery) && gallery.length > 0) {
      for (const photoUrl of gallery) {
        if (photoUrl && typeof photoUrl === 'string') {
          await query(
            `INSERT INTO equipment_media (equipment_id, media_type, file_url, caption, stage) VALUES (?, 'image', ?, 'Gallery Photo', 'gallery')`,
            [newId, photoUrl.trim()]
          );
        }
      }
    }

    // Insert video into equipment_media if provided
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim()) {
      await query(
        `INSERT INTO equipment_media (equipment_id, media_type, file_url, caption, stage) VALUES (?, 'video', ?, 'Equipment Demonstration Video', 'gallery')`,
        [newId, videoUrl.trim()]
      );
    }

    return this.findById(newId);
  },

  /**
   * Update an existing equipment listing
   */
  async update(id, ownerId, updates, isAdmin = false) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    if (!isAdmin && Number(existing.owner_id) !== Number(ownerId)) {
      throw new Error('UNAUTHORIZED_OWNER');
    }

    const fields = [];
    const params = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      params.push(updates.name.trim());
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      params.push(updates.category.trim());
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description.trim());
    }
    if (updates.conditionGrade !== undefined) {
      fields.push('condition_grade = ?');
      params.push(updates.conditionGrade);
    }
    if (updates.conditionDetails !== undefined) {
      fields.push('condition_details = ?');
      params.push(updates.conditionDetails ? updates.conditionDetails.trim() : null);
    }
    if (updates.knownDamage !== undefined) {
      fields.push('known_damage = ?');
      params.push(updates.knownDamage ? updates.knownDamage.trim() : null);
    }
    if (updates.sharingType !== undefined) {
      fields.push('sharing_type = ?');
      params.push(updates.sharingType);
    }
    if (updates.pricePerDay !== undefined) {
      fields.push('price_per_day = ?');
      params.push(Number(updates.pricePerDay) || 0);
    }
    if (updates.availabilityStatus !== undefined) {
      fields.push('availability_status = ?');
      params.push(updates.availabilityStatus);
    }
    if (updates.serviceArea !== undefined) {
      fields.push('service_area = ?');
      params.push(updates.serviceArea.trim());
    }
    if (updates.imageUrl !== undefined) {
      fields.push('image_url = ?');
      params.push(updates.imageUrl);
    }
    if (updates.videoUrl !== undefined) {
      fields.push('video_url = ?');
      params.push(updates.videoUrl ? updates.videoUrl.trim() : null);
    }

    if (fields.length > 0) {
      params.push(id);
      await query(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    // If new gallery items provided, add them to equipment_media
    if (Array.isArray(updates.gallery) && updates.gallery.length > 0) {
      for (const photoUrl of updates.gallery) {
        if (photoUrl && typeof photoUrl === 'string') {
          const existingMedia = await query(
            `SELECT id FROM equipment_media WHERE equipment_id = ? AND file_url = ?`,
            [id, photoUrl.trim()]
          );
          if (existingMedia.length === 0) {
            await query(
              `INSERT INTO equipment_media (equipment_id, media_type, file_url, caption, stage) VALUES (?, 'image', ?, 'Gallery Photo', 'gallery')`,
              [id, photoUrl.trim()]
            );
          }
        }
      }
    }

    return this.findById(id);
  },

  /**
   * Delete equipment listing (with active loan protection)
   */
  async delete(id, ownerId, isAdmin = false) {
    const existing = await this.findById(id);
    if (!existing) {
      return { success: false, notFound: true };
    }

    if (!isAdmin && Number(existing.owner_id) !== Number(ownerId)) {
      return { success: false, forbidden: true };
    }

    // Check if equipment has active loans or pending bookings
    const activeBookings = await query(
      `SELECT COUNT(*) AS active_count FROM bookings WHERE equipment_id = ? AND status IN ('pending', 'approved', 'active_loan')`,
      [id]
    );

    if (activeBookings[0].active_count > 0) {
      return {
        success: false,
        hasActiveBookings: true,
        message: 'Cannot delete equipment that has pending or active loans. Please complete or cancel all bookings first.'
      };
    }

    await query(`DELETE FROM equipment WHERE id = ?`, [id]);
    return { success: true };
  }
};

export default equipmentModel;

