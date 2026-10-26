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
    // Connect directly to target database
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      multipleStatements: true
    });

    console.log('[MIGRATE] Connection established. Reading schema.sql...');
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[MIGRATE] Executing schema statements...');
    await connection.query(sql);

    console.log('[MIGRATE] Schema created / verified successfully.');

    // Helper to safely add column if not existing in MySQL
    async function addCol(tableName, colName, colDef) {
      const [exists] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [env.db.database, tableName, colName]
      );
      if (exists.length === 0) {
        await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${colDef}`);
        console.log(`[MIGRATE] Added column '${colName}' to table '${tableName}'`);
      }
    }

    // 1. Users table enhancements
    await addCol('users', 'is_active', 'BOOLEAN NOT NULL DEFAULT 1 AFTER is_verified');
    await addCol('users', 'status_reason', 'VARCHAR(255) NULL AFTER is_active');
    await addCol('users', 'approval_status', "ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' AFTER is_active");
    await addCol('users', 'approval_reason', 'VARCHAR(255) NULL AFTER approval_status');
    await addCol('users', 'approved_by', 'INT NULL AFTER approval_reason');
    await addCol('users', 'approved_at', 'TIMESTAMP NULL AFTER approved_by');

    // Ensure any unverified owner accounts require administrator approval
    await connection.query("UPDATE users SET approval_status = 'pending' WHERE role = 'owner' AND is_verified = 0");

    // 2. Equipment table enhancements
    await addCol('equipment', 'moderation_status', "ENUM('pending', 'approved', 'rejected', 'flagged') NOT NULL DEFAULT 'approved' AFTER availability_status");
    await addCol('equipment', 'moderation_reason', 'TEXT NULL AFTER moderation_status');
    await addCol('equipment', 'video_url', 'VARCHAR(500) NULL AFTER image_url');

    // 3. Bookings table enhancements
    await addCol('bookings', 'seeker_message', 'TEXT NULL AFTER handover_notes');
    await addCol('bookings', 'rejection_reason', 'TEXT NULL AFTER seeker_message');
    await addCol('bookings', 'cancellation_reason', 'TEXT NULL AFTER rejection_reason');
    await addCol('bookings', 'seeker_return_video_url', 'VARCHAR(500) NULL AFTER cancellation_reason');
    await addCol('bookings', 'seeker_return_notes', 'TEXT NULL AFTER seeker_return_video_url');
    await addCol('bookings', 'seeker_return_submitted_at', 'TIMESTAMP NULL AFTER seeker_return_notes');
    await addCol('bookings', 'owner_return_video_url', 'VARCHAR(500) NULL AFTER seeker_return_submitted_at');
    await addCol('bookings', 'owner_return_notes', 'TEXT NULL AFTER owner_return_video_url');
    await addCol('bookings', 'owner_return_submitted_at', 'TIMESTAMP NULL AFTER owner_return_notes');
    await addCol('bookings', 'return_status', "ENUM('none', 'seeker_submitted', 'owner_submitted', 'both_submitted', 'disputed', 'completed') NOT NULL DEFAULT 'none' AFTER owner_return_submitted_at");
    await addCol('bookings', 'handover_condition_grade', "ENUM('Good', 'Fair', 'Needs Inspection') NULL AFTER return_status");
    await addCol('bookings', 'return_condition_grade', "ENUM('Good', 'Fair', 'Needs Inspection') NULL AFTER handover_condition_grade");
    await addCol('bookings', 'is_disputed', 'BOOLEAN NOT NULL DEFAULT 0 AFTER return_condition_grade');
    await addCol('bookings', 'dispute_reason', 'TEXT NULL AFTER is_disputed');

    // 4. Audit logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type ENUM('user', 'equipment', 'booking', 'system') NOT NULL,
        entity_id INT NOT NULL,
        old_value JSON NULL,
        new_value JSON NULL,
        reason TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_audit_admin (admin_id),
        INDEX idx_audit_entity (entity_type, entity_id),
        INDEX idx_audit_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[MIGRATE] Verified audit_logs table.');

    // 5. Phase 6 & Phase 7 enhancements
    await addCol('condition_logs', 'is_disputed', 'BOOLEAN NOT NULL DEFAULT 0 AFTER verified_by_owner');
    await addCol('condition_logs', 'dispute_reason', 'TEXT NULL AFTER is_disputed');
    await addCol('condition_logs', 'dispute_resolved', 'BOOLEAN NOT NULL DEFAULT 0 AFTER dispute_reason');
    await addCol('condition_logs', 'dispute_resolution', 'TEXT NULL AFTER dispute_resolved');

    try {
      await connection.query(`
        ALTER TABLE audit_logs
        MODIFY COLUMN entity_type ENUM('user', 'equipment', 'booking', 'system', 'review', 'waitlist') NOT NULL;
      `);
      console.log('[MIGRATE] Updated audit_logs entity_type ENUM.');
    } catch (e) {
      console.warn('[MIGRATE] audit_logs entity_type update notice:', e.message);
    }

    try {
      await connection.query(`
        ALTER TABLE notifications
        MODIFY COLUMN entity_type ENUM('booking', 'equipment', 'review', 'waitlist', 'system', 'user') NOT NULL DEFAULT 'system';
      `);
      console.log('[MIGRATE] Updated notifications entity_type ENUM.');
    } catch (e) {
      console.warn('[MIGRATE] notifications entity_type update notice:', e.message);
    }

    // 6. Seed equipment if empty
    try {
      const { seedEquipment } = await import('./seedEquipment.js');
      await seedEquipment();
    } catch (seedErr) {
      console.warn('[MIGRATE] Equipment seed notice:', seedErr.message);
    }

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

