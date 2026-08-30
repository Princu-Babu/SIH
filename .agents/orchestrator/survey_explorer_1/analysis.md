# NAWI-ReportPro: Client & UI Architecture Survey Report

**Explorer**: Explorer 1 (Client & UI Architecture Explorer)  
**Date**: 2026-08-30  
**Target Codebase**: `d:\sih\client`  
**Status**: Comprehensive Assessment Complete  

---

## 1. Executive Summary & Technology Stack

The client application for **NAWI-ReportPro** is a modern Single-Page Application (SPA) designed for the Department of Legal Metrology (Ministry of Consumer Affairs, Food & Public Distribution) to conduct OIML R-76 verification of Non-Automatic Weighing Instruments.

### Core Technology Stack

| Category | Technology | Version | Purpose / Remarks |
|---|---|---|---|
| **UI Framework** | React | `^18.2.0` | Declarative component model with Functional Components & Hooks |
| **DOM Engine** | React DOM | `^18.2.0` | Client-side DOM rendering (`createRoot`) |
| **Build Tool & Dev Server** | Vite | `^5.1.6` | Lightning-fast ESM bundler with `@vitejs/plugin-react` (`^4.2.1`) |
| **Routing** | React Router DOM | `^6.22.3` | Client-side declarative routing (`BrowserRouter`, `Routes`, `Route`, `Navigate`) |
| **Styling & CSS** | Tailwind CSS + PostCSS + Autoprefixer | `^3.4.1` / `^8.4.38` / `^10.4.19` | Utility-first styling with custom Indian Government palette (`saffron`, `govgreen`, `primary` navy/blue) |
| **Server State & Data Fetching** | TanStack React Query | `^5.28.4` | Server state caching, background invalidation, mutation workflows |
| **HTTP Client** | Axios | `^1.6.8` | Interceptor-configured REST client with JWT header injection & 401 handling |
| **Internationalization (i18n)** | i18next + react-i18next | `^23.10.1` / `^14.1.0` | Multi-language localization (English, Hindi, Tamil, Bengali) |
| **Icons** | React Icons (Feather `Fi*`) | `^5.0.1` | Consistent, lightweight SVG iconography |
| **Toast Notifications** | React Hot Toast | `^2.4.1` | Non-blocking status and error toasts |
| **Data Visualization** | Recharts | `^2.12.3` | SVG-based charting (currently only utilized on Dashboard) |
| **Date Utilities** | date-fns | `^3.6.0` | Date formatting and manipulation |
| **E2E / Headless Testing** | Puppeteer Core | `^25.9.0` | Scripted browser automation in `comprehensive-audit.js` |

---

## 2. Directory Structure & Component Inventory

```
d:\sih\client\src\
├── main.jsx                       # App bootstrap, Providers (QueryClient, Router, Auth, Toaster, i18n)
├── App.jsx                        # Route definitions & ProtectedRoute wrappers
├── index.css                      # Tailwind base, components, utilities
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx          # TopBar + Sidebar + main outlet shell
│   │   ├── TopBar.jsx             # National Emblem banner, i18n selector, user profile menu
│   │   ├── Sidebar.jsx            # Role-based navigation sidebar
│   │   └── Breadcrumb.jsx         # Contextual navigation trail
│   └── shared/
│       ├── ConfirmDialog.jsx      # Modal confirmation for destructive/signing actions
│       ├── DataTable.jsx          # Sortable, paginated, searchable generic data table
│       ├── EmptyState.jsx         # Fallback empty UI
│       ├── LoadingSpinner.jsx     # Centered loading spinner with custom message
│       ├── PageHeader.jsx         # Standardized page title, subtitle, and action buttons
│       ├── ProtectedRoute.jsx     # Auth guard checking JWT and RBAC (ADMIN, INSPECTOR, VIEWER)
│       ├── StatCard.jsx           # Dashboard KPI indicator cards
│       └── StatusBadge.jsx        # Standardized badge styling for VERDICTS (PASS/FAIL) and STATUS
├── contexts/
│   └── AuthContext.jsx            # User authentication context (JWT in localStorage, login, logout, me)
├── hooks/
│   └── useApi.js                  # Axios instance with auth interceptor and 401 automatic redirection
├── i18n/
│   ├── i18n.js                    # i18next configuration with browser language detector
│   └── locales/
│       ├── en.json                # English strings
│       ├── hi.json                # Hindi strings (हिन्दी)
│       ├── ta.json                # Tamil strings (தமிழ்)
│       └── bn.json                # Bengali strings (বাংলা)
├── pages/
│   ├── LoginPage.jsx              # Officer sign-in with quick-fill demo roles (Admin, Inspector, Auditor)
│   ├── DashboardPage.jsx          # Overview KPIs, monthly compliance bar chart, category pie chart
│   ├── SettingsPage.jsx           # Organization metadata, OIML R-76 MPE matrix, audit settings
│   ├── audit/
│   │   └── AuditLogPage.jsx       # Immutable SHA-256 chained audit trail table
│   ├── users/
│   │   └── UserManagementPage.jsx # Officer account management (Admin only)
│   ├── instruments/
│   │   ├── InstrumentListPage.jsx # Registry table with filtering by Class & Type
│   │   ├── InstrumentFormPage.jsx # Registration & edit form for NAWI parameters
│   │   └── InstrumentDetailPage.jsx # Specifications & historical verification log
│   ├── tests/
│   │   ├── TestSessionListPage.jsx   # Filterable list of all calibration sessions
│   │   ├── NewTestSessionPage.jsx    # Session initialization (instrument, ambient temp, RH, pressure)
│   │   ├── TestSessionDetailPage.jsx # 6-module verification hub & finalization trigger
│   │   └── TestDataEntryPage.jsx     # Live calculation data entry for 6 standard OIML R-76 test modules
│   └── reports/
│       └── ReportPage.jsx            # Certificate & Technical Data Sheet PDF downloads, static QR card
└── utils/
    └── metrology.js               # OIML R-76 client-side MPE, continuous indication, and rounding formulas
```

---

## 3. Deep-Dive Gap Analysis: Requirement R3
*(Interactive Error Envelope Curves & Public Verification Portal)*

### Current State vs. SIH 2026 Target

| Feature | Current State | Gap / Missing Implementation | Target Requirement |
|---|---|---|---|
| **Error Envelope Curve Visualization** | ❌ **Non-Existent**. Only tabular numbers rendered in `TestDataEntryPage.jsx` and `ReportPage.jsx`. `recharts` is only used on `DashboardPage` for generic bar/pie charts. | • No dynamic Canvas or SVG component to render error curves.<br>• No visualization plotting applied load $L$ (or scale units $m = L/e$) on X-axis vs. indicated error $E_c$ on Y-axis.<br>• No stepped tolerance boundary bands for upper/lower $\pm \text{MPE}$ ($\pm 0.5e, \pm 1.0e, \pm 1.5e$).<br>• No interactive tooltips showing delta from tolerance limit at each load step. | Deliver an interactive, judge-grade **Canvas/SVG Error Envelope Curve** component embedded directly in `TestDataEntryPage.jsx`, `TestSessionDetailPage.jsx`, and `ReportPage.jsx`. |
| **Public Verification Route (`/verify/:certificateNo`)** | ❌ **Non-Existent**. In `App.jsx`, all test/report routes are wrapped inside `<ProtectedRoute>`. Unauthenticated visitors are kicked to `/login`. | • No public verification route in `App.jsx`.<br>• No public lookup page fetching by certificate number / hash without JWT headers.<br>• `ReportPage.jsx` renders a static hardcoded SVG dummy QR code with a placeholder hash instead of a dynamic scannable QR code encoding the authentic verification URL (`/verify/<certNo>`). | Implement a public route `/verify/:certificateNo` (and `/verify/:id`) outside `ProtectedRoute` that renders a tamper-evident verification certificate card with seal verification, validity status, and officer signatures for consumers and traders. |
| **Expanded Measurement Uncertainty Budget ($U = k \cdot u_c, k=2$)** | ❌ **Non-Existent on Client**. Neither calculated in `metrology.js` nor rendered in UI. | • No calculation of repeatability uncertainty ($u_{rep}$), standard weight resolution uncertainty ($u_{res}$), or combined uncertainty ($u_c$).<br>• No expanded uncertainty display ($U$ at $k=2$, 95% confidence interval). | Display expanded uncertainty budget metrics and confidence intervals on the Technical Data Sheet view and test summary cards. |

---

## 4. Deep-Dive Gap Analysis: Requirement R4
*(Offline PWA / Local Storage Resilient Queue)*

### Current State vs. SIH 2026 Target

| Feature | Current State | Gap / Missing Implementation | Target Requirement |
|---|---|---|---|
| **Service Worker & PWA Manifest** | ❌ **Not Configured**. `index.html` has no manifest link, no service worker registration, and `vite.config.js` does not include PWA plugins. | • Application cannot be installed as a PWA on field tablets/smartphones.<br>• Assets (JS, CSS, static fonts) are not cached in CacheStorage for offline boot. | Configure Service Worker and Web App Manifest (e.g. via `vite-plugin-pwa` or custom Service Worker script) enabling full offline application launch. |
| **IndexedDB / LocalStorage Caching** | ❌ **Absent for Data**. LocalStorage is only used for `nawi_auth_token` and `nawi_auth_user`. | • When an officer navigates in remote mandis or rural warehouses without 4G/WiFi, fetching instruments or test sessions results in failed network calls.<br>• Cached instruments, draft test sessions, and officer credentials cannot be viewed offline. | Implement an IndexedDB/LocalStorage caching layer for active instruments, draft sessions, and offline inspection records. |
| **Offline Sync Queue** | ❌ **Absent**. `useMutation` directly executes HTTP `POST /api/tests/:id/results` with no offline fallback. | • If network drops during data entry, submissions fail with an error toast and input data is vulnerable to loss.<br>• No queue mechanism to buffer pending test runs locally.<br>• No background reconciliation listener (`window.addEventListener('online')`) to drain the queue when connectivity is restored. | Implement a resilient offline sync queue with visual queue indicator (e.g., "3 pending syncs — offline mode"), auto-committing pending test payloads to PostgreSQL upon reconnect. |

---

## 5. Deep-Dive Gap Analysis: Requirement R2 (UI Level)
*(Live RS-232 / USB Serial Telemetry & Batch CSV Import/Export UI)*

### Current State vs. SIH 2026 Target

| Feature | Current State | Gap / Missing Implementation | Target Requirement |
|---|---|---|---|
| **Virtual Serial Telemetry Toggle & Stream Indicator** | ❌ **Absent**. `TestDataEntryPage.jsx` has only standard `<input type="number">` fields for manual data typing. | • No telemetry toggle or Web Serial API / virtual COM port selector.<br>• No real-time indicator display showing streaming load, continuous zero-tracking, and `[STABLE]` / `[UNSTABLE]` lock status.<br>• No single-click "Capture Stable Reading" button next to each load test row. | Provide an integrated Serial Telemetry Toolbar in `TestDataEntryPage.jsx` simulating/connecting live indicator streams (Mettler Toledo SICS, Avery Weigh-Tronix, Essae) with instant single-click reading capture into the active table row. |
| **Batch CSV / Excel Import & Export UI** | ❌ **Absent**. No file upload dropzone, CSV parser, or export buttons in test entry. | • Testing high-throughput truck weighbridges (e.g. 10-point series up to 60,000 kg) requires tedious manual input per row.<br>• No client-side CSV template download or bulk CSV upload dialog.<br>• No automated calculation of MPE and pass/fail verdicts on uploaded datasets. | Implement a **Batch CSV Import/Export Modal** on `TestDataEntryPage.jsx` allowing officers to import a 10-point weighbridge CSV dataset, immediately running client-side OIML validation. |

---

## 6. Metrological & Calculation Engine Audit (`src/utils/metrology.js`)

### Current Capabilities
- Computes single-interval MPE for Class I, II, III, and IIII scales based on load ratios $m = L/e$:
  - Zone 1: $m \le 500e \to \pm 0.5e$ (Class III)
  - Zone 2: $500e < m \le 2000e \to \pm 1.0e$
  - Zone 3: $m > 2000e \to \pm 1.5e$
  - Applies $1.0\times$ multiplier for Initial Verification and $2.0\times$ for In-Service Verification.
- Contains helper functions `calculateContinuousIndication(I, e, dL)` ($P = I + 0.5e - \Delta L$) and `calculateCorrectedError(P, L, E0)` ($E = P - L, E_c = E - E_0$).

### Key Metrological Gaps on Client
1. **Multi-Interval & Multiple-Range Scales**:
   - `calculateMpe` only takes a single $e$. It does NOT support multi-interval scales ($e_1, e_2, e_3$) where $e$ steps up at switching thresholds ($Max_1, Max_2$).
2. **Tare Effect on MPE**:
   - Subtractive tare reduces the net capacity range and shifts MPE zones; additive tare increases the total gross load. Client formulas currently ignore tare impact on step boundaries.
3. **Expanded Uncertainty Engine**:
   - Client does not evaluate Type A repeatability standard uncertainty ($u_A = s / \sqrt{n}$) or Type B standard weight calibration uncertainty ($u_B = U_{std} / 2$), combined uncertainty ($u_c = \sqrt{u_A^2 + u_B^2}$), or expanded uncertainty ($U = k \cdot u_c, k=2$).

---

## 7. Build, Lint & Automated Test Health

### Build Verification
- **Command Executed**: `npm run build`
- **Result**: ✅ **Successful** (Built in 11.32s with Vite 5.4.21).
- **Generated Bundle Artifacts**:
  - `dist/index.html` (0.83 kB)
  - `dist/assets/index-DP5aqsxc.css` (26.04 kB)
  - `dist/assets/index-CQLVRqqH.js` (925.61 kB)
- **Observations**: Vite warns about bundle chunk size (>500 kB) due to vendor libraries (Recharts, React-Query, i18next). Can be optimized with dynamic imports or Rollup `manualChunks`.

### Lint & Test Configuration
- `package.json` scripts currently include: `"dev"`, `"build"`, `"preview"`.
- No `test` script (e.g. Vitest / Jest) or `lint` script is declared in `package.json`.
- E2E testing is automated via `comprehensive-audit.js` using `puppeteer-core`.

---

## 8. Actionable Architectural Blueprint & Recommendations

To fulfill all user requirements (R1, R2, R3, R4) with technical excellence for the SIH 2026 benchmark:

### 1. Interactive Error Envelope Curve Component (`ErrorEnvelopeChart.jsx`)
- Build a dedicated SVG/Canvas component rendering:
  - X-Axis: Applied Load $L$ (with tick markers at key step points: $0, 500e, 2000e, Max$).
  - Y-Axis: Error in scale units ($e$) or mass units ($kg/g$).
  - Upper & Lower MPE Boundary Lines (stepped stair-step function at $\pm 0.5e, \pm 1.0e, \pm 1.5e$).
  - Plotted Error Points ($E_{c,inc}$ and $E_{c,dec}$) connected by smooth bezier/linear curves.
  - Visual status color coding: Green dots for points inside envelope; Red warning dots with pulsed animation for points exceeding tolerance.
  - Interactive hover tooltips displaying Applied Load, Indicated Reading, Corrected Error ($E_c$), Max Permissible Error ($MPE$), and Margin.

### 2. Public Verification Portal (`/verify/:certificateNo` & `PublicVerificationPage.jsx`)
- Create a standalone public route in `App.jsx` (`/verify/:certificateNo` and `/verify/:id`) rendered **outside** `ProtectedRoute`.
- Fetch certificate data via public API endpoint (`GET /api/reports/verify/:certificateNo` or `GET /api/tests/verify/:certificateNo`).
- Display an official Government of India Verification Seal card featuring:
  - National Emblem & Legal Metrology header.
  - Certificate Number, Verification Status (`VALID & COMPLIANT` / `NON-COMPLIANT` / `EXPIRED`).
  - Instrument Model, Serial Number, Accuracy Class, Capacity.
  - Inspection Date, Expiry / Re-verification Due Date.
  - Verified Inspection Officer Name & Digital Signature Hash.
  - Cryptographic SHA-256 integrity verification badge.
- Update `ReportPage.jsx` to generate dynamic QR codes encoding the authentic host URL `window.location.origin + '/verify/' + session.certificateNumber`.

### 3. Offline PWA & Local Storage Resilient Queue
- Implement Service Worker caching for static assets.
- Implement an **Offline Sync Manager** (`offlineSync.js`) utilizing `localStorage`/`IndexedDB`:
  - When offline, save test session records to local queue `nawi_offline_queue`.
  - Display an **Offline Status Pill** in `TopBar` ("Offline - [N] sessions pending sync").
  - On network reconnection (`online` event), automatically flush pending queue items to `POST /api/tests/:sessionId/results` and show a success sync notification.

### 4. Serial Telemetry & Field Simulator UI (`SerialTelemetryToolbar.jsx`)
- Add a floating/embedded Serial Telemetry Control Bar in `TestDataEntryPage.jsx`:
  - Protocol selector (Mettler Toledo SICS, Avery Weigh-Tronix, Essae).
  - Virtual COM port toggle / baud rate selector (9600, 19200, 115200) with Live Streaming mode.
  - Large digital LED/LCD-style weight readout with live fluctuation simulation.
  - Zero-Tracking indicator and Stability Lock badge (`[STABLE]`).
  - Single-click "Capture into Row" buttons on each row of the test table that auto-populate the active input from the live stream.

### 5. High-Throughput Batch CSV Import/Export UI
- Add a **Batch CSV Import** button and modal in `TestDataEntryPage.jsx`.
- Support standard 10-point weighbridge calibration templates.
- Client-side CSV parser that auto-fills test table rows, triggers instant OIML MPE calculation, and renders the updated Error Envelope Curve.
- CSV export button to download raw + calculated calibration data.
