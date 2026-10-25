import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { standardRateLimiter, authRateLimiter, exportRateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Disable signature header
app.disable('x-powered-by');

// 1. Security Headers
app.use(securityHeaders);

// 2. CORS Configuration for Vite Frontend
const allowedOrigins = [
  env.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 3. Request body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate Limiting Middleware
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/admin/reports/export', exportRateLimiter);
app.use('/api', standardRateLimiter);

// 5. Static file serving for uploads (sanitized local storage)
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d',
  dotfiles: 'deny'
}));

// 6. Request logger in development
if (env.isDev) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// 7. Mount API Routes under /api
app.use('/api', apiRoutes);

// Root greeting / health redirect
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MediShare API server.',
    healthCheck: '/api/health',
    apiRoot: '/api'
  });
});

// 8. Catch-all 404 and Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
