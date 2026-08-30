# Project: NAWI-ReportPro

## Architecture
NAWI-ReportPro is an enterprise-grade digital verification and test report generation platform for Non-Automatic Weighing Instruments (NAWI) conforming to OIML R-76 (Edition 2006/E) and the Legal Metrology Act, 2009.

### High-Level Components
1. **Client (`client/`)**: React 18 + Vite SPA with Tailwind CSS, TanStack Query, React Router, Canvas/SVG charting, Web Serial / Telemetry UI, and Offline PWA IndexedDB sync engine.
2. **Server (`server/`)**: Node.js + Express REST API with Prisma ORM (PostgreSQL), OIML R-76 calculation engines, ISO GUM uncertainty budget calculator, RS-232 telemetry streaming simulator (SICS, Avery, Essae), cryptographic HMAC verification seals, and PDFKit report generation.
3. **Database (`server/prisma/schema.prisma`)**: PostgreSQL storing Users, Instruments, TestSessions, TestResults, and AuditLogs.
4. **Test Infrastructure (`tests/`, root & package scripts)**: Vitest + Supertest testing framework structured into 4 opaque-box tiers + Tier 5 adversarial hardening.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Multi-Interval & Multi-Range Scales | Support for tiered verification scale intervals ($e_1, e_2, e_3$) and capacity ranges ($Max_1, Max_2, Max_3$) with zone-specific MPE switching | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Tare Effect on MPE | Subtractive tare ($Max_{net} = Max - T$) and additive tare ($Max_{gross} = Max + T$) MPE step-point adjustments | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Measurement Uncertainty Budget | GUM / EURAMET cg-18 expanded uncertainty calculation ($U = k \cdot u_c, k=2$) covering repeatability, resolution, standards, eccentricity, and drift | M1 | ORIGINAL_REQUEST §R1 |
| F4 | Boundary Load Point Generator | Automated generation of exact OIML R-76 boundary step points ($500e, 2000e, 10000e$) and hysteresis checking ($Hys \le MPE$) | M1 | ORIGINAL_REQUEST §R1 |
| F5 | Live RS-232 / USB Serial Telemetry Simulator | Real-time continuous ASCII/Hex streaming of weighing indicator protocols (Mettler Toledo SICS, Avery Weigh-Tronix, Essae) | M2 | ORIGINAL_REQUEST §R2 |
| F6 | Zero-Tracking & Stable Weight Lock | Dynamic zero-tracking simulation, motion detection, stability locking, and single-click automated data capture into active test table | M2 | ORIGINAL_REQUEST §R2 |
| F7 | Batch CSV/Excel Weighbridge Import/Export | High-throughput 10-point calibration series import from CSV and export with automated error computations | M2 | ORIGINAL_REQUEST §R2 |
| F8 | Dynamic Error Envelope Curve Visualization | Interactive SVG/Canvas chart plotting applied load $L$ vs indicated error $E_c$ against stepped $\pm\text{MPE}$ limits | M3 | ORIGINAL_REQUEST §R3 |
| F9 | Public Verification Portal (`/verify/:certificateNo`) | Unauthenticated public route for traders/consumers to verify certificates and inspect cryptographic legal seals via QR code | M3 | ORIGINAL_REQUEST §R3 |
| F10 | Cryptographic HMAC Digital Seals | Tamper-evident SHA-256 / HMAC digital verification seal generated on certificate creation and validated on public portal | M3 | ORIGINAL_REQUEST §R3 |
| F11 | Offline PWA & Service Worker Caching | Web App Manifest and Service Worker caching app shell and static assets for remote agricultural mandis | M4 | ORIGINAL_REQUEST §R4 |
| F12 | Resilient IndexedDB Sync Queue | Browser-side resilient queue caching pending test sessions/results offline and auto-draining to backend on reconnect | M4 | ORIGINAL_REQUEST §R4 |
| F13 | Backend Idempotent Batch Sync Endpoint | `POST /api/sync/batch` transactional endpoint with idempotency keys to safely commit offline inspection runs | M4 | ORIGINAL_REQUEST §R4 |
| F14 | Comprehensive 4-Tier Automated Test Suite | Vitest + Supertest test infrastructure with 100% test pass rate across all calculation and API modules | E2E Track & M5 | ORIGINAL_REQUEST §Criteria |
| F15 | Zero Build and Lint Errors | Clean compilations across root, client, and server workspaces | M5 | ORIGINAL_REQUEST §Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Test harness, test runners (Vitest), Tiers 1-4 tests, TEST_INFRA.md, TEST_READY.md | none | IN_PROGRESS |
| M1 | Metrological & OIML R-76 Hardening | Multi-interval ($e_1, e_2, e_3$), tare subtractive/additive, expanded uncertainty budget ($U=2\cdot u_c$), boundary step points, hysteresis | none | PLANNED |
| M2 | Live RS-232 Serial Telemetry & CSV Import | SICS, Avery, Essae protocol simulators, zero-tracking, stability lock, single-click capture toolbar, batch CSV import/export | none | PLANNED |
| M3 | Error Envelope Curves & Public Portal | SVG/Canvas Error Envelope Chart, public `/verify/:certificateNo` route, HMAC digital seal, scannable QR verification | M1 | PLANNED |
| M4 | Offline PWA & Resilient Sync Queue | Service Worker, manifest, IndexedDB offline queue, reconnect auto-sync hook, `POST /api/sync/batch` idempotent backend | none | PLANNED |
| M5 | Final E2E Test Suite & Adversarial Hardening | Pass 100% E2E tests (Tiers 1-4), Tier 5 white-box adversarial stress testing, zero build/lint errors | E2E, M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Metrology Engine Contract (`server/src/services/mpeCalculator.js` & `client/src/utils/metrology.js`)
```typescript
interface MultiIntervalRange {
  max: number; // Upper limit of interval range (e.g. Max_1, Max_2)
  e: number;   // Verification scale interval for this range (e.g. e_1, e_2)
  d?: number;  // Actual scale interval
}

interface UncertaintyBudget {
  standardUncertainty: number; // u_c
  expandedUncertainty: number; // U = k * u_c
  coverageFactor: number;      // k = 2 (95% level of confidence)
  effectiveDOF: number;        // Degrees of freedom
  components: {
    repeatability: number;     // u_rep
    resolution: number;        // u_res = d / (2 * sqrt(3))
    standardWeights: number;   // u_std = MPE_std / sqrt(3)
    eccentricity: number;      // u_ecc
    temperature: number;       // u_temp
  };
}

function calculateMultiIntervalMPE(
  load: number,
  accuracyClass: 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IIII',
  ranges: MultiIntervalRange[],
  isInService?: boolean,
  tare?: { value: number; type: 'SUBTRACTIVE' | 'ADDITIVE' }
): { mpe: number; currentRangeIndex: number; currentE: number };

function computeExpandedUncertainty(
  repeatabilityStdDev: number,
  scaleInterval_d: number,
  appliedLoad: number,
  accuracyClass: string,
  options?: { eccError?: number; tempVariation?: number }
): UncertaintyBudget;
```

### 2. Telemetry Streaming Contract (`server/src/services/telemetrySimulator.js`)
```typescript
interface IndicatorFrame {
  protocol: 'METTLER_SICS' | 'AVERY_WEIGH_TRONIX' | 'ESSAE';
  rawAscii: string;
  rawHex: string;
  weight: number;
  unit: 'kg' | 'g' | 't' | 'mg';
  isStable: boolean;
  isZero: boolean;
  isOverload: boolean;
  timestamp: string;
}

// REST / SSE endpoints
GET /api/telemetry/stream?protocol=METTLER_SICS&targetWeight=500&noise=0.02
POST /api/telemetry/zero
POST /api/batch/import-csv (multipart/form-data with CSV file -> parsed 10-point test series)
GET /api/batch/export-csv?sessionId=UUID
```

### 3. Public Verification & Digital Seal Contract
```typescript
interface PublicVerificationResponse {
  valid: boolean;
  certificateNumber: string;
  instrument: {
    name: string;
    model: string;
    serialNumber: string;
    accuracyClass: string;
    maxCapacity: number;
    verificationInterval: number;
    unit: string;
  };
  verificationDate: string;
  expiryDate: string;
  status: 'VERIFIED_LEGAL' | 'REJECTED' | 'EXPIRED';
  verificationOfficer: { name: string; designation: string; jurisdiction: string };
  sealSignature: string; // HMAC-SHA256
  errorCurveData: Array<{ load: number; error: number; mpeUpper: number; mpeLower: number }>;
}

GET /api/reports/verify/:certificateNo -> PublicVerificationResponse
```

### 4. Offline Sync Contract (`server/src/controllers/sync.controller.js`)
```typescript
interface SyncBatchPayload {
  idempotencyKey: string;
  timestamp: string;
  offlineOfficerId: string;
  sessions: Array<{
    localId: string;
    instrumentId: string;
    testDate: string;
    overallStatus: string;
    notes?: string;
    results: Array<{
      testType: string;
      passed: boolean;
      data: any;
      calculations: any;
    }>;
  }>;
}

POST /api/sync/batch -> { success: boolean; syncedCount: number; sessionIds: string[] }
```

---

## Code Layout & File Ownership

```
d:\sih/
├── client/
│   ├── public/
│   │   ├── manifest.json              [Owned by M4]
│   │   └── sw.js                      [Owned by M4]
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   └── ErrorEnvelopeChart.jsx  [Owned by M3]
│   │   │   ├── telemetry/
│   │   │   │   └── SerialTelemetryToolbar.jsx [Owned by M2]
│   │   │   ├── batch/
│   │   │   │   └── BatchCsvModal.jsx       [Owned by M2]
│   │   │   └── layout/
│   │   │       └── TopBar.jsx              [Owned by M4]
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   └── PublicVerificationPage.jsx [Owned by M3]
│   │   │   ├── tests/
│   │   │   │   └── TestDataEntryPage.jsx   [Owned by M1, M2]
│   │   │   └── reports/
│   │   │       └── ReportPage.jsx          [Owned by M3]
│   │   ├── services/
│   │   │   └── offlineQueue.js             [Owned by M4]
│   │   ├── hooks/
│   │   │   └── useOfflineSync.js           [Owned by M4]
│   │   ├── utils/
│   │   │   ├── metrology.js                [Owned by M1]
│   │   │   └── uncertainty.js              [Owned by M1]
│   │   ├── App.jsx                         [Owned by M3]
│   │   └── main.jsx                        [Owned by M4]
│   └── package.json                        [Owned by E2E Track]
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   ├── mpeCalculator.js            [Owned by M1]
│   │   │   ├── uncertaintyCalculator.js    [Owned by M1]
│   │   │   ├── telemetrySimulator.js       [Owned by M2]
│   │   │   ├── batchImportExport.js        [Owned by M2]
│   │   │   ├── cryptoSeal.js               [Owned by M3]
│   │   │   ├── pdfCertificate.js           [Owned by M1, M3]
│   │   │   └── pdfDataSheet.js             [Owned by M1, M3]
│   │   ├── routes/
│   │   │   ├── telemetry.routes.js         [Owned by M2]
│   │   │   ├── batch.routes.js             [Owned by M2]
│   │   │   ├── sync.routes.js              [Owned by M4]
│   │   │   └── reports.routes.js           [Owned by M3]
│   │   ├── controllers/
│   │   │   ├── telemetry.controller.js     [Owned by M2]
│   │   │   ├── batch.controller.js         [Owned by M2]
│   │   │   ├── sync.controller.js          [Owned by M4]
│   │   │   └── reports.controller.js       [Owned by M3]
│   │   └── index.js                        [Owned by M2, M4]
│   └── package.json                        [Owned by E2E Track]
├── tests/
│   ├── tier1_feature/                      [Owned by E2E Track]
│   ├── tier2_boundary/                     [Owned by E2E Track]
│   ├── tier3_combinations/                 [Owned by E2E Track]
│   ├── tier4_scenarios/                    [Owned by E2E Track]
│   └── tier5_adversarial/                  [Owned by M5]
└── package.json                            [Owned by E2E Track]
```
