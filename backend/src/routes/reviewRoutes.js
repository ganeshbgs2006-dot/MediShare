import { Router } from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';

const router = Router();

// Public review retrieval
router.get('/equipment/:equipmentId', reviewController.getEquipmentReviews);

// Authenticated seeker/owner review operations
router.post('/', authenticateToken, reviewController.createReview);
router.get('/booking/:bookingId', authenticateToken, reviewController.getBookingReview);

// Administrative review moderation
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), reviewController.adminListReviews);
router.patch('/admin/:id/moderation', authenticateToken, authorizeRoles('admin'), reviewController.adminModerateReview);

export default router;
