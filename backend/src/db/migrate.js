import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('[MIGRATE] Starting database migrations for MediShare...');
  console.log(`[MIGRATE] Connecting to MySQL at ${env.db.host}:${env.db.port} as '${env.db.user}'...`);

  let connection;
  try {
    // Connect without database first to ensure medishare exists
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true
    });

    console.log('[MIGRATE] Connection established. Reading schema.sql...');
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[MIGRATE] Executing schema statements...');
    await connection.query(sql);

    console.log('[MIGRATE] Schema created / verified successfully.');

    // Verify created tables
    await connection.query(`USE \`${env.db.database}\`;`);
    const [tables] = await connection.query('SHOW TABLES;');
    const tableNames = tables.map((t) => Object.values(t)[0]);
    console.log(`[MIGRATE] Found ${tableNames.length} tables in database '${env.db.database}':`);
    tableNames.forEach((t) => console.log(`  - ${t}`));

    console.log('[MIGRATE] Migration completed successfully.');
    await connection.end();
    return { success: true, tables: tableNames };
  } catch (err) {
    console.error('[MIGRATE] Migration failed:', err.message);
    if (connection) await connection.end();
    throw err;
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runMigrations };
