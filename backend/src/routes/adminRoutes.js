import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';

const router = Router();

// Protect all admin endpoints: must be authenticated and have role 'admin'
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Platform overview metrics
router.get('/dashboard', adminController.getDashboardMetrics);

// User governance & suspension
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Equipment moderation
router.get('/equipment', adminController.listEquipment);
router.patch('/equipment/:id/moderation', adminController.updateEquipmentModeration);

// Booking oversight & administrative override
router.get('/bookings', adminController.listBookings);
router.patch('/bookings/:id/override', adminController.overrideBooking);

// Regulatory audit trail
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
