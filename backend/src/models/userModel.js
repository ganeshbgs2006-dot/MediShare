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
  }
};

export default userModel;
