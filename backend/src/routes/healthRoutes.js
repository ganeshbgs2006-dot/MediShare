import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

// GET /api/health
router.get('/', healthController.check);

export default router;

