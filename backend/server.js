import app from './src/app.js';
import { env } from './src/config/env.js';
import { testConnection } from './src/config/db.js';

const PORT = env.port;

const server = app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(` MediShare Backend API Server running on port ${PORT}`);
  console.log(` Environment: ${env.nodeEnv}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` API root:     http://localhost:${PORT}/api`);
  console.log('====================================================');

  // Verify MySQL connectivity on startup
  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    console.log(`[DB] Successfully connected to MySQL database '${dbStatus.database}' (version ${dbStatus.version})`);
  } else {
    console.warn(`[DB] MySQL connection warning: ${dbStatus.error}`);
    console.warn('[DB] Ensure MySQL is running on port 3306 and database credentials in .env are correct.');
  }
});

// Handle graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[SERVER] Closed remaining connections.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

