import { query } from '../config/db.js';
import { userModel } from '../models/userModel.js';
import { equipmentModel } from '../models/equipmentModel.js';
import { bookingModel } from '../models/bookingModel.js';
import { auditLogModel } from '../models/auditLogModel.js';

export const adminController = {
  /**
   * Get administrative dashboard metrics & high-level summary
   */
  async getDashboardMetrics(req, res, next) {
    try {
      // 1. User metrics
      const userRows = await query(`
        SELECT 
          role,
          is_active,
          COUNT(*) as cnt
        FROM users
        GROUP BY role, is_active
      `);

      let totalUsers = 0;
      let totalSeekers = 0;
      let totalOwners = 0;
      let totalAdmins = 0;
      let activeUsers = 0;
      let suspendedUsers = 0;

      userRows.forEach(row => {
        const count = Number(row.cnt);
        totalUsers += count;
        if (row.role === 'seeker') totalSeekers += count;
        if (row.role === 'owner') totalOwners += count;
        if (row.role === 'admin') totalAdmins += count;
        if (row.is_active === 1) activeUsers += count;
        if (row.is_active === 0) suspendedUsers += count;
      });

      // 2. Equipment metrics
      const equipmentRows = await query(`
        SELECT moderation_status, COUNT(*) as cnt
        FROM equipment
        GROUP BY moderation_status
      `);

      let totalEquipment = 0;
      const equipmentByModeration = {
        approved: 0,
        pending: 0,
        flagged: 0,
        rejected: 0
      };

      equipmentRows.forEach(row => {
        const count = Number(row.cnt);
        totalEquipment += count;
        if (equipmentByModeration[row.moderation_status] !== undefined) {
          equipmentByModeration[row.moderation_status] = count;
        }
      });

      // 3. Booking metrics
      const bookingRows = await query(`
        SELECT status, COUNT(*) as cnt
        FROM bookings
        GROUP BY status
      `);

      let totalBookings = 0;
      const bookingsByStatus = {
        pending: 0,
        approved: 0,
        active_loan: 0,
        returned: 0,
        cancelled: 0,
        rejected: 0
      };

      bookingRows.forEach(row => {
        const count = Number(row.cnt);
        totalBookings += count;
        if (bookingsByStatus[row.status] !== undefined) {
          bookingsByStatus[row.status] = count;
        }
      });

      // 4. Recent 5 users
      const recentUsers = await query(`
        SELECT id, full_name, email, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);

      // 5. Recent 5 bookings
      const recentBookings = await query(`
        SELECT 
          b.id,
          b.booking_reference,
          b.start_date,
          b.end_date,
          b.status,
          b.total_price,
          b.created_at,
          e.name AS equipment_name,
          seeker.full_name AS seeker_name
        FROM bookings b
        JOIN equipment e ON b.equipment_id = e.id
        JOIN users seeker ON b.seeker_id = seeker.id
        ORDER BY b.created_at DESC
        LIMIT 5
      `);

      return res.status(200).json({
        success: true,
        metrics: {
          users: {
            total: totalUsers,
            seekers: totalSeekers,
            owners: totalOwners,
            admins: totalAdmins,
            active: activeUsers,
            suspended: suspendedUsers
          },
          equipment: {
            total: totalEquipment,
            byModeration: equipmentByModeration
          },
          bookings: {
            total: totalBookings,
            byStatus: bookingsByStatus
          },
          recentUsers,
          recentBookings
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * List users with role/status filters and pagination
   */
  async listUsers(req, res, next) {
    try {
      const { role, status, search, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const users = await userModel.listUsers({
        role,
        status,
        search,
        limit: Number(limit),
        offset
      });

      const total = await userModel.countUsers({
        role,
        status,
        search
      });

      return res.status(200).json({
        success: true,
        users,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Suspend or reactivate a user account with audit logging
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, error: 'isActive boolean is required.' });
      }

      const targetUser = await userModel.findById(id);
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      // Self-lockout prevention
      if (Number(req.user.id) === Number(id) && !isActive) {
        return res.status(400).json({
          success: false,
          error: 'Administrator security constraint: You cannot suspend your own account.'
        });
      }

      // Last active admin prevention
      if (targetUser.role === 'admin' && !isActive) {
        const activeAdmins = await userModel.countActiveAdmins();
        if (activeAdmins <= 1) {
          return res.status(400).json({
            success: false,
            error: 'System protection error: Cannot suspend the only remaining active administrator.'
          });
        }
      }

      const updatedUser = await userModel.updateStatus(id, isActive, reason || null);

      // Record administrative audit log
      await auditLogModel.create({
        adminId: req.user.id,
        action: isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
        entityType: 'user',
        entityId: id,
        oldValue: { is_active: targetUser.is_active, status_reason: targetUser.status_reason },
        newValue: { is_active: isActive ? 1 : 0, status_reason: reason || null },
        reason: reason || (isActive ? 'Administrator reactivation' : 'Administrator suspension'),
        ipAddress: req.ip
      });

      return res.status(200).json({
        success: true,
        user: updatedUser,
        message: `User account has been successfully ${isActive ? 'reactivated' : 'suspended'}.`
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * List equipment for admin moderation
   */
  async listEquipment(req, res, next) {
    try {
      const { category, sharingType, moderationStatus = 'all', search, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const equipment = await equipmentModel.list({
        category,
        sharingType,
        moderationStatus,
        search,
        limit: Number(limit),
        offset
      });

      const total = await equipmentModel.count({
        category,
        sharingType,
        moderationStatus,
        search
      });

      return res.status(200).json({
        success: true,
        equipment,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update equipment moderation status (approve, flag, reject)
   */
  async updateEquipmentModeration(req, res, next) {
    try {
      const { id } = req.params;
      const { moderationStatus, reason } = req.body;

      const validStatuses = ['approved', 'flagged', 'rejected', 'pending'];
      if (!validStatuses.includes(moderationStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid moderation status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const targetEquipment = await equipmentModel.findById(id);
      if (!targetEquipment) {
        return res.status(404).json({ success: false, error: 'Equipment record not found.' });
      }

      const updatedEquipment = await equipmentModel.updateModeration(id, moderationStatus, reason || null);

      // Record administrative audit log
      await auditLogModel.create({
        adminId: req.user.id,
        action: 'EQUIPMENT_MODERATED',
        entityType: 'equipment',
        entityId: id,
        oldValue: {
          moderation_status: targetEquipment.moderation_status,
          moderation_reason: targetEquipment.moderation_reason
        },
        newValue: {
          moderation_status: moderationStatus,
          moderation_reason: reason || null
        },
        reason: reason || `Equipment status updated to ${moderationStatus}`,
        ipAddress: req.ip
      });

      return res.status(200).json({
        success: true,
        equipment: updatedEquipment,
        message: `Equipment status updated to ${moderationStatus}.`
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * List all platform bookings for admin oversight
   */
  async listBookings(req, res, next) {
    try {
      const { status, search, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const bookings = await bookingModel.listAllAdmin({
        status,
        search,
        limit: Number(limit),
        offset
      });

      const total = await bookingModel.countAllAdmin({
        status,
        search
      });

      return res.status(200).json({
        success: true,
        bookings,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin booking override (force status change, handle disputes)
   */
  async overrideBooking(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason, handoverNotes } = req.body;

      const validStatuses = ['pending', 'approved', 'active_loan', 'returned', 'cancelled', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'An administrative override reason is strictly required.'
        });
      }

      const booking = await bookingModel.findById(id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking record not found.' });
      }

      // If approving or activating a loan, check for conflict with other bookings
      if (['approved', 'active_loan'].includes(status)) {
        const overlap = await bookingModel.checkDateOverlap(
          booking.equipment_id,
          booking.start_date,
          booking.end_date,
          id
        );
        if (overlap.hasOverlap) {
          return res.status(409).json({
            success: false,
            error: 'Conflict detected: Another confirmed booking already occupies these equipment dates.',
            conflicts: overlap.conflicts
          });
        }
      }

      const updatedBooking = await bookingModel.updateStatus(id, status, {
        rejectionReason: status === 'rejected' ? reason : null,
        cancellationReason: status === 'cancelled' ? reason : null,
        handoverNotes: handoverNotes || null
      });

      // Record administrative audit log
      await auditLogModel.create({
        adminId: req.user.id,
        action: 'BOOKING_ADMIN_OVERRIDE',
        entityType: 'booking',
        entityId: id,
        oldValue: { status: booking.status },
        newValue: { status },
        reason: reason.trim(),
        ipAddress: req.ip
      });

      return res.status(200).json({
        success: true,
        booking: updatedBooking,
        message: `Booking ${booking.booking_reference} successfully updated to status: ${status}.`
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Query administrative audit logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const { action, entityType, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const logs = await auditLogModel.list({
        action,
        entityType,
        limit: Number(limit),
        offset
      });

      const total = await auditLogModel.count({
        action,
        entityType
      });

      return res.status(200).json({
        success: true,
        logs,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  }
};

export default adminController;
