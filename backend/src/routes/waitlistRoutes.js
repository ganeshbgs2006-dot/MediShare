import { Router } from 'express';
import { waitlistController } from '../controllers/waitlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Check status can be public or authenticated
router.get('/equipment/:equipmentId/status', (req, res, next) => {
  // Optional auth
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, () => waitlistController.getStatusForEquipment(req, res, next));
  }
  return waitlistController.getStatusForEquipment(req, res, next);
});

// Authenticated waitlist operations
router.use(authenticateToken);
router.post('/', waitlistController.joinWaitlist);
router.get('/my', waitlistController.getMyWaitlist);
router.delete('/:id', waitlistController.leaveWaitlist);
router.delete('/equipment/:equipmentId', waitlistController.leaveByEquipment);

export default router;

