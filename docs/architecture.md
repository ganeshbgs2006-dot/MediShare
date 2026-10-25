# MediShare Architecture & System Design Document

## 1. System Overview

MediShare is built using a modern decoupled client-server architecture:
- **Client Tier**: Single Page Application (SPA) built with React and Vite. It communicates with the backend solely via asynchronous HTTP/JSON REST APIs.
- **Application Server Tier**: Node.js and Express.js runtime handling API routing, input validation, authentication tokens, business rule enforcement, and file upload pipelines.
- **Data Persistence Tier**: Relational MySQL database enforcing referential integrity with foreign key constraints, indexes, and transactions.

```
   ┌────────────────────────────────────────────────────────┐
   │                  React SPA (Frontend)                  │
   │  (Components, Design Tokens, React Router, Lucide UI)  │
   └───────────────────────────┬────────────────────────────┘
                               │ JSON / HTTP (REST APIs)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │             Node.js + Express API (Backend)            │
   │  (Auth Middleware, JWT, Joi/Express Validator, Multer) │
   └───────────────┬────────────────────────┬───────────────┘
                   │                        │
                   ▼                        ▼
       ┌───────────────────────┐  ┌───────────────────┐
       │     MySQL 8.0 DB      │  │ Local File Store  │
       │ (Tables, Constraints) │  │  (Media Uploads)  │
       └───────────────────────┘  └───────────────────┘
```

---

## 2. Design System & Frontend Architecture

The MediShare UI is designed with a healthcare-focused aesthetic:
- **Primary Navy (`#0B192C`, `#0F172A`)**: Communicates institutional stability, clinical rigor, and security.
- **Medical Teal (`#0D9488`, `#0F766E`)**: Communicates health, healing, care, and vitality.
- **Crisp Neutrals (`#FFFFFF`, `#F8FAFC`, `#F1F5F9`)**: Keeps the user interface readable and uncrowded.
- **Component Modularity**: Every foundational UI element (`Button`, `Badge`, `Card`, `Input`, `Modal`) is isolated with CSS modules to eliminate global namespace collisions.
- **Accessibility & Responsiveness**: Mobile-first responsive grid system with responsive breakpoints (desktop, tablet, mobile hamburger menu).

---

## 3. Security Architecture Principles

1. **Defense in Depth**: Frontend client validation is never solely trusted. All business rules (owner approval, booking dates, inspection checklists, file extensions) are strictly enforced by backend Express middleware and MySQL constraints.
2. **Zero-Trust Roles**: The backend extracts user role (`seeker`, `owner`, `admin`) and user ID strictly from cryptographically signed JWT tokens, never from client request bodies.
3. **Password Security**: Standard bcrypt hashing with salt rounds (factor 10) prevents plain-text exposure.
4. **Isolated Media Access**: Private evidence photos recorded during equipment handover/return are protected and only accessible by authorized booking participants and system administrators.

