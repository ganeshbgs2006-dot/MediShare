# MediShare — Community Medical Equipment Sharing Platform

> **Academic Capstone Project**  
> Developed using React, Vite, Node.js, Express.js, and MySQL.

MediShare is a community-driven healthcare technology web application designed to connect recovering patient families with verified equipment owners, local clinics, and non-profit health organizations. MediShare coordinates access to vital medical devices (such as wheelchairs, oxygen concentrators, hospital beds, and vital sign monitors) through free community lending, non-profit care rentals, and equipment donations.

---

## 🌟 Key Platform Principles

1. **Patient Safety & Transparency**: Mandatory dual-stage digital condition checklists (handover and return) with photographic and video evidence.
2. **Owner Verification & Moderation**: Newly registered owners undergo administrative verification before listings can be published.
3. **Equitable Community Allocation**: Priority algorithms and waitlists prevent hoarding or commercial exploitation.
4. **Demonstration Integrity**: Clear labeling of all sample records to prevent misleading medical claims during academic evaluation.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router v6, CSS Modules & Custom Design Tokens, Lucide React Icons
- **Backend (Upcoming in Phase 3)**: Node.js, Express.js, REST API Architecture
- **Database (Upcoming in Phase 3)**: MySQL 8.0, `mysql2` with parameterized SQL queries
- **Security & Auth**: bcryptjs password hashing, JSON Web Tokens (JWT), role-based middleware
- **Storage**: Local filesystem storage adapter (development) with future cloud object storage compatibility

---

## 📁 Project Architecture & Folder Structure

```
MediShare/
├── frontend/                     # React + Vite client application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Reusable UI library (Button, Badge, Card, Input, Modal, EquipmentCard)
│   │   │   └── layout/           # Global layout (Navbar, Footer)
│   │   ├── data/                 # Sample demonstration datasets
│   │   ├── pages/                # Application views (Home, Marketplace, Auth stubs)
│   │   ├── styles/               # CSS design tokens (variables.css, index.css)
│   │   ├── App.jsx               # Route mapping & application entry
│   │   └── main.jsx              # DOM root mount
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/                      # Express REST API (Phase 3)
├── database/                     # MySQL schema, indexes, and seed SQL (Phase 3)
├── docs/                         # Project architecture & developer guides
│   ├── architecture.md
│   └── setup-guide.md
├── .env.example                  # Environment variable configuration template
├── .gitignore                    # Git exclusions
├── package.json                  # Root convenience scripts
└── README.md
```

---

## 🚀 How to Run Phase 1 (Frontend)

### Prerequisites
- **Node.js** v18+ (tested on v24.21.0)
- **npm** v10+

### Step-by-Step Instructions

1. **Open Visual Studio Code terminal** in the `MediShare` folder.
2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
4. **Open your browser** and visit:
   ```
   http://localhost:5173
   ```

### To build the production bundle:
```bash
npm --prefix frontend run build
```

---

## 📋 Implementation Roadmap

- [x] **Phase 1: Environment Inspection, Design System & Responsive Homepage**
- [ ] **Phase 2: Equipment Marketplace, Search Engine, Faceted Filters & Detail View**
- [ ] **Phase 3: MySQL Database Design, Express Backend & JWT Authentication**
- [ ] **Phase 4: Equipment Management & Owner Approval Workflow**
- [ ] **Phase 5: Booking Lifecycle, Availability Locks & Waitlist System**
- [ ] **Phase 6: Dual Handover/Return Condition Checklists & Media Evidence**
- [ ] **Phase 7: Owner Reviews, Ratings & Dispute Reporting**
- [ ] **Phase 8: Administrative Control Panel & Audit Logs**
- [ ] **Phase 9: Comprehensive End-to-End Testing & Demonstration Polish**
