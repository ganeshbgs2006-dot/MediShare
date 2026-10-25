import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

async function seedDatabase() {
  console.log('[SEED] Seeding initial users into MediShare database...');

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database
  });

  try {
    const saltRounds = 10;
    const adminPassHash = await bcrypt.hash('Admin@123', saltRounds);
    const partnerPassHash = await bcrypt.hash('Partner@123', saltRounds);
    const seekerPassHash = await bcrypt.hash('Seeker@123', saltRounds);

    const usersToSeed = [
      {
        fullName: 'MediShare System Administrator',
        email: 'admin@medishare.org',
        passwordHash: adminPassHash,
        phone: '+91 98765 43210',
        role: 'admin',
        organizationName: 'MediShare Safety Coordination Council',
        serviceArea: 'Central Metro',
        isVerified: 1
      },
      {
        fullName: 'St. Jude Community Health Cell',
        email: 'partner@stjude.org',
        passwordHash: partnerPassHash,
        phone: '+91 98765 11223',
        role: 'owner',
        organizationName: 'St. Jude Health Clinic',
        serviceArea: 'North Campus District, Metro',
        isVerified: 1
      },
      {
        fullName: 'Priya Sharma (Care Seeker)',
        email: 'priya.seeker@example.com',
        passwordHash: seekerPassHash,
        phone: '+91 98765 99887',
        role: 'seeker',
        organizationName: null,
        serviceArea: 'South Metro Extension',
        isVerified: 1
      }
    ];

    for (const u of usersToSeed) {
      const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO users (full_name, email, password_hash, phone, role, organization_name, service_area, is_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.fullName, u.email, u.passwordHash, u.phone, u.role, u.organizationName, u.serviceArea, u.isVerified]
        );
        console.log(`[SEED] Created default ${u.role} user: ${u.email}`);
      } else {
        console.log(`[SEED] User already exists: ${u.email}`);
      }
    }

    console.log('[SEED] Seeding completed.');
  } finally {
    await connection.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Error:', err.message);
      process.exit(1);
    });
}

export { seedDatabase };
