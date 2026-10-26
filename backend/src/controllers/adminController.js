import { query } from '../config/db.js';
import { userModel } from '../models/userModel.js';
import { equipmentModel } from '../models/equipmentModel.js';
import { bookingModel } from '../models/bookingModel.js';
import { auditLogModel } from '../models/auditLogModel.js';
import { reviewModel } from '../models/reviewModel.js';
import { waitlistModel } from '../models/waitlistModel.js';
import { conditionLogModel } from '../models/conditionLogModel.js';
import { reminderService } from '../services/reminderService.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Sanitize cell values for CSV export to strictly prevent Spreadsheet Formula Injection (CSV Injection).
 * Prepend a single quote if string begins with =, +, -, @, tab, or carriage return.
 */
function sanitizeCsvValue(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const adminController = {
  /**
   * Get administrative dashboard metrics with date-range filtering & time-series trends
   */
  async getDashboardMetrics(req, res, next) {
    try {
      const { range = '30d' } = req.query;

      // 1. User metrics
      const userRows = await query(`
        SELECT role, is_active, COUNT(*) as cnt
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
      const equipmentByModeration = { approved: 0, pending: 0, flagged: 0, rejected: 0 };
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

      // 4. Overdue loans
      const overdueRows = await query(`
        SELECT COUNT(*) AS total
        FROM bookings
        WHERE status = 'active_loan' AND end_date < CURDATE()
      `);
      const overdueLoansCount = overdueRows[0]?.total || 0;

      // 5. Open disputes
      const openDisputesCount = await conditionLogModel.countOpenDisputes();

      // 6. Review metrics
      const reviewRows = await query(`
        SELECT COUNT(*) as total, COALESCE(AVG(rating), 0) as avg_rating
        FROM reviews
        WHERE moderation_status = 'approved'
      `);
      const totalReviews = reviewRows[0]?.total || 0;
      const averageRating = Number(Number(reviewRows[0]?.avg_rating || 0).toFixed(1));

      // 7. Active waitlist count
      const waitlistRows = await query(`
        SELECT COUNT(*) as total FROM waitlist WHERE status = 'active'
      `);
      const activeWaitlistCount = waitlistRows[0]?.total || 0;

      // 8. Trends (Daily breakdown for the selected range)
      const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
      const userTrends = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= CURDATE() - INTERVAL ? DAY
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [days]);

      const bookingTrends = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM bookings
        WHERE created_at >= CURDATE() - INTERVAL ? DAY
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [days]);

      // 9. Recent 5 users
      const recentUsers = await query(`
        SELECT id, full_name, email, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);

      // 10. Recent 5 bookings
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
          range,
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
            byStatus: bookingsByStatus,
            overdue: overdueLoansCount
          },
          operational: {
            openDisputes: openDisputesCount,
            activeWaitlist: activeWaitlistCount,
            totalReviews,
            averageRating
          },
          trends: {
            users: userTrends,
            bookings: bookingTrends
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
   * Operational queues requiring administrator attention
   */
  async getOperationalQueues(req, res, next) {
    try {
      // 1. Overdue Returns
      const overdueSql = `
        SELECT 
          b.id,
          b.booking_reference,
          b.start_date,
          b.end_date,
          e.name AS equipment_name,
          seeker.full_name AS seeker_name,
          seeker.phone AS seeker_phone,
          owner.full_name AS owner_name
        FROM bookings b
        JOIN equipment e ON b.equipment_id = e.id
        JOIN users seeker ON b.seeker_id = seeker.id
        JOIN users owner ON e.owner_id = owner.id
        WHERE b.status = 'active_loan'
          AND b.end_date < CURDATE()
        ORDER BY b.end_date ASC
      `;
      const overdueReturns = await query(overdueSql);

      // 2. Open Condition Disputes
      const openDisputes = await conditionLogModel.listDisputes({ resolved: false });

      // 3. Pending Equipment Moderation
      const pendingEquipmentSql = `
        SELECT e.id, e.name, e.category, e.created_at, u.full_name AS owner_name
        FROM equipment e
        JOIN users u ON e.owner_id = u.id
        WHERE e.moderation_status = 'pending'
        ORDER BY e.created_at ASC
      `;
      const pendingEquipment = await query(pendingEquipmentSql);

      // 4. Flagged Reviews
      const flaggedReviewsSql = `
        SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS reviewer_name, e.name AS equipment_name
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        JOIN equipment e ON r.equipment_id = e.id
        WHERE r.moderation_status = 'flagged'
        ORDER BY r.created_at ASC
      `;
      const flaggedReviews = await query(flaggedReviewsSql);

      // 5. Pending Owner Applications
      const pendingOwnersSql = `
        SELECT id, full_name, email, phone, organization_name, service_area, created_at
        FROM users
        WHERE role = 'owner' AND approval_status = 'pending'
        ORDER BY created_at ASC
      `;
      const pendingOwners = await query(pendingOwnersSql);

      return res.status(200).json({
        success: true,
        queues: {
          overdueReturns,
          openDisputes,
          pendingEquipment,
          flaggedReviews,
          pendingOwners
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Resolve condition dispute
   */
  async resolveDispute(req, res, next) {
    try {
      const { id } = req.params;
      const { resolution } = req.body;

      if (!resolution || !resolution.trim()) {
        return res.status(400).json({ success: false, error: 'A resolution explanation is required.' });
      }

      const dispute = await conditionLogModel.findById(id);
      if (!dispute) {
        return res.status(404).json({ success: false, error: 'Dispute record not found.' });
      }

      const resolved = await conditionLogModel.resolveDispute(id, resolution);

      // Audit log
      await auditLogModel.create({
        adminId: req.user.id,
        action: 'DISPUTE_RESOLVED',
        entityType: 'booking',
        entityId: dispute.booking_id,
        oldValue: { is_disputed: dispute.is_disputed, dispute_resolved: 0 },
        newValue: { dispute_resolved: 1, dispute_resolution: resolution },
        reason: resolution,
        ipAddress: req.ip
      });

      return res.status(200).json({
        success: true,
        message: 'Condition inspection dispute resolved.',
        dispute: resolved
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Secure CSV Export with Formula Injection Protection
   */
  async exportReportCsv(req, res, next) {
    try {
      const { type = 'bookings' } = req.query;

      let filename = `medishare-${type}-${Date.now()}.csv`;
      let headers = [];
      let rows = [];

      if (type === 'bookings') {
        headers = ['Booking Ref', 'Equipment', 'Category', 'Seeker', 'Seeker Email', 'Owner', 'Start Date', 'End Date', 'Status', 'Total Price', 'Created At'];
        const data = await query(`
          SELECT 
            b.booking_reference,
            e.name AS equipment_name,
            e.category,
            seeker.full_name AS seeker_name,
            seeker.email AS seeker_email,
            owner.full_name AS owner_name,
            b.start_date,
            b.end_date,
            b.status,
            b.total_price,
            b.created_at
          FROM bookings b
          JOIN equipment e ON b.equipment_id = e.id
          JOIN users seeker ON b.seeker_id = seeker.id
          JOIN users owner ON e.owner_id = owner.id
          ORDER BY b.created_at DESC
          LIMIT 1000
        `);

        rows = data.map(r => [
          r.booking_reference,
          r.equipment_name,
          r.category,
          r.seeker_name,
          r.seeker_email,
          r.owner_name,
          r.start_date,
          r.end_date,
          r.status,
          r.total_price,
          r.created_at
        ]);
      } else if (type === 'equipment') {
        headers = ['ID', 'Name', 'Category', 'Sharing Type', 'Price/Day', 'Availability', 'Moderation', 'Owner Name', 'Service Area', 'Created At'];
        const data = await query(`
          SELECT e.id, e.name, e.category, e.sharing_type, e.price_per_day, e.availability_status, e.moderation_status, u.full_name AS owner_name, e.service_area, e.created_at
          FROM equipment e
          JOIN users u ON e.owner_id = u.id
          ORDER BY e.created_at DESC
          LIMIT 1000
        `);

        rows = data.map(r => [
          r.id,
          r.name,
          r.category,
          r.sharing_type,
          r.price_per_day,
          r.availability_status,
          r.moderation_status,
          r.owner_name,
          r.service_area,
          r.created_at
        ]);
      } else if (type === 'users') {
        // Excludes password_hash, tokens, and sensitive private authentication details
        headers = ['ID', 'Full Name', 'Email', 'Role', 'Organization', 'Service Area', 'Is Verified', 'Is Active', 'Created At'];
        const data = await query(`
          SELECT id, full_name, email, role, organization_name, service_area, is_verified, is_active, created_at
          FROM users
          ORDER BY created_at DESC
          LIMIT 1000
        `);

        rows = data.map(r => [
          r.id,
          r.full_name,
          r.email,
          r.role,
          r.organization_name,
          r.service_area,
          r.is_verified ? 'Yes' : 'No',
          r.is_active ? 'Active' : 'Suspended',
          r.created_at
        ]);
      } else if (type === 'reviews') {
        headers = ['Review ID', 'Booking ID', 'Equipment', 'Reviewer', 'Rating', 'Comment', 'Moderation', 'Created At'];
        const data = await query(`
          SELECT r.id, r.booking_id, e.name AS equipment_name, u.full_name AS reviewer_name, r.rating, r.comment, r.moderation_status, r.created_at
          FROM reviews r
          JOIN equipment e ON r.equipment_id = e.id
          JOIN users u ON r.reviewer_id = u.id
          ORDER BY r.created_at DESC
          LIMIT 1000
        `);

        rows = data.map(r => [
          r.id,
          r.booking_id,
          r.equipment_name,
          r.reviewer_name,
          r.rating,
          r.comment,
          r.moderation_status,
          r.created_at
        ]);
      } else if (type === 'audit') {
        headers = ['Log ID', 'Timestamp', 'Admin Name', 'Admin Email', 'Action', 'Entity Type', 'Entity ID', 'Reason', 'IP Address'];
        const data = await query(`
          SELECT a.id, a.created_at, u.full_name AS admin_name, u.email AS admin_email, a.action, a.entity_type, a.entity_id, a.reason, a.ip_address
          FROM audit_logs a
          JOIN users u ON a.admin_id = u.id
          ORDER BY a.created_at DESC
          LIMIT 1000
        `);

        rows = data.map(r => [
          r.id,
          r.created_at,
          r.admin_name,
          r.admin_email,
          r.action,
          r.entity_type,
          r.entity_id,
          r.reason,
          r.ip_address
        ]);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid report export type specified.' });
      }

      // Build CSV text with strict formula injection sanitization
      const headerLine = headers.map(h => sanitizeCsvValue(h)).join(',');
      const dataLines = rows.map(r => r.map(c => sanitizeCsvValue(c)).join(','));
      const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n'); // UTF-8 BOM for Excel

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Run scheduled background reminders on-demand
   */
  async runScheduledReminders(req, res, next) {
    try {
      const results = await reminderService.runScheduledReminders();
      return res.status(200).json({
        success: true,
        message: 'Scheduled reminder check completed.',
        results
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
  },

  /**
   * List pending equipment owner applications awaiting administrator review
   */
  async getPendingOwners(req, res, next) {
    try {
      const { search = '', page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const owners = await userModel.listUsers({
        role: 'owner',
        approvalStatus: 'pending',
        search,
        limit: Number(limit),
        offset
      });

      const total = await userModel.countUsers({
        role: 'owner',
        approvalStatus: 'pending',
        search
      });

      return res.status(200).json({
        success: true,
        owners,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Review and approve or reject an owner / partner application
   */
  async updateOwnerApproval(req, res, next) {
    try {
      const { id } = req.params;
      const { approvalStatus, reason } = req.body;

      if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
        return res.status(400).json({
          success: false,
          error: "Invalid approvalStatus. Must be 'approved', 'rejected', or 'pending'."
        });
      }

      const targetUser = await userModel.findById(id);
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
      }

      if (targetUser.role !== 'owner') {
        return res.status(400).json({
          success: false,
          error: 'Only Equipment Owner accounts undergo partner verification.'
        });
      }

      const updatedUser = await userModel.updateApprovalStatus(id, approvalStatus, {
        reason: reason || null,
        approvedBy: req.user.id
      });

      // Audit log
      await auditLogModel.create({
        adminId: req.user.id,
        action: approvalStatus === 'approved' ? 'OWNER_APPROVED' : 'OWNER_REJECTED',
        entityType: 'user',
        entityId: id,
        oldValue: { approval_status: targetUser.approval_status, approval_reason: targetUser.approval_reason },
        newValue: { approval_status: approvalStatus, approval_reason: reason || null },
        reason: reason || `Owner account verification set to ${approvalStatus}`,
        ipAddress: req.ip
      });

      // In-app notification
      try {
        await notificationService.notifyUser(id, {
          type: approvalStatus === 'approved' ? 'owner_approved' : 'owner_rejected',
          title: approvalStatus === 'approved' ? 'Partner Account Approved!' : 'Partner Account Verification Update',
          message: approvalStatus === 'approved'
            ? 'Congratulations! Your equipment owner account has been approved by the platform team. You can now publish and manage medical equipment listings in the marketplace.'
            : `Your equipment owner account verification was not approved: ${reason || 'Please contact platform administration for guidance.'}`,
          relatedEntityType: 'user',
          relatedEntityId: id
        });
      } catch (notifErr) {
        console.error('[Admin] Failed to send approval notification:', notifErr.message);
      }

      return res.status(200).json({
        success: true,
        user: updatedUser,
        message: `Owner account has been successfully ${approvalStatus}.`
      });
    } catch (err) {
      next(err);
    }
  }
};

export default adminController;
