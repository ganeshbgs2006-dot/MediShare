import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';

const router = Router();

// Protect all admin endpoints: must be authenticated and have role 'admin'
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Platform overview metrics & date-range trends
router.get('/dashboard', adminController.getDashboardMetrics);

// Operational work queues (Overdue returns, Disputes, Moderation)
router.get('/queues', adminController.getOperationalQueues);
router.patch('/disputes/:id/resolve', adminController.resolveDispute);

// Secure CSV Report Export
router.get('/reports/export', adminController.exportReportCsv);

// Background reminder check trigger
router.post('/reminders/run', adminController.runScheduledReminders);

// User governance & suspension
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/owners/pending', adminController.getPendingOwners);
router.patch('/users/:id/approval', adminController.updateOwnerApproval);

// Equipment moderation
router.get('/equipment', adminController.listEquipment);
router.patch('/equipment/:id/moderation', adminController.updateEquipmentModeration);

// Booking oversight & administrative override
router.get('/bookings', adminController.listBookings);
router.patch('/bookings/:id/override', adminController.overrideBooking);

// Regulatory audit trail
router.get('/audit-logs', adminController.getAuditLogs);

export default router;

