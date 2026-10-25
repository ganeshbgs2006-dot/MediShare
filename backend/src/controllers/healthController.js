import { testConnection } from '../config/db.js';
import { env } from '../config/env.js';

export const healthController = {
  async check(req, res) {
    const startDb = Date.now();
    const dbTest = await testConnection();
    const dbLatencyMs = Date.now() - startDb;

    const memoryUsage = process.memoryUsage();

    const status = {
      status: dbTest.connected ? 'healthy' : 'degraded',
      service: 'MediShare REST API',
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.nodeEnv,
      memory: {
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      database: {
        connected: dbTest.connected,
        latencyMs: dbLatencyMs,
        // In development only: expose details for debugging. In production: omit host/port.
        ...(env.isDev ? {
          name: env.db.database,
          host: env.db.host,
          port: env.db.port,
          version: dbTest.version || null
        } : {})
      }
    };

    const httpStatus = dbTest.connected ? 200 : 503;
    res.status(httpStatus).json(status);
  }
};

export default healthController;
