import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import equipmentRoutes from './equipmentRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import adminRoutes from './adminRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import waitlistRoutes from './waitlistRoutes.js';

const router = Router();

// Mount API sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/waitlist', waitlistRoutes);
router.use('/admin', adminRoutes);

// Base API index info
router.get('/', (req, res) => {
  res.json({
    name: 'MediShare Community Medical Equipment Sharing API',
    version: '1.2.0',
    documentation: '/api/docs',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      },
      equipment: {
        list: 'GET /api/equipment',
        details: 'GET /api/equipment/:id',
        availability: 'GET /api/equipment/:id/availability',
        myEquipment: 'GET /api/equipment/my/owner'
      },
      bookings: {
        create: 'POST /api/bookings',
        myBookings: 'GET /api/bookings/my',
        ownerBookings: 'GET /api/bookings/owner',
        details: 'GET /api/bookings/:id',
        updateStatus: 'PATCH /api/bookings/:id/status',
        cancel: 'PATCH /api/bookings/:id/cancel'
      },
      notifications: {
        list: 'GET /api/notifications',
        unreadCount: 'GET /api/notifications/unread-count',
        markRead: 'PATCH /api/notifications/:id/read',
        markAllRead: 'PATCH /api/notifications/read-all',
        dismiss: 'DELETE /api/notifications/:id'
      },
      reviews: {
        create: 'POST /api/reviews',
        equipmentReviews: 'GET /api/reviews/equipment/:equipmentId',
        bookingReview: 'GET /api/reviews/booking/:bookingId'
      },
      waitlist: {
        join: 'POST /api/waitlist',
        myWaitlist: 'GET /api/waitlist/my',
        status: 'GET /api/waitlist/equipment/:equipmentId/status',
        leave: 'DELETE /api/waitlist/:id'
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard',
        queues: 'GET /api/admin/queues',
        resolveDispute: 'PATCH /api/admin/disputes/:id/resolve',
        exportCsv: 'GET /api/admin/reports/export',
        reminders: 'POST /api/admin/reminders/run',
        users: 'GET /api/admin/users',
        updateUserStatus: 'PATCH /api/admin/users/:id/status',
        equipment: 'GET /api/admin/equipment',
        moderateEquipment: 'PATCH /api/admin/equipment/:id/moderation',
        bookings: 'GET /api/admin/bookings',
        overrideBooking: 'PATCH /api/admin/bookings/:id/override',
        auditLogs: 'GET /api/admin/audit-logs'
      }
    }
  });
});

export default router;
