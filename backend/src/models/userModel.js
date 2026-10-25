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
    // Admins and verified organizations can start verified, seekers start active
    const isVerified = role === 'seeker' ? 1 : 0;

    const sql = `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        phone,
        role,
        organization_name,
        service_area,
        is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      fullName.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      phone ? phone.trim() : null,
      role,
      organizationName ? organizationName.trim() : null,
      serviceArea ? serviceArea.trim() : null,
      isVerified
    ]);

    return {
      id: result.insertId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      role,
      organizationName: organizationName ? organizationName.trim() : null,
      serviceArea: serviceArea ? serviceArea.trim() : null,
      isVerified: Boolean(isVerified)
    };
  },

  /**
   * Verify an owner / partner account (Admin only)
   */
  async verifyOwner(id) {
    const sql = `UPDATE users SET is_verified = 1 WHERE id = ?`;
    await query(sql, [id]);
    return this.findById(id);
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
   * List users with search, role filtering, status filtering, and pagination for Admin Dashboard
   */
  async listUsers({ role = null, status = null, search = '', limit = 20, offset = 0 } = {}) {
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
  async countUsers({ role = null, status = null, search = '' } = {}) {
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
   * Count active admins in system to prevent locking out the last admin
   */
  async countActiveAdmins() {
    const sql = `SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1`;
    const rows = await query(sql);
    return rows[0].total;
  }
};

export default userModel;

