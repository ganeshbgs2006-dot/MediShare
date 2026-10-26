import { Router } from 'express';
import { equipmentController } from '../controllers/equipmentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles, requireApprovedOwner } from '../middleware/role.js';

const router = Router();

// Public equipment listings for marketplace
router.get('/', equipmentController.listEquipment);

// Owner equipment inventory (must be before /:id)
router.get('/my/owner', authenticateToken, authorizeRoles('owner', 'admin'), equipmentController.getMyEquipment);

// Equipment details and availability checks
router.get('/:id', equipmentController.getEquipmentById);
router.get('/:id/availability', equipmentController.checkAvailability);

// Equipment creation, updates, and deletion (restricted to approved owners and admins)
router.post('/', authenticateToken, requireApprovedOwner, equipmentController.createEquipment);
router.put('/:id', authenticateToken, requireApprovedOwner, equipmentController.updateEquipment);
router.delete('/:id', authenticateToken, requireApprovedOwner, equipmentController.deleteEquipment);

export default router;

