# MediShare — Community Medical Equipment Sharing Platform

MediShare is a full-stack, community-driven healthcare technology web application that connects recovering patients, families, and caregivers with verified equipment owners, local health clinics, and non-profit organizations. MediShare coordinates temporary and permanent access to vital medical equipment (such as manual and electric wheelchairs, oxygen concentrators, hospital beds, CPAP/BiPAP units, and mobility walkers) through free community lending, subsidized non-profit rentals, and equipment donations.

---

## 🌟 Key Platform Capabilities

1. **Equipment Discovery & Faceted Search**:
   - Multi-parameter filtering by category, sharing arrangement (free, rental, donation), availability status, and physical condition grade.
   - Debounced keyword search across equipment names, descriptions, and regional service areas.

2. **Physical Inspection & Condition Verification**:
   - Handover checklist verification with condition grading (`Good`, `Fair`, `Needs Inspection`).
   - Detailed documentation of cosmetic wear, functional mechanisms, and included attachments/accessories.

3. **Demonstration Video Walkthroughs**:
   - HTML5 video playback with byte-range partial content streaming (`HTTP 206`) allowing seekers to inspect operational condition, folding mechanisms, and cleanliness prior to requesting.

4. **Equipment Booking Hero Card & Lifecycle**:
   - Interactive booking modal with date range pickers, estimated cost computation, handover preference selection (self-pickup vs delivery assistance), and intended care need notes.
   - Real-time calendar availability checking and transactional concurrency protection (`SELECT ... FOR UPDATE`) preventing double-booking.

5. **Mandatory Dual-Party Return Videos**:
   - For clinical accountability and patient safety, **both** the equipment owner and the borrower/seeker must record and submit their respective return condition videos before an equipment loan can be finalized.
   - Missing evidence blocks return completion with clear UI indicators.

6. **In-App Notifications & Priority Waitlist**:
   - Notification center with unread counters and direct links to updated bookings.
   - First-In, First-Out (FIFO) priority waitlist automatically notifying waiting patients when out-of-stock equipment is returned and sanitized.

7. **Verified Community Reviews**:
   - 1-to-5 star rating and review system strictly unlocked only after a loan is confirmed returned and inspected.

8. **Administrative Governance & Audit Trail**:
   - Partner approval workflow: Newly registered equipment owners remain in `pending` status until vetted and approved by an administrator.
   - Operational work queues (overdue loans, condition disputes, flagged items), administrative booking overrides with mandatory justification, and sanitized CSV reports (excluding password hashes and credentials).

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18 & Vite | React Router v6, CSS Modules, Lucide React icons |
| **Backend** | Node.js & Express | ES modules, REST API architecture, Express Router |
| **Database** | MySQL 8.0 | `mysql2/promise` with parameterized queries & connection pool |
| **Authentication** | JWT & bcryptjs | Bearer token authentication, bcrypt password hashing (10 salt rounds) |
| **Media Handling** | Multer | File type validation, size limits (10MB photos, 100MB videos), local storage |
| **Security** | Express Middleware | Helmet-style security headers, CORS origin restrictions, rate limiting |

---

## 📁 Repository Structure

```
MediShare/
├── backend/                      # Express REST API Server
│   ├── src/
│   │   ├── config/               # Database pool, environment parser, table constants
│   │   ├── controllers/          # Request handlers (auth, booking, equipment, admin, etc.)
│   │   ├── db/                   # MySQL schema, migration scripts, sample seeders
│   │   ├── middleware/           # Auth token, role RBAC, upload, rate limiters, security headers
│   │   ├── models/               # Data access layer with parameterized SQL queries
│   │   ├── routes/               # API route definitions (/api/*)
│   │   ├── services/             # Notifications, email mock adapter, storage, reminders
│   │   └── app.js                # Express application configuration
│   ├── tests/                    # Integration & end-to-end test suites
│   ├── uploads/                  # Local media storage (photos/ & videos/ - ignored by Git)
│   ├── package.json              # Backend dependencies and test scripts
│   └── server.js                 # HTTP server entry point (port 5000)
├── frontend/                     # React + Vite Client Application
│   ├── src/
│   │   ├── components/           # UI components (Button, Badge, Card, Modal, CameraRecorder)
│   │   ├── context/              # AuthContext with persistent session management
│   │   ├── pages/                # Views (Home, Marketplace, EquipmentDetails, Bookings, Admin)
│   │   ├── services/             # Frontend API client modules (fetch with auth headers)
│   │   ├── styles/               # CSS design tokens (variables.css, index.css)
│   │   ├── App.jsx               # Route mappings and role-protected routes
│   │   └── main.jsx              # Application root mount
│   ├── index.html                # Single-page application template
│   ├── vite.config.js            # Vite configuration with /api and /uploads reverse proxy
│   └── package.json              # Frontend dependencies and build scripts
├── .env.example                  # Environment configuration template
├── .gitignore                    # Exclusions (node_modules, .env, uploads, build artifacts)
├── package.json                  # Root npm script runner
└── README.md                     # Project documentation
```

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

1. **Node.js**: v18.0.0 or later (tested on v24.21.0)
2. **npm**: v9.0.0 or later
3. **MySQL Server**: v8.0 or later running on `localhost:3306`
4. **Web Browser**: Google Chrome, Mozilla Firefox, or Microsoft Edge

---

## ⚙️ Environment Configuration

### 1. Backend Configuration
Copy the template `.env.example` in the `backend/` directory (or root) to `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="your_mysql_password_here"
DB_NAME=medishare

# JWT Authentication
JWT_SECRET=medishare_super_secure_jwt_secret_min_32_characters_long!
JWT_EXPIRES_IN=7d

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

> **Note**: If your MySQL password contains special characters (such as `#`, `$`, or quotes), always enclose it in double quotes (`DB_PASSWORD="your_password"`).

### 2. Frontend Configuration
The frontend uses Vite's built-in development proxy (`frontend/vite.config.js`), routing `/api` and `/uploads` requests directly to `http://localhost:5000`. No manual frontend `.env` configuration is required for local development.

---

## 🗄️ Database Setup & Migrations

1. Ensure your local MySQL server is running:
   ```bash
   mysql -u root -p
   ```
2. Create the `medishare` database if it does not already exist:
   ```sql
   CREATE DATABASE IF NOT EXISTS medishare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run the automated database migration script to construct all 9 tables:
   ```bash
   npm --prefix backend run db:migrate
   ```
4. (Optional) Populate seed demonstration data:
   ```bash
   npm --prefix backend run db:seed
   ```

---

## 🚀 Running the Application

### Option A: Run Both Servers from the Root Directory
```bash
# Terminal 1: Start Express Backend
npm run dev:backend

# Terminal 2: Start Vite Frontend
npm run dev:frontend
```

### Option B: Run from Subdirectories
```bash
# Terminal 1: Backend (Port 5000)
cd backend
npm run dev

# Terminal 2: Frontend (Port 5173)
cd frontend
npm run dev
```

- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend API URL**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive automated test harness covering role enforcement, equipment catalog operations, booking concurrency, return video verification, notifications, reviews, and admin analytics.

### Run All Test Suites
```bash
npm test
```
*(Runs all 84 automated backend tests sequentially across 4 distinct test suites).*

### Run Individual Test Suites
```bash
# 1. Verification of Audit Fixes & Dual Return Video Verification (16 tests)
npm --prefix backend run test:audit

# 2. Phase 4 & Phase 5 Booking & Admin Governance Suite (23 tests)
npm --prefix backend run test:phase45

# 3. Phase 6 & Phase 7 Reviews, Waitlist, CSV Export & Security Suite (25 tests)
npm --prefix backend run test:phase67

# 4. Seeker Equipment Booking End-to-End Pipeline (20 tests)
npm --prefix backend run test:booking
```

### Production Build Verification
To verify that the frontend bundles cleanly without compilation or syntax errors:
```bash
npm --prefix frontend run build
```

---

## 🗺️ Application Routes & User Roles

### User Roles & Permissions

| Role | Permissions & Workflow |
| :--- | :--- |
| **Guest** | Browse equipment marketplace, view equipment details and inspection logs. Prompted to log in when attempting to borrow or join waitlists. |
| **Seeker** | Browse listings, submit loan requests via the Equipment Booking Hero Card, track requests in *My Requests* (`/my-bookings`), record seeker return condition video, submit reviews upon return completion. |
| **Owner** | Registered with `approval_status = 'pending'`. Must be vetted and approved by an administrator before publishing listings. Once approved, can publish equipment with photos/demonstration videos, approve/reject borrower requests, and submit owner return condition video. |
| **Admin** | Access the Administrative Governance Panel (`/admin`), vet and approve/reject partner accounts, manage equipment moderation, arbitrate condition disputes, perform justified booking overrides, and export sanitized CSV reports. |

### Main Navigation Routes

- `/` — Homepage with mission overview, featured categories, and how-it-works workflow.
- `/marketplace` — Equipment catalog with faceted category, price mode, and availability filters.
- `/equipment/:id` — Equipment details page with demonstration video player, Physical Inspection card, and dedicated **Equipment Booking Hero Card**.
- `/login` & `/register` — Authentication views with role selection (Seeker vs Equipment Partner).
- `/my-bookings` — Seeker portal for active loan tracking and return video submission.
- `/owner/inventory` — Equipment partner inventory management.
- `/owner/add-equipment` — Partner listing publication form with photo gallery and walkthrough video upload.
- `/owner/bookings` — Partner incoming loan requests review and approval queue.
- `/admin` — System metrics, partner vetting queue, dispute arbitration, and audit logs.

---

## 📷 Media Storage & Video Streaming Behavior

- **Photographs**: Supported formats include JPEG, PNG, and WebP (up to 10MB per file). Stored in `backend/uploads/photos/`.
- **Demonstration & Return Videos**: Supported formats include MP4, WebM, and QuickTime (`.mov`) up to 100MB per file. Stored in `backend/uploads/videos/`.
- **Streaming**: The Express server implements byte-range request streaming (`Range: bytes=start-end`), responding with `HTTP 206 Partial Content` so HTML5 video players can seek, buffer, and play immediately.
- **Git Exclusions**: Uploaded media directories (`backend/uploads/` and `uploads/`) are excluded from Git version control via `.gitignore` to prevent committing binary or personal files.

---

## ⚠️ Current Limitations & Production Notes

1. **Email Delivery**: Notifications use an asynchronous in-memory mock logger in development. For live production delivery, configure an external SMTP or transactional provider (e.g., SendGrid, AWS SES) in `backend/src/services/emailService.js`.
2. **Object Storage**: The current setup uses local disk storage for uploaded media. For multi-server or containerized production deployments, configure an S3-compatible cloud object storage bucket.
3. **Pre-Production Security**: Before deploying publicly, ensure:
   - Secret keys (`JWT_SECRET`) and database passwords are set to strong, non-default credentials.
   - HTTPS/TLS termination is enabled via reverse proxy (e.g., Nginx, Cloudflare, Caddy).
   - MySQL is configured with a least-privilege application user rather than `root`.

---

## 📄 License & Attribution

This project is licensed under the ISC License. Developed for the MediShare Community Health Network.
