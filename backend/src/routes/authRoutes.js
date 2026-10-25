import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validate.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegistration, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me (Protected)
router.get('/me', authenticateToken, authController.me);

// POST /api/auth/logout
router.post('/logout', authController.logout);

export default router;

