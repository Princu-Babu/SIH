## 2026-08-30T11:55:31Z
You are Worker M3: Interactive Error Envelope Curves & Public Verification Portal Specialist for NAWI-ReportPro.
Working directory: d:\sih\.agents\orchestrator\worker_m3 (create it and write all your metadata/reports here).
Original Request file: d:\sih\ORIGINAL_REQUEST.md
Project specification: d:\sih\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive file ownership:
- `client/src/components/charts/ErrorEnvelopeChart.jsx`
- `client/src/pages/public/PublicVerificationPage.jsx`
- `client/src/App.jsx`
- `client/src/pages/reports/ReportPage.jsx`
- `server/src/services/cryptoSeal.js`
- `server/src/controllers/reports.controller.js`
- `server/src/routes/reports.routes.js`

Your mission:
1. Build the Interactive Error Envelope Curve Component in `client/src/components/charts/ErrorEnvelopeChart.jsx`:
   - Interactive SVG/Canvas chart plotting applied load $L$ (X-axis) vs indicated error $E_c$ (Y-axis).
   - Renders upper and lower stepped OIML R-76 MPE tolerance boundaries ($\pm 0.5e, \pm 1.0e, \pm 1.5e$) conforming to Class I, II, III, IIII and multi-interval scales.
   - Plots increasing (loading) and decreasing (unloading) error series, points with pass/fail color-coding, hysteresis bands, zero-error line, interactive tooltips, and SVG/PNG export button.
2. Build the Public Verification Route & Page:
   - `client/src/pages/public/PublicVerificationPage.jsx`: Renders an official Indian Legal Metrology tamper-evident digital verification card without requiring officer login.
   - Shows instrument metadata, verification status badge (VERIFIED_LEGAL / REJECTED / EXPIRED), seal verification status, embedded `ErrorEnvelopeChart`, officer details, validity period, and PDF download button.
   - Mount public unauthenticated route `/verify/:certificateNo` and `/verify` in `client/src/App.jsx`.
3. Build Cryptographic Digital Seal Engine in `server/src/services/cryptoSeal.js`:
   - Generates and verifies HMAC-SHA256 tamper-evident digital seal signatures over canonical certificate payloads.
   - Computes pre-formatted error envelope curve points for public API consumers.
4. Enhance Backend Public Verification Route:
   - Update `server/src/controllers/reports.controller.js` and `server/src/routes/reports.routes.js` (`GET /api/reports/verify/:certificateNo`) to return full verification card data, cryptographic HMAC seal, validity status, and error curve dataset.
5. Update `client/src/pages/reports/ReportPage.jsx`:
   - Embed dynamic QR code generating scannable `/verify/:certificateNo` URLs.
   - Embed `ErrorEnvelopeChart.jsx` directly on the visual test report.
6. Verify client build and server functionality, write `d:\sih\.agents\orchestrator\worker_m3\handoff.md`, and notify the orchestrator.
