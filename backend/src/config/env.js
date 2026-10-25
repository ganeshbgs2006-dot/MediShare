import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

// 1. Standard dotenv loader
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvPath });

/**
 * Resilient parser that prevents dotenv from truncating passwords
 * or secrets containing unquoted '#' symbols as inline comments.
 */
function protectUnquotedSpecialChars(envFilePath) {
  if (!fs.existsSync(envFilePath)) return;
  try {
    const rawContent = fs.readFileSync(envFilePath, 'utf8');
    const lines = rawContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;

      const key = line.substring(0, eqIdx).trim();
      let val = line.substring(eqIdx + 1).trim();

      // If wrapped in single or double quotes, unwrap them
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.substring(1, val.length - 1);
      }

      // If dotenv truncated the value at an unquoted '#', restore the full raw string
      if (!process.env[key] || process.env[key].length < val.length) {
        process.env[key] = val;
      }
    }
  } catch {
    // Ignore file read errors
  }
}

protectUnquotedSpecialChars(backendEnvPath);
protectUnquotedSpecialChars(rootEnvPath);

export const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medishare',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'medishare_super_secure_jwt_secret_change_me_in_production_32chars!',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

