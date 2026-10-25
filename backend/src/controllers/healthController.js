import { testConnection, getDbStatus } from '../config/db.js';
import { env } from '../config/env.js';

export const healthController = {
  async check(req, res) {
    const dbTest = await testConnection();

    const status = {
      status: dbTest.connected ? 'healthy' : 'degraded',
      service: 'MediShare REST API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.nodeEnv,
      database: {
        connected: dbTest.connected,
        name: env.db.database,
        host: env.db.host,
        port: env.db.port,
        version: dbTest.version || null,
        error: dbTest.error || null
      }
    };

    const httpStatus = dbTest.connected ? 200 : 503;
    res.status(httpStatus).json(status);
  }
};

export default healthController;
