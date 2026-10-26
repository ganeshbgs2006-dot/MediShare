# MediShare — Production Deployment & Operational Architecture Guide

## Executive Overview
**MediShare** is a full-stack community medical assistive equipment sharing platform designed for safety, operational reliability, regulatory auditability, and clinical governance.

This guide outlines the production deployment topology, security hardening checklists, container configurations, multi-cloud hosting guides, and database backup protocols.

---

## 1. Production Readiness Audit & Checklist

Prior to launching MediShare into a live production environment, complete the following categorized verification steps:

### 🚨 Blocker Severity (Must Be Resolved Before Any Public Launch)
- [x] **Database Isolation**: The `medishare` database is isolated from personal or third-party databases.
- [x] **Production Secrets**: Generate a 64-character cryptographically random `JWT_SECRET` (`openssl rand -hex 32`). Do not use default or placeholder keys.
- [x] **Root Access Prohibition**: The backend must connect via a dedicated least-privilege user account (`medishare_app`), never MySQL `root`.
- [x] **Formula Injection Defense**: All tabular data exported via CSV must prepend a single quote (`'`) to cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` (CWE-1236 defense).
- [x] **Sensitive Data Leakage**: User password hashes and JWT tokens are stripped from all API responses, audit logs, and CSV exports.

### ⚠️ High Severity (Operational & Security Best Practices)
- [x] **Sliding-Window Rate Limiting**: Auth endpoints throttled to 30 requests/15m; general API throttled to 500 requests/15m to block brute-force credential stuffing and DoS attacks.
- [x] **HTTP Security Headers**: Set `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, and eliminate `X-Powered-By: Express`.
- [x] **Database Transaction Rollbacks**: Concurrent booking attempts wrapped in atomic database checks and transactions to eliminate double-booking race conditions.
- [ ] **HTTPS / TLS Enforcement**: All traffic must terminate via TLS 1.3 certificates (e.g., Let's Encrypt / Cloudflare).

### 📋 Medium Severity (Observability & Reliability)
- [x] **Graceful Shutdown**: Node.js processes handle `SIGTERM` and `SIGINT` signals with `dumb-init` in Docker to drain active HTTP connections cleanly.
- [x] **Automated Reminders**: Background loan reminder evaluation for overdue equipment and upcoming handovers.
- [x] **Health Check Endpoint**: `GET /api/health` reports system uptime, memory usage, latency, and database connectivity.
- [ ] **Automated Off-Site Backups**: Nightly cron-driven `mysqldump` pushed to encrypted S3 / Cloud Storage buckets.

### 💡 Low Severity (Maintenance & Scaling)
- [x] **Asset Bundling & Minification**: Production frontend compiled via Vite with gzip compression and chunk splitting.
- [ ] **Log Aggregation**: Pipe JSON structured server logs to an aggregation provider (e.g., Datadog, Papertrail, Grafana Loki).

---

## 2. Environment Variables Specification

### Backend Configuration (`backend/.env`)
| Variable | Description | Example / Recommended Value | Sensitive |
| :--- | :--- | :--- | :--- |
| `PORT` | Local network port for Express API | `5000` | No |
| `NODE_ENV` | Runtime environment mode | `production` | No |
| `DB_HOST` | MySQL hostname or cloud connection string | `db.production.internal` | No |
| `DB_PORT` | MySQL port | `3306` | No |
| `DB_NAME` | Relational database schema name | `medishare` | No |
| `DB_USER` | Dedicated application database user | `medishare_app` | No |
| `DB_PASSWORD` | Strong password for MySQL account | `<cryptographically random>` | **YES** |
| `JWT_SECRET` | Cryptographic secret for signing tokens | `<min 32-64 random characters>` | **YES** |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` | No |
| `CLIENT_URL` | Allowed origin for Cross-Origin Resource Sharing (CORS) | `https://medishare.org` | No |
| `SMTP_HOST` | Outbound email relay server (Optional) | `smtp.mailgun.org` | No |
| `SMTP_PORT` | Outbound email port (Optional) | `587` | No |
| `SMTP_USER` | SMTP username (Optional) | `postmaster@mg.medishare.org` | No |
| `SMTP_PASSWORD` | SMTP password (Optional) | `<smtp credential>` | **YES** |

> **Security Note**: Never commit `.env` files to git. Use environment secret injectors (e.g., GitHub Actions Secrets, Render Environment Variables, AWS Secrets Manager).

### Frontend Configuration (`frontend/.env.production`)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Public URL pointing to production Express API | `https://api.medishare.org/api` |

---

## 3. Multi-Cloud Deployment Architecture

### Architecture Option A: PaaS (Render / Railway) — Recommended for Quick Launch
```
                    +--------------------------------+
                    |    Cloudflare DNS / HTTPS      |
                    +---------------+----------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  Frontend (Render)    |                       |   Backend (Render)    |
|  Static Site (Vite)   |  -- API REST Calls -> |   Node.js + Express   |
|  CDN Edge Caching     |                       |   Port 5000           |
+-----------------------+                       +-----------+-----------+
                                                            |
                                                            v
                                                +-----------------------+
                                                |   Managed MySQL 8.0   |
                                                |   (Aiven / PlanetScale|
                                                |    or Render DB)      |
                                                +-----------------------+
```
1. **Frontend**: Deploy `frontend/` as a **Static Site** on Render or Vercel. Set build command: `npm run build`, publish directory: `dist`.
2. **Backend**: Deploy `backend/` as a **Web Service** on Render. Set build command: `npm install`, start command: `node src/server.js`.
3. **Database**: Spin up a managed MySQL 8 instance on Render or Aiven. Run `npm run db:migrate` via backend shell.

---

### Architecture Option B: Containerized Docker Deployment (DigitalOcean / AWS Lightsail / VPS)

MediShare provides production-ready Docker definitions and orchestration files:
- `backend/Dockerfile`: Minimalist Node 20 Alpine with `dumb-init` and non-root user.
- `frontend/Dockerfile`: Multi-stage build (Vite build + Nginx Alpine static server).
- `docker-compose.yml`: Coordinates Database, Backend, and Frontend containers on an internal bridge network.

#### Step 1: Clone Repository onto Cloud VM
```bash
git clone https://github.com/your-username/MediShare.git /var/www/medishare
cd /var/www/medishare
```

#### Step 2: Configure Production Environment
```bash
cp backend/.env.example backend/.env
# Populate DB_PASSWORD, JWT_SECRET, and CLIENT_URL using nano or vim
nano backend/.env
```

#### Step 3: Launch Containers via Docker Compose
```bash
docker compose up -d --build
```

#### Step 4: Verify Container Health
```bash
docker compose ps
curl -f http://localhost:5000/api/health
```

---

## 4. MySQL Maintenance, Backup & Recovery Protocols

Healthcare equipment tracking platforms require strict disaster recovery procedures.

### Automated Nightly Backup Script (`backup_medishare.sh`)
```bash
#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/medishare"
BACKUP_FILE="${BACKUP_DIR}/medishare_db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting MySQL backup of 'medishare'..."

# Dump database with non-locking consistent transaction snapshot
mysqldump \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  -h localhost \
  -u medishare_app \
  -p"${DB_PASSWORD}" \
  medishare | gzip > "${BACKUP_FILE}"

# Enforce secure file permissions
chmod 600 "${BACKUP_FILE}"

# Keep only the last 14 days of backups
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +14 -delete

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}"
```

### Database Restoration & Verification Procedure
To test database restoration in a sandbox or recovery event:
```bash
# 1. Unzip backup
gunzip < /var/backups/medishare/medishare_db_20261025.sql.gz > restore_snapshot.sql

# 2. Restore into target test database
mysql -h localhost -u root -p -e "CREATE DATABASE IF NOT EXISTS medishare_restore;"
mysql -h localhost -u root -p medishare_restore < restore_snapshot.sql

# 3. Verify table counts
mysql -h localhost -u root -p -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='medishare_restore';"
```

---

## 5. Security & Clinical Governance Architecture

| Defense Layer | Implementation | Protection Target |
| :--- | :--- | :--- |
| **Formula Injection** | Leading `'` escape on unsafe spreadsheet prefix characters (`=,+,-,@,\t,\r`) | Prevents malicious formulas executing in Excel/Google Sheets when exporting CSVs |
| **Rate Limiting** | Sliding window rate limiter (30 req / 15m on auth; 500 req / 15m general) | Mitigates credential stuffing, brute-force password cracking, and scraping |
| **Concurrency Lock** | Database transaction with `SELECT ... FOR UPDATE` & date overlap checks | Eliminates double-booking race conditions during simultaneous user checkout |
| **RBAC Enforcement** | `verifyRole(['admin'])` middleware verifying cryptographically signed JWTs | Protects administrative routes, user suspension controls, and system overrides |
| **Audit Logging** | Immutable `audit_logs` table tracking admin actions, user suspensions, and disputes | Ensures HIPAA/GDPR clinical accountability and non-repudiation |
| **Notification De-dup** | 60-second sliding de-duplication window | Prevents notification spam caused by rapid client reconnects or duplicate clicks |

---

## 6. Viva & Capstone Presentation Guide for BCA Students

When presenting MediShare to examiners or technical interviewers, highlight these key engineering decisions:

1. **Why MySQL over MongoDB?**
   - *Answer*: Medical equipment loans require strict ACID compliance, relational integrity (foreign keys linking seekers, equipment, bookings, and condition logs), and transactional locking to prevent concurrent double-booking of a single physical device.
2. **How does the system prevent two users from booking the same wheelchair at the same time?**
   - *Answer*: When a booking request arrives, the backend evaluates overlapping date ranges `(start_date <= requested_end AND end_date >= requested_start)` within the active statuses (`pending`, `approved`, `active_loan`). If a collision exists, the transaction fails with HTTP 409 Conflict.
3. **What is Formula Injection and why does MediShare protect against it?**
   - *Answer*: When an administrator downloads user data or bookings into Microsoft Excel, any cell starting with `=`, `+`, or `-` can execute arbitrary operating system commands (DDE execution). MediShare sanitizes every exported text field by prefixing it with an apostrophe.
4. **How are real-time notifications handled efficiently?**
   - *Answer*: Notifications are stored in a dedicated indexed MySQL table with read tracking, 60-second de-duplication, and polled by the React frontend bell component with unread count badges.

