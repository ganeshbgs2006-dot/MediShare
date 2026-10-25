import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';

const router = Router();

// Mount API sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Base API index info
router.get('/', (req, res) => {
  res.json({
    name: 'MediShare Community Medical Equipment Sharing API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: 'GET /api/health',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      authMe: 'GET /api/auth/me',
      authLogout: 'POST /api/auth/logout'
    }
  });
});

export default router;

