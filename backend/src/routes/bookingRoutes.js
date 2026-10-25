import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';

const router = Router();

// All booking operations require an active authenticated user session
router.use(authenticateToken);

// 1. Seeker routes
router.post('/', bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);

// 2. Owner routes
router.get('/owner', authorizeRoles('owner', 'admin'), bookingController.getOwnerBookings);

// 3. Single booking operations
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/status', bookingController.updateStatus);
router.patch('/:id/cancel', bookingController.cancelBooking);

export default router;
