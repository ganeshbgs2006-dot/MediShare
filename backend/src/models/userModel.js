import { query } from '../config/db.js';

export const userModel = {
  /**
   * Find a user record by email (including password_hash for authentication)
   */
  async findByEmail(email) {
    const sql = `
      SELECT 
        id, 
        full_name, 
        email, 
        password_hash, 
        phone, 
        role, 
        organization_name, 
        service_area, 
        is_verified, 
        is_active,
        status_reason,
        approval_status,
        approval_reason,
        approved_by,
        approved_at,
        created_at, 
        updated_at
      FROM users 
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
    `;
    const rows = await query(sql, [email.trim()]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Find a user by primary ID (excluding password_hash for security)
   */
  async findById(id) {
    const sql = `
      SELECT 
        id, 
        full_name, 
        email, 
        phone, 
        role, 
        organization_name, 
        service_area, 
        is_verified, 
        is_active,
        status_reason,
        approval_status,
        approval_reason,
        approved_by,
        approved_at,
        created_at, 
        updated_at
      FROM users 
      WHERE id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Create a new user with secure password hash
   */
  async create({
    fullName,
    email,
    passwordHash,
    phone = null,
    role = 'seeker',
    organizationName = null,
    serviceArea = null
  }) {
    // Seekers start active & approved; owners require administrator approval
    const isOwner = role === 'owner';
    const isVerified = isOwner ? 0 : 1;
    const approvalStatus = isOwner ? 'pending' : 'approved';

    const sql = `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        phone,
        role,
        organization_name,
        service_area,
        is_verified,
        approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      fullName.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      phone ? phone.trim() : null,
      role,
      organizationName ? organizationName.trim() : null,
      serviceArea ? serviceArea.trim() : null,
      isVerified,
      approvalStatus
    ]);

    return {
      id: result.insertId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      role,
      organizationName: organizationName ? organizationName.trim() : null,
      serviceArea: serviceArea ? serviceArea.trim() : null,
      isVerified: Boolean(isVerified),
      approvalStatus
    };
  },

  /**
   * Update administrator approval status for an owner / partner account
   */
  async updateApprovalStatus(id, approvalStatus, { reason = null, approvedBy = null } = {}) {
    const isVerified = approvalStatus === 'approved' ? 1 : 0;
    const sql = `
      UPDATE users 
      SET approval_status = ?, approval_reason = ?, approved_by = ?, approved_at = NOW(), is_verified = ?
      WHERE id = ?
    `;
    await query(sql, [approvalStatus, reason, approvedBy, isVerified, id]);
    return this.findById(id);
  },

  /**
   * Verify an owner / partner account (Admin only)
   */
  async verifyOwner(id) {
    return this.updateApprovalStatus(id, 'approved', { reason: 'Verified by system administrator.' });
  },

  /**
   * Update active status of an account (Suspend or Reactivate)
   */
  async updateStatus(id, isActive, reason = null) {
    const sql = `UPDATE users SET is_active = ?, status_reason = ? WHERE id = ?`;
    await query(sql, [isActive ? 1 : 0, reason, id]);
    return this.findById(id);
  },

  /**
   * List users with search, role filtering, status filtering, approval filtering, and pagination
   */
  async listUsers({ role = null, status = null, approvalStatus = null, search = '', limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];

    if (role && role !== 'all') {
      conditions.push('role = ?');
      params.push(role);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        conditions.push('is_active = 1');
      } else if (status === 'suspended') {
        conditions.push('is_active = 0');
      }
    }

    if (approvalStatus && approvalStatus !== 'all') {
      conditions.push('approval_status = ?');
      params.push(approvalStatus);
    }

    if (search && search.trim()) {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR organization_name LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        id, 
        full_name, 
        email, 
        phone, 
        role, 
        organization_name, 
        service_area, 
        is_verified, 
        is_active,
        status_reason,
        approval_status,
        approval_reason,
        approved_by,
        approved_at,
        created_at, 
        updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));
    return query(sql, params);
  },

  /**
   * Count users matching filter conditions
   */
  async countUsers({ role = null, status = null, approvalStatus = null, search = '' } = {}) {
    const conditions = [];
    const params = [];

    if (role && role !== 'all') {
      conditions.push('role = ?');
      params.push(role);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        conditions.push('is_active = 1');
      } else if (status === 'suspended') {
        conditions.push('is_active = 0');
      }
    }

    if (approvalStatus && approvalStatus !== 'all') {
      conditions.push('approval_status = ?');
      params.push(approvalStatus);
    }

    if (search && search.trim()) {
      conditions.push('(full_name LIKE ? OR email LIKE ? OR organization_name LIKE ?)');
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) AS total FROM users ${whereClause}`;
    const rows = await query(sql, params);
    return rows[0].total;
  },

  /**
   * Count pending owner applications awaiting administrator review
   */
  async countPendingOwners() {
    const sql = `SELECT COUNT(*) AS total FROM users WHERE role = 'owner' AND approval_status = 'pending'`;
    const rows = await query(sql);
    return rows[0].total;
  },

  /**
   * Count active admins in system to prevent locking out the last admin
   */
  async countActiveAdmins() {
    const sql = `SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1`;
    const rows = await query(sql);
    return rows[0].total;
  }
};

export default userModel;

