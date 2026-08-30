# NAWI-ReportPro: In-Depth Server & Backend Architecture Survey Report

**Author**: Explorer 2 (Server & Backend Architecture Explorer)  
**Date**: 2026-08-30  
**Target System**: Backend API Server (`d:\sih\server`)  
**Hackathon Target**: Smart India Hackathon (SIH 2026) — Problem Statement ID 26035 (Ministry of Consumer Affairs, Food & Public Distribution)  
**Reference Standards**: OIML R-76 (Edition 2006/E) Parts 1 & 2; Legal Metrology Act 2009 & General Rules 2011  

---

## 1. Executive Summary & Architecture Overview

The backend of **NAWI-ReportPro** is a modular RESTful API service built on **Node.js** with **Express.js (v4.19.2)** and **Prisma ORM (v5.10.2)** interacting with a **PostgreSQL 14+** relational database. The system is designed to automate metrological test data collection, OIML R-76 verification calculations, PDF certificate/datasheet generation, and audit logging.

### System Architecture Snapshot
```
┌───────────────────────────────────────────────────────────────────────────┐
│                           Client / Consumer                               │
│              (Vite React Frontend / Public QR Code Scanners)              │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTP / REST (Port 5000)
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                     Express API Server (src/index.js)                     │
│  - Helmet (Security Headers)              - CORS (Configurable Origin)    │
│  - Morgan (HTTP Dev Logging)              - JSON & URL-Encoded Parsers    │
├───────────────────────────────────────────────────────────────────────────┤
│                                Middleware                                 │
│  - auth.js (JWT verifyToken & RBAC requireRole)                           │
│  - auditLog.js (Immutable Audit Logger with IP capture)                   │
├───────────────────────────────────────────────────────────────────────────┤
│                               Route Modules                               │
│  ├── /api/auth          ──> auth.routes.js        (Login, Logout, Me)     │
│  ├── /api/instruments   ──> instruments.routes.js (CRUD, Pagination, Filt)│
│  ├── /api/tests         ──> tests.routes.js       (Sessions, Results, End)│
│  ├── /api/reports       ──> reports.routes.js     (PDFs & /verify/:certNo)│
│  ├── /api/dashboard     ──> dashboard.routes.js   (Stats, KPIs, Recent)   │
│  ├── /api/users         ──> users.routes.js       (Admin User Management) │
│  └── /api/audit         ──> audit.routes.js       (Audit Log Queries)     │
├───────────────────────────────────────────────────────────────────────────┤
│                             Service Layer                                 │
│  ├── mpeCalculator.js   ──> OIML R-76 MPE Engine (6 Test Categories)      │
│  ├── pdfCertificate.js  ──> Single-Page Official Verification Certificate │
│  ├── pdfDataSheet.js    ──> Multi-Page Technical Metrology Datasheet      │
│  └── pdfGenerator.js    ──> Unified PDF Export Facade                     │
├───────────────────────────────────────────────────────────────────────────┤
│                          Database & Persistence                           │
│  ├── lib/prisma.js      ──> PrismaClient Singleton Instance               │
│  ├── prisma/schema.prisma (User, Instrument, TestSession, TestResult, Log)│
│  └── PostgreSQL Database (nawi_reportpro)                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server Framework, Dependencies & Configuration

### 2.1 Dependencies Audit (`server/package.json`)
| Dependency | Version | Category | Purpose | Status / Notes |
|---|---|---|---|---|
| `express` | `^4.19.2` | Core | HTTP Web Server Framework | Active |
| `@prisma/client` | `^5.10.2` | Database | Type-safe PostgreSQL Client | Active |
| `prisma` | `^5.10.2` | Tooling | Schema migrations & DB generator | Dev dependency |
| `jsonwebtoken` | `^9.0.2` | Security | JWT token issuance and verification | Active (24h expiry) |
| `bcryptjs` | `^2.4.3` | Security | Password hashing (10 salt rounds) | Active |
| `helmet` | `^7.1.0` | Security | HTTP security headers | Active |
| `cors` | `^2.8.5` | Security | Cross-Origin Resource Sharing | Active |
| `express-validator` | `^7.0.1` | Validation | Request body and query validation | Active across routes |
| `morgan` | `^1.10.0` | Logging | HTTP request logger | Active in non-test env |
| `dotenv` | `^16.4.5` | Config | Environment variables loader | Active |
| `pdfkit` | `^0.15.0` | Reporting | Programmatic vector PDF generation | Active |
| `qrcode` | `^1.5.3` | Reporting | QR code generation for certificates | Active |
| `multer` | `^1.4.5-lts.1`| File Upload | Multipart form/data upload | **Installed but unused** |
| `nodemon` | `^3.1.0` | Dev Tool | Live reload dev server | Active |

### 2.2 Environment Configuration (`server/.env`)
- `DATABASE_URL`: `postgresql://postgres:7014@localhost:5432/nawi_reportpro`
- `JWT_SECRET`: Configured with fallback secret
- `PORT`: `5000` (Defaults to 5000)
- `NODE_ENV`: `development`

---

## 3. Database Architecture (Prisma ORM & PostgreSQL)

### 3.1 Schema Definition (`server/prisma/schema.prisma`)
The relational schema comprises **5 core entities** and **5 metrological enumerations**:

#### Enumerations
1. `Role`: `ADMIN`, `INSPECTOR`, `VIEWER`
2. `AccuracyClass`: `CLASS_I` (Special), `CLASS_II` (High), `CLASS_III` (Medium), `CLASS_IIII` (Ordinary)
3. `InstrumentType`: `ELECTRONIC_SCALE`, `PLATFORM_SCALE`, `WEIGHBRIDGE`, `LABORATORY_BALANCE`
4. `TestStatus`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`
5. `TestType`: 6 standardized OIML R-76 test types:
   - `WEIGHING_PERFORMANCE`
   - `REPEATABILITY`
   - `ECCENTRICITY`
   - `TEMPERATURE`
   - `STABILITY`
   - `TIME_DEPENDENCE`

#### Models & Entity Relationships
```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  password     String
  name         String
  role         Role          @default(INSPECTOR)
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  testSessions TestSession[]
  auditLogs    AuditLog[]
}

model Instrument {
  id                   String         @id @default(uuid())
  name                 String
  type                 InstrumentType
  manufacturer         String
  model                String
  serialNumber         String         @unique
  accuracyClass        AccuracyClass
  maxCapacity          Float
  minCapacity          Float
  verificationInterval Float          // e value
  actualInterval       Float          // d value
  unit                 String         @default("kg")
  location             String
  isActive             Boolean        @default(true)
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt
  testSessions         TestSession[]
}

model TestSession {
  id            String       @id @default(uuid())
  certificateNo String       @unique
  instrumentId  String
  instrument    Instrument   @relation(fields: [instrumentId], references: [id])
  conductedById String
  conductedBy   User         @relation(fields: [conductedById], references: [id])
  status        TestStatus   @default(PENDING)
  overallResult String?      // PASS or FAIL
  temperature   Float?       // ambient temperature during test
  humidity      Float?       // ambient humidity
  remarks       String?
  startedAt     DateTime     @default(now())
  completedAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  testResults   TestResult[]
}

model TestResult {
  id            String      @id @default(uuid())
  testSessionId String
  testSession   TestSession @relation(fields: [testSessionId], references: [id], onDelete: Cascade)
  testType      TestType
  status        TestStatus  @default(PENDING)
  result        String?     // PASS or FAIL
  data          Json        // raw measurement data
  calculations  Json?       // calculated errors, MPE comparisons
  remarks       String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([testSessionId, testType])
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // LOGIN, CREATE_INSTRUMENT, ENTER_TEST_DATA, etc.
  entityType String?  // Instrument, TestSession, TestResult, User
  entityId   String?
  details    String?
  oldValues  Json?
  newValues  Json?
  ipAddress  String?
  createdAt  DateTime @default(now())
}
```

### 3.2 Seed Script & Existing Data (`server/prisma/seed.js`)
The seed script provisions:
- **4 Users**: `admin@nawi.gov.in`, `inspector@nawi.gov.in`, `officer@nawi.gov.in`, `viewer@nawi.gov.in` (password: `password123`).
- **5 Instruments**:
  1. Contech Precision Lab Balance (Class II, Max: 0.310 kg, e: 1mg, d: 0.1mg, unit: g)
  2. Essae Platform Scale (Class III, Max: 300 kg, e: 100g, d: 50g, unit: kg)
  3. Ace Retail Counter Scale (Class III, Max: 30 kg, e: 10g, d: 5g, unit: kg)
  4. Avery Weighbridge (Class IIII, Max: 60,000 kg, e: 20kg, d: 10kg, unit: kg)
  5. Phoenix Jewelry Scale (Class II, Max: 0.600 kg, e: 10mg, d: 1mg, unit: g)
- **4 Test Sessions**:
  1. `NAWI-2026-000001` (ALL PASS across all 6 test types)
  2. `NAWI-2026-000002` (FAIL due to Eccentricity off-center non-conformance)
  3. `NAWI-2026-000003` (ALL PASS on Jewelry Scale)
  4. `NAWI-2026-000004` (IN PROGRESS on Weighbridge - 3 tests completed)
- **23 Audit Logs** capturing historical actions.

---

## 4. API Routes, Controllers & Middleware Architecture

### 4.1 Middleware Layer
1. **`src/middleware/auth.js`**:
   - `verifyToken`: Validates `Authorization: Bearer <token>`, looks up active user in DB, populates `req.user`.
   - `requireRole(...roles)`: Verifies role membership against `['ADMIN', 'INSPECTOR', 'VIEWER']`.
2. **`src/middleware/auditLog.js`**:
   - `createAuditLog({ userId, action, entityType, entityId, details, oldValues, newValues, ipAddress })`: Asynchronously records immutable audit trail entries in database without blocking business transactions.
   - `getClientIp(req)`: Robust IP extraction supporting reverse proxies (`x-forwarded-for`).

### 4.2 Endpoint Matrix
| Route Path | Method | Auth / RBAC | Controller Location | Description |
|---|---|---|---|---|
| `/api/health` | `GET` | Public | `src/index.js:37` | System health check and OIML R-76 engine status |
| `/api/auth/login` | `POST` | Public | `src/routes/auth.routes.js:16` | User authentication, password verification, JWT issuance |
| `/api/auth/logout` | `POST` | `verifyToken` | `src/routes/auth.routes.js:102` | Session logout & audit logging |
| `/api/auth/me` | `GET` | `verifyToken` | `src/routes/auth.routes.js:124` | Active user profile retrieval |
| `/api/instruments` | `GET` | `verifyToken` | `src/routes/instruments.routes.js:12` | Paginated search and filtering of instruments |
| `/api/instruments/:id` | `GET` | `verifyToken` | `src/routes/instruments.routes.js:75` | Single instrument details with test session history |
| `/api/instruments` | `POST` | `ADMIN, INSPECTOR` | `src/routes/instruments.routes.js:110` | Register instrument with validation and uniqueness checks |
| `/api/instruments/:id` | `PUT` | `ADMIN, INSPECTOR` | `src/routes/instruments.routes.js:205` | Update instrument specifications |
| `/api/instruments/:id` | `DELETE` | `ADMIN` | `src/routes/instruments.routes.js:269` | Soft deactivate instrument (`isActive = false`) |
| `/api/tests` | `GET` | `verifyToken` | `src/routes/tests.routes.js:33` | Paginated test sessions with filters |
| `/api/tests/:id` | `GET` | `verifyToken` | `src/routes/tests.routes.js:86` | Test session details with nested results |
| `/api/tests` | `POST` | `ADMIN, INSPECTOR` | `src/routes/tests.routes.js:117` | Create session with auto-generated certificate ID |
| `/api/tests/:id` | `PUT` | `ADMIN, INSPECTOR` | `src/routes/tests.routes.js:188` | Update test environmental metadata |
| `/api/tests/:sessionId/results` | `POST` | `ADMIN, INSPECTOR` | `src/routes/tests.routes.js:251` | Submit raw measurement data, evaluate MPE, save result |
| `/api/tests/:sessionId/results/:testType` | `PUT` | `ADMIN, INSPECTOR` | `src/routes/tests.routes.js:335` | Modify test data and re-evaluate |
| `/api/tests/:sessionId/finalize` | `POST` | `ADMIN, INSPECTOR` | `src/routes/tests.routes.js:415` | Enforce 6-test completion and determine PASS/FAIL verdict |
| `/api/reports/:sessionId/certificate` | `GET` | `verifyToken` | `src/routes/reports.routes.js:12` | Generate single-page official A4 PDF Certificate |
| `/api/reports/:sessionId/datasheet` | `GET` | `verifyToken` | `src/routes/reports.routes.js:54` | Generate multi-page detailed Technical Datasheet PDF |
| `/api/reports/verify/:certificateNo` | `GET` | **Public** | `src/routes/reports.routes.js:96` | Public QR code verification lookup endpoint |
| `/api/dashboard/stats` | `GET` | `verifyToken` | `src/routes/dashboard.routes.js:10` | Summary statistics, KPIs, pass rate, class breakdown |
| `/api/dashboard/recent` | `GET` | `verifyToken` | `src/routes/dashboard.routes.js:72` | 20 most recent sessions & audit records |
| `/api/users` | `GET` | `ADMIN` | `src/routes/users.routes.js:13` | Paginated user management list |
| `/api/users` | `POST` | `ADMIN` | `src/routes/users.routes.js:65` | Create new user with role assignment |
| `/api/users/:id` | `PUT` | `ADMIN` | `src/routes/users.routes.js:143` | Update user details or role |
| `/api/users/:id` | `DELETE` | `ADMIN` | `src/routes/users.routes.js:229` | Soft deactivate user (blocks self-deactivation) |
| `/api/audit` | `GET` | `ADMIN, INSPECTOR, VIEWER` | `src/routes/audit.routes.js:10` | Query audit trail with multiple filters |

---

## 5. Metrological Services Deep Dive (`mpeCalculator.js`)

### 5.1 OIML R-76 Table 3 MPE Implementation
`src/services/mpeCalculator.js` encapsulates the mathematical rules for OIML R-76-1 Table 3:
- **Class I**: $0 \to 50\,000e$ ($\pm 0.5e$), $50\,000 \to 200\,000e$ ($\pm 1.0e$), $> 200\,000e$ ($\pm 1.5e$)
- **Class II**: $0 \to 5\,000e$ ($\pm 0.5e$), $5\,000 \to 20\,000e$ ($\pm 1.0e$), $20\,000 \to 100\,000e$ ($\pm 1.5e$)
- **Class III**: $0 \to 500e$ ($\pm 0.5e$), $500 \to 2\,000e$ ($\pm 1.0e$), $2\,000 \to 10\,000e$ ($\pm 1.5e$)
- **Class IIII**: $0 \to 50e$ ($\pm 0.5e$), $50 \to 200e$ ($\pm 1.0e$), $200 \to 1\,000e$ ($\pm 1.5e$)
- In-service multiplier: doubles initial verification MPE ($2 \times \text{MPE}$) per clause 3.5.2.

### 5.2 Discrete Rounding Error Elimination
Implements the continuous indication formula per OIML R-76 clause A.4.4.3:
$$P = I + 0.5e - \Delta L$$
$$\text{Error } E = P - L$$
$$\text{Corrected Error } E_c = E - E_0$$
where $\Delta L$ is the additional load added until the indication changes to the next higher increment.

### 5.3 Test Categories Covered
1. **Weighing Performance**: Increasing/decreasing load steps, zero-error compensation $E_0$, corrected error $E_c$ versus $MPE(L)$, hysteresis evaluation.
2. **Repeatability**: Multiple repeated loadings (e.g. 6 reps at $0.5 Max$ and $1.0 Max$), range difference $(Max - Min) \le |MPE|$.
3. **Eccentricity**: Off-center quadrant loading at $1/3 Max$, absolute error $\le MPE$.
4. **Temperature Effects**: Evaluates zero drift per $5^\circ\text{C}$ ($\le 1.0e / 5^\circ\text{C}$) and span error stability.
5. **Stability & Warm-Up**: Drift over time ($\le 1.0e$ zero drift, $\le MPE$ span drift).
6. **Time-Dependence**: 30-minute creep ($\Delta_{30-0} \le 0.5 MPE, \Delta_{30-15} \le 0.2 MPE$) and zero return after unloading ($\le 0.5e$).

---

## 6. PDF & Document Generation Services

The PDF service layer (`pdfGenerator.js`, `pdfCertificate.js`, `pdfDataSheet.js`) generates high-resolution vector PDF documents using `pdfkit`:
1. **Official Verification Certificate (`pdfCertificate.js`)**:
   - Single-page A4 official document matching Indian Legal Metrology departmental templates.
   - Government of India header, Ashoka lion / tricolor stripe bars (Saffron, White, Green).
   - Instrument specifications table, 6-test verification outcome matrix, environmental conditions box, PASS/FAIL stamp, dual signature blocks (Testing Officer & Approving Authority).
   - Embedded high-density QR code encoding verification metadata.
2. **Technical Metrology Data Sheet (`pdfDataSheet.js`)**:
   - Multi-page comprehensive technical audit document.
   - Page 1: Instrument specs, ambient parameters, executive summary table.
   - Page 2: Weighing performance 9-column calibration table (Load, Ind Inc, Err Inc, Ind Dec, Err Dec, Hysteresis, MPE, Status) and Repeatability 6-run series.
   - Page 3: Eccentricity quadrant matrix and Temperature effects evaluation.
   - Page 4: Stability/warm-up drift and Time-dependence creep & zero return.

---

## 7. Exhaustive Gap Analysis Against SIH Hackathon Requirements

### Gap Matrix & Implementation Status
| Hackathon Requirement | Core Feature Requirement | Current Server State | Gap Severity | Action Needed |
|---|---|---|---|---|
| **R1. Metrological Precision** | Multi-interval / Multi-range ($e_1, e_2, e_3$) | Only single $e$ supported in `Instrument` & `mpeCalculator.js` | **HIGH** | Upgrade schema & calculator for piecewise multi-interval ranges ($e_i, Max_i$). |
| **R1. Metrological Precision** | Tare effect (Subtractive vs Additive) | No tare mode or subtractive/additive shift logic | **MEDIUM** | Add tare fields and net/gross MPE calculation handlers. |
| **R1. Metrological Precision** | Expanded Uncertainty ($U = k \cdot u_c, k=2$) | Not computed in calculator or shown in datasheet | **HIGH** | Implement ISO GUM uncertainty engine ($u_{rep}, u_{res}, u_{std}, u_{ecc}, U$). |
| **R1. Metrological Precision** | Exact boundary load testing ($500e, 2000e, 10000e$) | Static step checks without boundary margin handling | **LOW** | Add boundary condition tests and epsilon verification. |
| **R2. Telemetry & Hardware** | Virtual RS-232 Telemetry Simulator | **Missing on backend** (No SSE/WebSocket or protocol mocks) | **CRITICAL** | Build RS-232 telemetry service with SICS, Avery, Essae protocol streaming. |
| **R2. Telemetry & Hardware** | Live zero-tracking & stable indicator lock | **Missing on backend** | **HIGH** | Add zero-tracking algorithm and stability detector in telemetry stream. |
| **R2. Telemetry & Hardware** | Batch CSV/Excel data import & export | **Missing on backend** (`multer` unused, no routes) | **CRITICAL** | Implement CSV/Excel import/export endpoints for weighbridge data. |
| **R3. Visual Analytics & Portal** | Public verification route `/verify/:certificateNo` | Backend API exists; returns JSON without digital seal | **MEDIUM** | Add cryptographic HMAC/hash seal & error curve dataset payload. |
| **R3. Visual Analytics & Portal** | Error envelope curves ($E_c$ vs $\pm MPE$) | Points calculated, but no pre-computed curve API/SVG | **MEDIUM** | Expose pre-formatted error curve data for frontend Canvas/SVG charting. |
| **R4. Offline & Sync Queue** | Offline sync queue & batch commit | **Missing on backend** (no sync endpoint, no idempotency) | **CRITICAL** | Implement `POST /api/sync/batch` with idempotency keys & transaction commit. |
| **Code Quality & Testing** | Automated test suite for calculation engine | **0 unit tests** in server; no test framework configured | **CRITICAL** | Add Jest/Vitest test suite covering all OIML R-76 calculation modules. |
| **Code Quality & Testing** | Build & lint scripts in `server/package.json` | Missing `lint`, `test`, `build` scripts | **HIGH** | Add scripts and ensure clean passes. |

---

## 8. Detailed Deep-Dive on Specific Requirements

### 8.1 Requirement R2: Telemetry Streaming & Protocols
Currently, there is no server-side telemetry simulation. To win the SIH Hackathon, the backend must provide:
1. **Multi-Protocol Simulation Engine**:
   - **Mettler Toledo SICS (Standard Interface Command Set)**:
     - `S`: Send stable weight (`S S   100.000 kg`)
     - `SI`: Send weight immediately (`S D   100.005 kg`)
     - `SIR`: Send weight continuously (streaming at 10 Hz)
     - `Z`: Zero instrument (`Z A`)
     - `T`: Tare current weight (`T S    20.000 kg`)
     - `TAC`: Clear tare (`TAC A`)
   - **Avery Weigh-Tronix**:
     - Format: `<STX><POL><DATA 7 chars><SP><UNITS 2 chars><G/N 1 char><STATUS 1 char><CR><LF>`
     - e.g. `\x02+0050.00 kg G S\r\n`
   - **Essae Digitronics**:
     - Format: `[STX][STATUS 2 chars][DATA 8 chars][UNIT 2 chars][CR][LF]`
2. **Server-Sent Events (SSE) or REST Streaming Endpoint**:
   - `GET /api/telemetry/stream?protocol=SICS&load=50&noise=0.02&rate=10`
   - Real-time continuous streaming allowing automated single-click capture into active test tables.
3. **Batch CSV/Excel Import & Export**:
   - `POST /api/tests/:sessionId/import-csv`: Accepts CSV with columns `appliedLoad, indicatedInc, deltaLInc, indicatedDec, deltaLDec`, parses via streaming parser, runs `calculateWeighingPerformance`, saves to DB.
   - `GET /api/reports/:sessionId/export/csv`: Downloads test runs in CSV format.
   - `GET /api/reports/:sessionId/export/excel`: Generates Excel format.

### 8.2 Requirement R3: Public Verification & Error Curves
1. **Public API Enhancement**:
   - Extend `GET /api/reports/verify/:certificateNo` to include:
     - `digitalSeal`: SHA-256 HMAC digest generated from `certificateNo + instrumentSerial + overallResult + completedAt + SECRET`.
     - `errorEnvelopeCurve`: Pre-formatted array of curve coordinates `[{ appliedLoad, error, mpeUpper, mpeLower, isWithinLimits }]`.
     - `qrPayload`: Ready-to-render verification string.
2. **Frontend Public Route Requirement**:
   - The frontend needs a public `/verify/:certificateNo` route accessible without officer login (currently `/verify/:certificateNo` redirects to login in React Router).

### 8.3 Requirement R4: Offline Resilient Sync Queue & Idempotency
Field officers in agricultural mandis and rural weighbridge yards frequently lose connectivity. The backend must support:
1. **Batch Sync Endpoint (`POST /api/sync/batch`)**:
   - Accepts an array of queued offline mutations:
     ```json
     {
       "syncBatchId": "uuid-batch-12345",
       "officerId": "user-uuid",
       "mutations": [
         { "type": "CREATE_INSTRUMENT", "idempotencyKey": "k1", "data": { ... } },
         { "type": "CREATE_SESSION", "idempotencyKey": "k2", "clientSessionId": "offline-s-1", "data": { ... } },
         { "type": "SUBMIT_TEST_RESULT", "idempotencyKey": "k3", "clientSessionId": "offline-s-1", "data": { ... } },
         { "type": "FINALIZE_SESSION", "idempotencyKey": "k4", "clientSessionId": "offline-s-1" }
       ]
     }
     ```
2. **Transactional Commit (`prisma.$transaction`)**:
   - Executes all operations in an ACID transaction.
   - Idempotency table or key lookup to ignore already processed operations if retried over unstable 4G/2G connections.
   - Returns client ID to server ID mapping so client IndexedDB can update foreign keys cleanly.

### 8.4 Server Build, Test & Lint Quality
1. **Testing Framework**:
   - Currently 0 tests exist.
   - We must introduce Jest/Vitest or Node test runner with 100% test coverage over:
     - `mpeCalculator.js` (Weighing performance, repeatability, eccentricity, temperature, stability, time dependence, multi-interval, tare, uncertainty).
     - All API endpoints (auth, instruments, tests, reports, verify, sync).
2. **Package.json Scripts**:
   - Add `"test": "jest --runInBand"` or `"node --test tests/**/*.test.js"`.
   - Add `"lint": "eslint src/"`.

---

## 9. Recommended Backend Implementation Blueprint

```
server/
├── prisma/
│   ├── schema.prisma            # Add Multi-Interval fields, IdempotencyLog, Uncertainty
│   └── seed.js                  # Updated seed data
├── src/
│   ├── index.js                 # Mount telemetry & sync routes
│   ├── lib/
│   │   ├── prisma.js
│   │   └── security.js          # Cryptographic HMAC seal generator
│   ├── middleware/
│   │   ├── auth.js
│   │   └── auditLog.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── instruments.routes.js
│   │   ├── tests.routes.js
│   │   ├── reports.routes.js     # Enhanced /verify/:certificateNo & CSV/Excel export
│   │   ├── telemetry.routes.js   # [NEW] RS-232 telemetry simulator & SSE streaming
│   │   ├── sync.routes.js        # [NEW] Offline batch sync & idempotency handler
│   │   ├── dashboard.routes.js
│   │   ├── users.routes.js
│   │   └── audit.routes.js
│   ├── services/
│   │   ├── mpeCalculator.js      # Upgraded: Multi-interval, Tare, Uncertainty Budget
│   │   ├── telemetryService.js   # [NEW] SICS, Avery, Essae protocol simulators & noise
│   │   ├── csvBatchService.js    # [NEW] CSV/Excel batch parsing & generation
│   │   ├── uncertaintyEngine.js  # [NEW] ISO GUM expanded uncertainty (k=2)
│   │   ├── syncService.js        # [NEW] Offline queue resolver & transactional batch
│   │   ├── pdfCertificate.js
│   │   ├── pdfDataSheet.js
│   │   └── pdfGenerator.js
│   └── tests/                    # [NEW] Automated metrology & API unit test suite
│       ├── mpeCalculator.test.js
│       ├── uncertainty.test.js
│       ├── telemetry.test.js
│       ├── sync.test.js
│       └── api.test.js
```

---

## 10. Conclusion

The existing backend has a solid foundation with well-structured Express routing, Prisma ORM modeling, JWT/RBAC security, audit logging, and sophisticated PDF generation. However, critical gaps exist against the **SIH 2026 Problem Statement 26035 requirements**:
1. **Telemetry & RS-232 simulation** is completely missing.
2. **Batch CSV/Excel import/export** is missing.
3. **Offline batch synchronization & idempotency** is missing.
4. **Multi-interval scales & Expanded Uncertainty budget ($U, k=2$)** are missing in the calculation engine.
5. **Automated test suite and lint scripts** are completely absent.

Implementing these enhancements will elevate **NAWI-ReportPro** to undisputed technical superiority for the Smart India Hackathon.
