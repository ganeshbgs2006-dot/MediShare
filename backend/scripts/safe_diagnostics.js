import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

async function runSafeDiagnostics() {
  console.log('====================================================');
  console.log(' MediShare Backend — Safe Diagnostic Tool');
  console.log('====================================================\n');

  console.log('1. ENVIRONMENT CONFIGURATION CHECK (Sanitized):');
  console.log('   DB_HOST:     ', JSON.stringify(env.db.host));
  console.log('   DB_PORT:     ', env.db.port, `(${typeof env.db.port})`);
  console.log('   DB_USER:     ', JSON.stringify(env.db.user));
  console.log('   DB_NAME:     ', JSON.stringify(env.db.database));
  console.log('   DB_PASSWORD configured: ', Boolean(env.db.password));
  console.log('   DB_PASSWORD length:     ', env.db.password ? env.db.password.length : 0);
  console.log('   Has leading/trailing whitespace:', env.db.password ? env.db.password.trim() !== env.db.password : false);
  console.log('   Enclosed in quotes:     ', env.db.password ? (
    (env.db.password.startsWith('"') && env.db.password.endsWith('"')) ||
    (env.db.password.startsWith("'") && env.db.password.endsWith("'"))
  ) : false);

  // Check raw backend/.env line for inline comments without exposing secret
  const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf8');
  const passLine = envContent.split(/\r?\n/).find(l => l.startsWith('DB_PASSWORD='));
  if (passLine) {
    const rawVal = passLine.substring('DB_PASSWORD='.length);
    const hasHash = rawVal.includes('#');
    const isQuoted = (rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"));
    console.log('   Raw .env line contains "#": ', hasHash);
    console.log('   Raw .env line is quoted:    ', isQuoted);
    console.log('   Raw .env line total length: ', rawVal.length);
    if (hasHash && !isQuoted) {
      console.log('   [CRITICAL FINDING] An unquoted "#" in .env was treated by dotenv as an inline comment!');
      console.log(`   dotenv parsed only ${env.db.password.length} chars instead of the full ${rawVal.length} chars.`);
      
      console.log('\n3. TESTING UN-TRUNCATED (QUOTED) PASSWORD CANDIDATE:');
      try {
        const testConn = await mysql.createConnection({
          host: env.db.host,
          port: env.db.port,
          user: env.db.user,
          password: rawVal,
          database: env.db.database
        });
        const [res] = await testConn.query('SELECT CURRENT_USER() AS `user`, DATABASE() AS `db`, VERSION() AS `version`');
        console.log('   [SUCCESS!] Connecting with the FULL 15-character password succeeded!');
        console.log(`             Authenticated as: ${res[0].user} | DB: ${res[0].db}`);
        await testConn.end();
      } catch (err) {
        console.log('   [RESULT] Test with un-truncated string failed:');
        console.log(`            Error: [${err.code || 'UNKNOWN'}] ${err.sqlState ? `(SQLSTATE: ${err.sqlState})` : ''} ${err.message}`);
      }
    }
  }

  console.log('\n2. TESTING CONNECTIVITY MATRIX:');

  const testCases = [
    { label: `Target: ${env.db.host}:${env.db.port} without database`, host: env.db.host, database: undefined },
    { label: `Target: ${env.db.host}:${env.db.port} with database '${env.db.database}'`, host: env.db.host, database: env.db.database },
    { label: `Target: 127.0.0.1:${env.db.port} without database`, host: '127.0.0.1', database: undefined },
    { label: `Target: 127.0.0.1:${env.db.port} with database '${env.db.database}'`, host: '127.0.0.1', database: env.db.database },
    { label: `Target: ::1:${env.db.port} (IPv6) without database`, host: '::1', database: undefined }
  ];

  for (const tc of testCases) {
    try {
      const conn = await mysql.createConnection({
        host: tc.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: tc.database
      });

      const [res] = await conn.query('SELECT CURRENT_USER() AS `user`, DATABASE() AS `db`, VERSION() AS `version`');
      console.log(`   [SUCCESS] ${tc.label}`);
      console.log(`             Authenticated as: ${res[0].user} | DB: ${res[0].db || '(none)'}`);

      if (tc.database) {
        const [grants] = await conn.query('SHOW GRANTS FOR CURRENT_USER()');
        console.log('             User Grants:');
        grants.forEach(g => console.log('               *', Object.values(g)[0]));
      }

      await conn.end();
    } catch (err) {
      console.log(`   [FAILED]  ${tc.label}`);
      console.log(`             Error: [${err.code || 'UNKNOWN'}] ${err.sqlState ? `(SQLSTATE: ${err.sqlState})` : ''} ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log(' Diagnostic test sequence completed.');
  console.log('====================================================');
}

runSafeDiagnostics().catch((err) => {
  console.error('Diagnostic error:', err.message);
  process.exit(1);
});
