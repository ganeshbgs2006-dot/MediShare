import mysql from 'mysql2/promise';
import { env } from './env.js';

let pool = null;
let isConnected = false;
let lastConnectionError = null;

export function getPool() {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
        waitForConnections: true,
        connectionLimit: env.db.connectionLimit,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        charset: 'utf8mb4'
      });
    } catch (err) {
      lastConnectionError = err.message;
      console.error('[DB] Failed to initialize connection pool:', err.message);
    }
  }
  return pool;
}

/**
 * Test MySQL connectivity and update status
 */
export async function testConnection() {
  try {
    const currentPool = getPool();
    if (!currentPool) {
      throw new Error('Connection pool is not initialized');
    }
    const connection = await currentPool.getConnection();
    const [rows] = await connection.query('SELECT 1 AS connected, DATABASE() as db, VERSION() as version');
    connection.release();
    
    isConnected = true;
    lastConnectionError = null;
    return {
      connected: true,
      database: rows[0].db,
      version: rows[0].version
    };
  } catch (err) {
    isConnected = false;
    lastConnectionError = err.message;
    return {
      connected: false,
      error: err.message,
      code: err.code || 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Execute a parameterized query with automatic connection management
 */
export async function query(sql, params = []) {
  const currentPool = getPool();
  if (!currentPool) {
    throw new Error('Database pool not available: ' + (lastConnectionError || 'Configuration error'));
  }
  const [results] = await currentPool.execute(sql, params);
  return results;
}

export function getDbStatus() {
  return {
    isConnected,
    lastError: lastConnectionError,
    config: {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      database: env.db.database
    }
  };
}

export default {
  getPool,
  testConnection,
  query,
  getDbStatus
};

