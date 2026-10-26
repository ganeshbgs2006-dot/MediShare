# MediShare — Complete Application Discovery, Architecture Audit & Requirements Report

> **Project**: MediShare — Community Medical Equipment Sharing Platform  
> **Tech Stack**: React 18, Vite, Express (Node.js 20), MySQL 8.0, JWT Authentication  
> **Target Audience**: Full-Stack Development Team, Technical Reviewers & Product Owner  
> **Audit Type**: Read-Only Non-Destructive Deep Codebase & Database Discovery  

---

## Executive Context for ChatGPT / External Reviewer
This document is a comprehensive technical audit and gap analysis of **MediShare**, a web platform intended to connect community members, caregivers, and local healthcare clinics to borrow, lend, rent, and donate assistive medical devices (e.g., wheelchairs, hospital beds, oxygen concentrators, mobility walkers).

A rigorous inspection of the frontend, backend, routing, middleware, database tables, and seeded records was conducted to verify actual functionality versus documented claims. The findings below represent **confirmed code-level facts**, not assumptions.

---

## 1. Executive Summary

| Category | Assessment | Key Evidence |
| :--- | :--- | :--- |
| **System Health** | Partially Functional (Incomplete Core Loops) | Auth and notifications work; marketplace is disconnected from DB; return inspections and equipment creation do not exist. |
| **Security Posture** | **High Risk / Critical Vulnerability** | Public registration allows arbitrary users to grant themselves `role: 'admin'`; owner accounts auto-activate without vetting. |
| **Data Integrity** | Fragmented / Inconsistent | Frontend marketplace renders in-memory mock data (`equipmentData.js`); MySQL `equipment` table is ignored; `condition_logs` has 0 rows. |
| **Evidence & Media** | **Completely Unimplemented** | Zero `<input type="file">` controls in UI; no `multer` middleware; no WebRTC camera recording; return videos do not exist. |
| **Production Readiness**| **NOT READY — Corrections Required** | Critical security patch, database synchronization, upload pipeline, and return video gates are prerequisite to launch. |

---

## 2. Actual System Architecture

```
+-----------------------------------------------------------------------------------+
|                           FRONTEND: React 18 + Vite SPA                           |
|                                                                                   |
|  Public Views:        [Home]  [Marketplace (MOCK)]  [EquipmentDetails (HYBRID)]   |
|  Auth Views:          [Login] [Register (VULNERABLE)]                             |
|  Seeker Portal:       [MyBookings (Review Modal Attached)]                        |
|  Partner Portal:      [OwnerBookings (Requests Queue Only - No Inventory UI)]     |
|  Admin Portal:        [AdminDashboard (KPIs, Range Filter, Queues, CSV Export)]   |
+------------------------------------------+----------------------------------------+
                                           | REST API (fetch with Bearer JWT)
                                           v
+-----------------------------------------------------------------------------------+
|                           BACKEND: Node.js 20 + Express 4                         |
|                                                                                   |
|  Middleware:   securityHeaders -> rateLimiter -> authenticateToken -> authorizeRoles
|  Controllers:  authController | equipmentController | bookingController           |
|                adminController | notificationController | reviewController        |
|  Services:     notificationService (Working) | reminderService (Working)          |
|                emailService (Console Mock)   | storageService (ORPHANED/UNMOUNTED)|
+------------------------------------------+----------------------------------------+
                                           | mysql2/promise Connection Pool
                                           v
+-----------------------------------------------------------------------------------+
|                        DATABASE: MySQL 8.0 (Schema: `medishare`)                  |
|                                                                                   |
|  users (5 rows)          | equipment (10 rows)      | equipment_media (13 rows)   |
|  bookings (6 rows)       | condition_logs (0 rows)  | reviews (1 row)             |
|  notifications (23 rows) | waitlist (1 row)         | audit_logs (32 rows)        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Findings Register (Numbered & Categorized)

### Category A — Critical Security Vulnerabilities

#### `[SEC-001]` Unrestricted Public Self-Registration as Super Administrator
- **Affected Files**: `backend/src/middleware/validate.js` (lines 26–28), `backend/src/controllers/authController.js` (lines 17, 41).
- **The Defect**: `validateRegistration` explicitly allows `"admin"`:
  ```javascript
  if (role && !['seeker', 'owner', 'admin'].includes(role)) {
    errors.push('Role must be one of: seeker, owner, admin.');
  }
  ```
  `authController.register` extracts `role` from `req.body` and creates the account via `userModel.create({ role })`, issuing an active administrator JWT.
- **Impact**: Any malicious client can send a raw POST request with `"role": "admin"` to gain total control of user data, moderation, and database records.
- **Required Fix**: Hardcode permitted self-registration to `['seeker', 'owner']`. Reject or drop `"admin"` during public registration.

---

### Category B — High Severity Business Logic & Architectural Gaps

#### `[ROLE-001]` Equipment Owners Automatically Activated Without Administrator Approval
- **Affected Files**: `backend/src/controllers/authController.js` (lines 46–62), `backend/src/db/schema_phase4_phase5.sql` (line 12).
- **The Defect**: In `schema_phase4_phase5.sql`, `is_active` defaults to `1` (true). When an owner registers, `is_verified` is set to `0`, but `is_verified` is **never checked by any route or middleware**. An active JWT is issued immediately, granting full partner queue access.
- **Impact**: Unvetted organizations or bad actors can pose as clinical equipment providers without safety verification.
- **Required Fix**: Add `approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'` to `users`. Gate partner features on `approval_status === 'approved'`. Add an Owner Approval Queue to `/admin`.

#### `[ROLE-002]` Missing Owner Inventory Management UI and Inappropriate Seeker Controls
- **Affected Files**: `frontend/src/components/layout/Navbar/Navbar.jsx` (lines 63–85, 132–151), `frontend/src/App.jsx` (lines 70–99).
- **The Defect**: Once an owner logs in, the "List Equipment" button disappears from the Navbar. Owners only see "Browse Equipment" (marketplace) and "Partner Queue" (`/owner/bookings`). There is no "My Equipment" page, even though backend route `GET /api/equipment/my/owner` exists. Furthermore, owners see "Request Equipment" buttons on items and can book equipment like seekers.
- **Impact**: Owners cannot manage their equipment inventory or view active listings.

#### `[MARKET-001]` Frontend Marketplace Disconnected from MySQL Database
- **Affected Files**: `frontend/src/services/equipmentService.js` (lines 1–25), `frontend/src/pages/Marketplace/Marketplace.jsx` (lines 25–28).
- **The Defect**: `Marketplace.jsx` imports `filterAndSortEquipment` from `equipmentService.js`, which filters an in-memory array (`DEMO_EQUIPMENT_DATA` in `frontend/src/data/equipmentData.js`). It **never calls** `GET /api/equipment`.
- **Impact**: Real equipment in MySQL cannot be browsed; administrative moderation changes have no effect on frontend display.

#### `[EQUIP-001]` Complete Absence of Equipment Creation, Editing, or Deletion APIs and Forms
- **Affected Files**: `backend/src/routes/equipmentRoutes.js`, `backend/src/models/equipmentModel.js`.
- **The Defect**: `equipmentRoutes.js` only provides `GET /`, `GET /my/owner`, `GET /:id`, and `GET /:id/availability`. There is no `POST /api/equipment`, no `PUT`, and no `DELETE`. `equipmentModel.js` has no `create()` method. There is no frontend listing form.
- **Impact**: New equipment listings cannot be submitted organically.

#### `[MEDIA-001]` Absence of Real Media Upload Pipeline (Photos, Videos, PDFs)
- **Affected Files**: `backend/package.json`, `backend/src/services/storageService.js`.
- **The Defect**: `backend/package.json` contains no multipart parser (`multer`). `storageService.js` is orphaned and never mounted. The frontend contains zero `<input type="file">` controls. All photos in the system are static Unsplash URLs.
- **Impact**: Users cannot upload physical condition photos, manuals, or evidence.

#### `[RETURN-001]` Complete Absence of Mandatory Dual Return Video Recording
- **Affected Files**: `backend/src/controllers/bookingController.js` (lines 354–385), `frontend/src/pages/Bookings/OwnerBookings.jsx` (lines 80–95).
- **The Defect**: In `OwnerBookings.jsx`, an owner clicks "Confirm Safe Return", sending `PATCH /api/bookings/:id/status` with `status: 'returned'`. The return finalizes immediately. The seeker has no participation; no inspection checklist is logged; zero video evidence is recorded or verified.
- **Impact**: Direct violation of core platform requirement: *"During equipment return, both the owner and seeker must independently record and submit a return-condition video before the return can be finalized."*

#### `[ADMIN-001]` Admin Dashboard Lacks Partner Organization Vetting / Approval Queue
- **Affected Files**: `frontend/src/pages/Admin/AdminDashboard.jsx`, `backend/src/controllers/adminController.js`.
- **The Defect**: The admin console only supports suspending/reactivating already-active accounts. It has no queue or interface for approving newly registered healthcare partners.

---

### Category C — Medium Severity Workflow & Quality Deficiencies

#### `[REVIEW-001]` Discrepancy Between Mock Equipment Ratings and Real Database Reviews
- **Affected Files**: `frontend/src/data/equipmentData.js`, `frontend/src/pages/EquipmentDetails/EquipmentDetails.jsx`.
- **The Defect**: Mock equipment items display hardcoded badges: `4.8 ★ (24 reviews)`. However, the MySQL `reviews` table only contains 1 review in total (for item 1). When scrolling to the bottom of the details page, it displays "No Community Reviews Yet", confusing users.

#### `[INSPECT-001]` `condition_logs` Table Is Orphaned with Zero Records
- **Affected Files**: `backend/src/models/conditionLogModel.js`, `backend/src/db/schema.sql`.
- **The Defect**: The database contains a rich `condition_logs` table (`stage`, `condition_grade`, `notes`, `checklist_json`, `verified_by_seeker`, `verified_by_owner`, `is_disputed`). However, `conditionLogModel.create()` is never called in any route. The table has 0 rows.

#### `[TEST-001]` Integration Tests Mutate Live Development Database Without Isolated Fixtures
- **Affected Files**: `backend/tests/phase4_phase5_test.js`, `backend/tests/phase6_phase7_test.js`.
- **The Defect**: Test suites execute directly against `DB_NAME=medishare`, creating duplicate returned bookings (IDs 3, 4, 5, 6), test notifications, and test audit logs without cleanup.

#### `[DATA-001]` Static Demonstration Metrics on Homepage
- **Affected Files**: `frontend/src/pages/Home/Home.jsx`, `frontend/src/data/sampleEquipment.js`.
- **The Defect**: The homepage displays hardcoded statistics (`1,280+ Equipment Shared, ₹42L+ Savings`) rather than pulling aggregated counts from `/api/admin/dashboard` or a public stats endpoint.

---

## 4. Current Database State & Integrity Check

```text
Database: medishare | Host: localhost:3306 | MySQL 8.0+
-----------------------------------------------------------
Table Name         Row Count   Integrity & Operational Notes
-----------------------------------------------------------
users              5           1 Admin, 2 Owners (1 unapproved), 2 Seekers
equipment          10          All 10 rows belong to owner_id: 2 (St. Jude)
equipment_media    13          All rows point to Unsplash image URLs
bookings           6           4 duplicate returned test rows for equip_id 1
condition_logs     0           ORPHANED - No route writes to this table
notifications      23          Working - In-app notification delivery
reviews            1           Verified post-loan review for booking 3
waitlist           1           Working - FIFO queue entry for equip_id 2
audit_logs         32          Working - Immutable administrative trail
-----------------------------------------------------------
Independent Database Check: `svb_holidays` remains 100% UNTOUCHED.
```

---

## 5. User Roles & Permission Matrix (Current vs Intended)

| Operation | Seeker (Current) | Owner (Current) | Admin (Current) | Target Architecture |
| :--- | :---: | :---: | :---: | :--- |
| **Self-Registration** | Yes | Yes (Auto-active) | **Yes (SECURITY BUG)** | Seeker & Owner self-register; Admin is invite-only. |
| **Account Activation** | Immediate | Immediate (Unvetted) | Immediate | Seeker is immediate; Owner requires Admin Approval. |
| **Browse Marketplace** | Yes (Mock) | Yes (Mock) | Yes (Mock) | All roles browse real database catalog. |
| **Request Equipment Loan**| Yes | Yes (Non-owned items)| Yes | Seekers only (or owners switching to borrower mode). |
| **Manage Incoming Requests**| No (403) | Yes | Yes | Approved Owners and Admins only. |
| **Create Equipment Listing**| **Missing** | **Missing** | **Missing** | Approved Owners and Admins via dedicated form. |
| **Upload Condition Photos** | **Missing** | **Missing** | **Missing** | Multipart file upload pipeline. |
| **Mandatory Return Video**  | **Missing** | **Missing** | **Missing** | Dual WebRTC recording by both seeker & owner. |
| **Finalize Return** | No | Yes (One-click bypass)| Yes | Gate: Both return videos + checklists must exist. |
| **Submit Verified Review** | Yes | No | No | Seekers review equipment after completed loan. |
| **Approve / Vet Partners** | No (403) | No (403) | **Missing UI** | Admins approve pending partner applications. |

---

## 6. Proposed 5-Work-Package Correction Roadmap

```
Phase A: Security & Vetting   Phase B: Real Catalog & Portal   Phase C: Media & Video Pipeline
[Work Package 1]              [Work Package 2]                [Work Package 3]
- Block admin self-register   - Connect Marketplace to MySQL   - Install multer pipeline
- Add owner approval_status   - Add POST /api/equipment        - In-browser camera recorder
- Admin Partner Approval UI   - Owner "My Equipment" Portal    - Store images & WebM/MP4
        |                             |                               |
        +-----------------------------+-------------------------------+
                                      |
                                      v
                      Phase D: Mandatory Dual Return
                      [Work Package 4]
                      - POST /api/bookings/:id/return-inspection
                      - Seeker & Owner independent return videos
                      - Finalization block until both videos valid
                      - Automated dispute trigger on discrepancy
                                      |
                                      v
                      Phase E: Polish & Production Test
                      [Work Package 5]
                      - Dynamic review ratings across cards
                      - Isolated test DB (medishare_test)
                      - Dynamic homepage community impact metrics
```

---

## 7. Business Decisions Required from Product Owner

Before implementation begins, please confirm your preferred options:

1. **Owner Approval Workflow**:
   - *Option A (Recommended)*: Strict Approval. Newly registered owners cannot list equipment or access loan queues until an admin approves their account.
   - *Option B*: Immediate listing drafting, but listings remain hidden (`pending`) until owner and listing are verified.
2. **Owner Borrowing Privileges**:
   - *Option A (Recommended)*: Single Unified Account. Owners can borrow from other partners, but UI clearly distinguishes "My Lending Queue" from "My Borrowed Equipment".
   - *Option B*: Strict Role Isolation. Owners cannot borrow; they must register a separate Seeker account.
3. **Mandatory Return Video Fallback Policy**:
   - *Option A (Recommended)*: Camera Recording with File Upload Fallback. UI prompts for in-browser recording first. If device lacks camera, allow uploading pre-recorded video file flagged as `uploaded_file`.
   - *Option B*: Strict WebRTC-Only. Disallow file uploads entirely.
4. **Discrepancy & Dispute Handling**:
   - *Option A (Recommended)*: Automatic Flagging. If seeker and owner condition checklists differ, status automatically shifts to `'disputed'`, withholding closure and alerting admin.
   - *Option B*: Manual Flagging. Return completes unless owner explicitly clicks "Raise Dispute".

---

## 8. Copy-Paste Prompt for ChatGPT

If you are sharing this report with ChatGPT to review or collaborate, copy and paste the prompt below:

```markdown
Hello ChatGPT, I am developing MediShare, a Community Medical Equipment Sharing Platform (React 18 + Vite, Express, MySQL 8).

A comprehensive architectural audit was just completed on my codebase. Please review the attached findings report:

Key problems identified:
1. Public registration allows privilege escalation to 'admin' (SEC-001).
2. Equipment owners auto-activate without admin approval (ROLE-001).
3. Marketplace UI is disconnected from MySQL and shows hardcoded mock data (MARKET-001).
4. Equipment listing creation (POST /api/equipment) is completely missing (EQUIP-001).
5. File upload and media storage do not exist; no multer, no file inputs (MEDIA-001).
6. Mandatory dual video recording during equipment return is missing (RETURN-001).
7. Return finalization can be completed with a single click without inspection (RETURN-001).

Please act as a senior full-stack software architect. Review the 5-work-package roadmap in Section 6 and help me plan the implementation of Work Package 1 (Security & Owner Approval) and Work Package 3/4 (Media Uploads & Mandatory Return Video Recording).
```

