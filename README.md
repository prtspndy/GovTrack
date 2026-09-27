# GovTrack — Government Document Request & Status Tracking System

[![Built for Citizen Transparency](https://img.shields.io/badge/System-Citizen%20Services-blue.svg)](https://github.com)
[![Status](https://img.shields.io/badge/Workflow-Audited%20%26%20Trackable-emerald.svg)](https://github.com)
[![Stack](https://img.shields.io/badge/Stack-MERN-navy.svg)](https://github.com)

> **Notice:** *Demo / Prototype — Not an Official Government Website. Built to demonstrate full end-to-end digitisation of citizen certificate issuance, multi-department verification, and real-time status tracking.*

---

## 1. Executive Summary & Problem Statement

### The Problem
In conventional public administration, citizens submit requests for statutory certificates (Income, Domicile, Caste, Birth, Senior Citizen cards) and subsequently must physically visit the revenue or municipal office multiple times just to know whether their file is pending, under desk scrutiny, awaiting field verification, approved, or ready for collection. This causes congestion at public offices, delays, lack of accountability, and citizen frustration.

### The Solution: GovTrack
**GovTrack** digitizes the complete lifecycle:
1. **Citizens** submit structured applications online with supporting document uploads (Aadhaar, utility bills, salary proofs).
2. **System** auto-assigns an immutable tracking number (e.g. `GOV-2026-000001`) and calculates statutory SLA dates.
3. **Departmental Officers** inspect proofs, approve or reject individual documents with remarks, request supplementary files, and transition status along a strictly audited workflow pipeline.
4. **Citizens & Public** track real-time progress via a vertical status stepper and audit log, eliminating redundant physical visits.
5. **Final certified documents** are cryptographically generated, digitally stored, and securely downloadable.

---

## 2. System Architecture & Tech Stack

```
                   ┌────────────────────────────────────────┐
                   │    GovTrack React Frontend (Vite)      │
                   │  - Tailwind CSS  - Lucide Icons        │
                   │  - Recharts Dashboard - Auth Context   │
                   └──────────────────┬─────────────────────┘
                                      │ HTTP / JSON / FormData
                                      ▼
                   ┌────────────────────────────────────────┐
                   │   Express.js Backend API Server        │
                   │  - JWT Authentication  - RBAC          │
                   │  - Multer Secure Uploads               │
                   │  - Status Workflow Validator           │
                   └──────┬──────────────────────────┬──────┘
                          │                          │
                          ▼                          ▼
       ┌───────────────────────────────┐  ┌───────────────────────────────────┐
       │   Persistence Document Store  │  │ Government Integration Gateway    │
       │  - MongoDB (Mongoose Schema)  │  │ (DigiLocker / e-District / SMS)   │
       │  - Zero-Config Embedded Store │  │ GovernmentDocumentService.ts      │
       └───────────────────────────────┘  └───────────────────────────────────┘
```

- **Frontend**: React 19, Vite, React Router DOM, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express.js, TypeScript, Multer, JWT, Bcryptjs, Cors.
- **Database / Storage**: Dual-mode MongoDB/Mongoose connection manager with embedded disk-backed JSON persistence fallback (`data/govtrack_db.json`) for seamless zero-setup execution.

---

## 3. Project Directory Structure

```
govtrack/
├── data/                             # Persistent database store
│   └── govtrack_db.json
├── uploads/                          # Secure document storage
├── server/
│   ├── config/
│   │   └── db.ts                     # MongoDB & persistence connection manager
│   ├── controllers/
│   │   ├── adminController.ts        # Admin analytics, processing, verification
│   │   ├── authController.ts         # Register, login, profile, me
│   │   ├── documentTypeController.ts # Master document catalog
│   │   ├── notificationController.ts # Citizen notification system
│   │   ├── publicController.ts       # Public status tracking & catalog
│   │   └── requestController.ts      # Application filing, cancellation, downloads
│   ├── middleware/
│   │   ├── auth.ts                   # JWT authentication token verification
│   │   ├── role.ts                   # Role-Based Access Control (RBAC)
│   │   ├── upload.ts                 # Multer MIME & size validation (5MB max)
│   │   └── errorHandler.ts           # Centralized exception formatter
│   ├── models/
│   │   └── index.ts                  # User, DocumentType, Request, History, Notification, AuditLog
│   ├── routes/
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── documentTypeRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── publicRoutes.ts
│   │   └── requestRoutes.ts
│   ├── seed/
│   │   └── seedData.ts               # Demo users, 10 document types, sample applications
│   ├── services/
│   │   ├── statusWorkflow.ts         # State transition rules engine
│   │   └── government/
│   │       └── GovernmentDocumentService.ts # External API integration adapter
│   ├── tests/
│   │   └── api.test.ts               # Automated RBAC, IDOR, transition test suite
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── requestNumber.ts          # Auto-generates GOV-YYYY-XXXXXX
│   └── app.ts                        # Express application configuration
├── src/
│   ├── components/
│   │   ├── Footer.tsx
│   │   ├── Modal.tsx
│   │   ├── Navbar.tsx
│   │   ├── Pagination.tsx
│   │   ├── StatusBadge.tsx
│   │   └── TimelineView.tsx          # Vertical progress stepper & history log
│   ├── context/
│   │   └── AuthContext.tsx           # User session, login, quick demo switchers
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminAuditLogsPage.tsx
│   │   │   ├── AdminDashboard.tsx    # Recharts analytics & live queue
│   │   │   ├── AdminDocumentTypesPage.tsx
│   │   │   ├── AdminProcessRequestPage.tsx # Split-screen review workstation
│   │   │   ├── AdminProfilePage.tsx
│   │   │   ├── AdminRequestsPage.tsx # Search, filter, pagination
│   │   │   └── AdminUsersPage.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── citizen/
│   │   │   ├── ApplyDocumentPage.tsx # 4-step dynamic application wizard
│   │   │   ├── CitizenDashboard.tsx
│   │   │   ├── CitizenProfilePage.tsx
│   │   │   ├── MyRequestsPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   └── RequestDetailsPage.tsx
│   │   └── public/
│   │       ├── LandingPage.tsx
│   │       ├── ServicesPage.tsx
│   │       └── TrackRequestPage.tsx  # Public tracking by reference number
│   ├── routes/
│   │   └── AppRoutes.tsx             # ProtectedRoute & RoleProtectedRoute
│   ├── services/
│   │   ├── adminService.ts
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── documentTypeService.ts
│   │   ├── notificationService.ts
│   │   ├── publicService.ts
│   │   └── requestService.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── server.ts                         # Full-stack entry point (Express + Vite)
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Request Status Workflow & State Machine

Status transitions are enforced by `server/services/statusWorkflow.ts`:

```
               [ SUBMITTED ]
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
[ CANCELLED ]                [ UNDER_REVIEW ]
(by citizen)                       │
                                   ▼
                      [ DOCUMENT_VERIFICATION ]
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     [ REJECTED ]    [ ADDITIONAL_DOCUMENT_REQUIRED ] [ PROCESSING ]
     (with reason)                 │                    │
                                   │ (after upload)     ▼
                                   └───────────────> [ APPROVED ]
                                                        │
                                                        ▼
                                             [ READY_FOR_DOWNLOAD ]
                                                        │
                                                        ▼
                                                  [ COMPLETED ]
```

Every status update:
- Validates that the transition is legal.
- Updates the `Request` record.
- Appends to `RequestStatusHistory` with the actor, timestamp, and official remarks.
- Dispatches an in-portal `Notification` to the citizen.
- Records an entry in the immutable `AuditLog`.

---

## 5. Pre-Seeded Demo Accounts

The application is pre-seeded with realistic demonstration data for immediate review.

| Role | Name | Email | Password | Pre-Seeded Requests |
|---|---|---|---|---|
| **Officer (Admin)** | Vikram Sharma | `admin@govtrack.demo` | `Admin@123456` | Full administrative oversight |
| **Citizen (Rahul)** | Rahul Patel | `citizen@govtrack.demo` | `Citizen@123456` | `GOV-2026-000001` (Ready), `GOV-2026-000002` (Verification), `GOV-2026-000005` (Submitted), `GOV-2026-000006` (Rejected) |
| **Citizen (Priya)** | Priya Deshmukh | `priya.deshmukh@govtrack.demo` | `Citizen@123456` | `GOV-2026-000003` (Doc Needed), `GOV-2026-000004` (Completed) |

*Tip: You can use the 1-Click "Demo Switcher" buttons located in the top navigation bar to test both citizen and officer roles without typing passwords.*

---

## 6. Local Setup & Running Instructions

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### 1. Installation
```bash
git clone <repo-url>
cd govtrack
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/govtrack
JWT_SECRET=super_secret_jwt_key_govtrack_2026
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=super_refresh_jwt_key_govtrack_2026
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=./uploads
GOVERNMENT_API_BASE_URL=https://api.digitallocker.gov.in/v1
GOVERNMENT_API_KEY=sample_gov_api_key_demo
VITE_API_URL=/api
```

*(Note: If a local MongoDB instance is not running, GovTrack automatically falls back to its built-in persistent document store in `data/govtrack_db.json`. No external database setup is required to evaluate the portal!)*

### 3. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### 4. Run Automated Test Suite
GovTrack includes automated tests verifying RBAC, IDOR prevention, and workflow transitions:
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## 7. REST API Documentation Overview

### Authentication
- `POST /api/auth/register` — Register new citizen account.
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `PATCH /api/auth/profile` — Update contact & address information.
- `POST /api/auth/logout` — End user session.

### Document Types Catalog
- `GET /api/document-types` — List all active statutory certificates.
- `GET /api/document-types/:id` — Get document type with required proofs list.
- `POST /api/document-types` — Create document type (Admin).
- `PUT /api/document-types/:id` — Update document type (Admin).
- `PATCH /api/document-types/:id/status` — Toggle active status (Admin).

### Citizen Request Operations
- `POST /api/requests` — Submit application with multipart proofs.
- `GET /api/requests/my` — List citizen's applications with pagination.
- `GET /api/requests/:id` — View application details (Enforces IDOR ownership check).
- `PATCH /api/requests/:id/cancel` — Cancel request (Permitted only at `SUBMITTED` stage).
- `POST /api/requests/:id/documents` — Upload additional document requested by officer.
- `GET /api/requests/:id/documents/:docId/download` — Secure authenticated file download.
- `GET /api/requests/:id/final-document/download` — Download issued digital certificate.

### Administrative Console
- `GET /api/admin/dashboard` — Live counts, status breakdown, Recharts series.
- `GET /api/admin/requests` — Filterable, sortable, paginated request queue.
- `GET /api/admin/requests/:id` — Full dossier for processing.
- `PATCH /api/admin/requests/:id/status` — Update stage with remarks.
- `PATCH /api/admin/requests/:id/documents/:docId/verify` — Verify or reject proof.
- `POST /api/admin/requests/:id/additional-document` — Request additional proof.
- `POST /api/admin/requests/:id/final-document` — Issue and attach signed certificate.
- `GET /api/admin/users` — Manage citizen and officer accounts.
- `PATCH /api/admin/users/:id/status` — Deactivate / activate user.
- `GET /api/admin/audit-logs` — Immutable audit ledger.

### Public Self-Service
- `GET /api/public/track/:requestNumber` — Public status tracking and milestone timeline (applicant name masked for privacy).
- `GET /api/public/document-types` — Public certificate catalog.

---

## 8. Security Hardening & Controls

- **IDOR Protection**: Citizens can only query their own applications (`request.citizen === req.user._id`). Attempting to manipulate IDs returns `403 Forbidden`.
- **Role-Based Access Control (RBAC)**: All administrative endpoints are guarded by `authorizeRoles('admin')`.
- **Private File Storage**: Uploaded proofs are stored outside public web roots and accessed exclusively via authenticated streaming endpoints.
- **Input Sanitization**: File uploads are restricted to `.pdf`, `.jpg`, `.jpeg`, and `.png` with strict 5MB size limits.
- **Workflow Integrity**: Status transitions cannot skip required phases; direct jumps are rejected by the workflow state machine.

---

## 9. Future Government API Integration Guide

The codebase is engineered with clear enterprise extension points:

### File: `server/services/government/GovernmentDocumentService.ts`
1. **DigiLocker Integration**:
   Connects to the National DigiLocker API to automatically pull Aadhaar XML or secondary school certificates rather than asking citizens to manually scan documents.
2. **e-Pramaan / National Single Sign-On (NSSO)**:
   OAuth2 endpoints in `server/routes/authRoutes.ts` can be wired directly to state identity gateways.
3. **SMS / WhatsApp Gateway**:
   In `server/controllers/adminController.ts`, notifications can trigger an SMS payload via CDAC Mobile Seva or Twilio.
4. **Digital Signature (e-Sign)**:
   `uploadFinalDocument` can route through Aadhaar-based e-Sign (C-DAC / NSDL) to embed cryptographic digital signature certificates directly into the generated PDF.
