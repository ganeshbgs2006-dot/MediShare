import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import equipmentRoutes from './equipmentRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Mount API sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);

// Base API index info
router.get('/', (req, res) => {
  res.json({
    name: 'MediShare Community Medical Equipment Sharing API',
    version: '1.0.0',
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
      admin: {
        dashboard: 'GET /api/admin/dashboard',
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
