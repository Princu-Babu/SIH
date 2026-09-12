# Original User Request

## Initial Request — 2026-08-30T11:45:56Z

Conduct a comprehensive competitive gap analysis, architectural stress audit, and feature enhancement cycle on **NAWI-ReportPro** to ensure undisputed technical superiority and victory in the **Smart India Hackathon (SIH 2026) — Problem Statement ID 26035 (Ministry of Consumer Affairs, Food & Public Distribution)**.

Working directory: d:\sih
Integrity mode: benchmark

Reference: OIML Recommendation R-76 (Edition 2006/E) — Parts 1, 2 & 3. Department of Legal Metrology (Legal Metrology Act, 2009 & Legal Metrology General Rules, 2011).

## Requirements

### R1. Metrological & OIML R-76 Edge-Case Hardening
Conduct an exhaustive audit of metrological calculations against R-76 requirements:
- Multi-interval and multiple-range weighing instruments (e1, e2, e3 with switching thresholds).
- Subtractive vs additive tare effect on MPE calculations.
- Measurement Uncertainty & Expanded Uncertainty (U = k * u_c, k=2) computation engine.
- Boundary load testing at exact MPE step points (500e, 2000e, 10000e).

### R2. Live RS-232 / USB Serial Telemetry & Field Inspection Simulator
Implement a mock/live hardware serial communication module:
- Simulates real-time continuous ASCII/Hex data streaming from digital weighing indicators (e.g. Mettler Toledo SICS, Avery Weigh-Tronix, Essae protocols).
- Live zero-tracking, stable weight indicator lock, and single-click automated reading capture into the active test table.
- Batch CSV/Excel data import and export for high-throughput truck weighbridges.

### R3. Interactive Error Envelope Curves & Public Verification Portal
Provide judge-grade visual analytics and transparency tools:
- Dynamic Canvas/SVG error curve visualization graphing indicated error E_c against the upper/lower OIML R-76 MPE tolerance boundaries.
- Dedicated Public Verification portal route (`/verify/:certificateNo`) enabling market consumers or traders to scan a QR code and instantly inspect authentic calibration certificates and legal seals.

### R4. Offline PWA / Local Storage Resilient Queue
Field inspection officers frequently operate in remote agricultural mandis and rural warehouse yards with intermittent connectivity:
- Ensure offline-first data caching in browser IndexedDB/LocalStorage.
- Background synchronization queue that auto-commits pending test runs once connection to the PostgreSQL backend is re-established.

## Acceptance Criteria

### Metrological Precision
- [ ] Multi-interval scale definitions correctly apply tiered e_i and split MPE envelopes across capacity ranges.
- [ ] Expanded uncertainty budget (k=2, 95% confidence) computed and rendered on the Technical Datasheet.
- [ ] Error envelope curve correctly plots applied load (X-axis) vs indicated error (Y-axis) with visible ±MPE limits.

### Field Capabilities & Telemetry
- [ ] Virtual RS-232 serial telemetry toggle streams live weight readings directly into measurement inputs.
- [ ] Batch CSV import populates full 10-point weighbridge calibration series with automated error calculations.
- [ ] Public verification route `/verify/:certificateNo` renders an official tamper-evident verification card without requiring officer login.

### Resilience & Code Quality
- [ ] Offline test entries persist across network disconnection and sync to PostgreSQL on reconnect.
- [ ] Full automated test suite passes with 100% test success across all calculation modules.
- [ ] Zero build or lint errors on client and server.

## Follow-up — 2026-09-12T12:51:33Z

Full-stack modernization, security hardening, and UI/UX remediation of NAWI-ReportPro, transforming an OIML R-76 metrological verification prototype into an enterprise-grade, GIGW 3.0 compliant Government of India portal for the Smart India Hackathon 2026.

Working directory: c:\Users\RUPESH ANAND\Downloads\SIH
Integrity mode: development

## Reference Documentation
- Master Implementation Plan: c:\Users\RUPESH ANAND\Downloads\SIH\AUDIT_PROGRESS_LOG.md
- SIH Problem Statement ID: 26035 (Ministry of Consumer Affairs, Food & Public Distribution)

## Requirements

### R1. Backend Security Hardening & Zero-Trust API Enforcement
- Protect all batch import/export (/api/batch/*), telemetry device control (/api/telemetry/*), and sync (/api/sync/batch) endpoints with JWT authentication and Role-Based Access Control (ADMIN, INSPECTOR).
- Remove all hardcoded cryptographic secrets and fallback strings from auth middleware, auth routes, and crypto seal services; require environment variables on startup.
- Add verificationSeal and sealedAt fields to the TestSession model in Prisma; compute the HMAC digital seal at finalization time, persist it to the database, and verify incoming certificates against this stored seal using timing-safe comparison.
- Implement session ownership verification (IDOR protection) to prevent inspectors from modifying or finalizing sessions belonging to other officers.
- Fix certificate number generation race conditions by implementing unique atomic sequencing.
- Protect CSV exports against spreadsheet formula injection (sanitize =, +, -, @).
- Add rate limiting to authentication routes and public verification endpoints.

### R2. Genuine Digital Verification & Evidentiary Integrity
- Replace the fake pseudo-random LCG QR code generator in ReportPage.jsx with authentic, scannable QR matrices pointing to the public verification URL.
- Decouple the public verification route (/verify/:certificateNo) from authenticated Axios instances so public QR scans do not redirect to the login page.
- Enforce an immutable read-only lock in TestDataEntryPage.jsx for test sessions in COMPLETED status.
- Ensure all test data inputs start blank rather than pre-populating synthetic passing values.
- Persist administrative settings in SettingsPage.jsx to local storage with reset-to-defaults functionality.

### R3. GIGW 3.0 Government Visual Identity & UI/UX Modernization
- Replace custom/stylized emblems with the official State Emblem of India (Ashoka Lion Capital with "सत्यमेव जयते") and official Ministry bilingual hierarchy banner.
- Add a GIGW 3.0 top accessibility toolbar featuring font size adjustment (A- | A | A+), high-contrast toggle, and instant bilingual toggle (English / हिन्दी).
- Add a standardized Government of India portal footer containing NIC/SIH credits, visitor counter, last-updated timestamp, and statutory links (RTI, CPGRAMS, Terms).
- Fix broken interactive elements: wire the notification bell in TopBar.jsx, fix Reports Hub PDF download actions, and eliminate double-breadcrumb rendering.
- Correct tooltip positioning in ErrorEnvelopeChart.jsx to prevent overflow clipping on mobile and tablet screens.
- Standardize the color palette to official government tones (Ashoka Navy #1e3a5f, Saffron #FF9933, India Green #138808, clean slate surfaces) and eliminate vibecoded pill styles, neon glows, and placeholder names.

### R4. Monorepo Scripts, Credentials & PWA Reliability
- Synchronize database seed passwords in server/prisma/seed.js to match the documented README.md credentials (Admin@123, Inspector@123, Viewer@123).
- Fix root package.json scripts to support standard npm start and npm run build.
- Add "prisma:generate" and "prisma:migrate" scripts to server/package.json.
- Fix production service worker (sw.js) precaching by removing development paths (/src/main.jsx, /src/index.css) that cause 404 failures in production.
- Wrap the client application in a global React ErrorBoundary component with official portal styling.
- Clean up the repository by archiving duplicate presentation decks and removing temporary test capture scripts.

## Acceptance Criteria

### Automated Verification
- [ ] npm test executes and passes all test suites across metrology, security, and verification domains.
- [ ] npm run build --workspace=client builds successfully with zero JSX/Vite compile errors.
- [ ] Unauthenticated requests to POST /api/batch/import-csv and POST /api/telemetry/zero return HTTP 401 Unauthorized.
- [ ] Unauthenticated requests to POST /api/sync/batch return HTTP 401 Unauthorized.
- [ ] Seed script executes cleanly with Admin@123 hashing, allowing login with the credentials documented in README.md.

### Functional & Visual Verification
- [ ] Scanning or clicking the QR code on a generated certificate opens /verify/:certificateNo in an incognito window without prompting for login.
- [ ] Public verification page accurately displays instrument details, test date, and digital seal status with clean print CSS.
- [ ] Completed test sessions display as locked and read-only in TestDataEntryPage.jsx.
- [ ] TopBar displays the official Ashoka Lion Capital emblem, GIGW accessibility controls (font resize, high contrast), and language toggle.
- [ ] No fake setTimeout save operations remain in SettingsPage.jsx.
- [ ] Root npm start and npm run build execute without script errors.

