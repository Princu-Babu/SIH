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
