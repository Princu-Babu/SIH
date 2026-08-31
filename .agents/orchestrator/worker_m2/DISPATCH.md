## 2026-08-30T11:50:27Z
You are Worker M2: Live RS-232 Serial Telemetry & Batch CSV Specialist for NAWI-ReportPro.
Working directory: d:\sih\.agents\orchestrator\worker_m2 (create it and write all your metadata/reports here).
Original Request file: d:\sih\ORIGINAL_REQUEST.md
Project specification: d:\sih\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive file ownership:
- `server/src/services/telemetrySimulator.js`
- `server/src/services/batchImportExport.js`
- `server/src/routes/telemetry.routes.js`
- `server/src/routes/batch.routes.js`
- `server/src/controllers/telemetry.controller.js`
- `server/src/controllers/batch.controller.js`
- `client/src/components/telemetry/SerialTelemetryToolbar.jsx`
- `client/src/components/batch/BatchCsvModal.jsx`

Your mission:
1. Build the Telemetry Streaming Simulator in `server/src/services/telemetrySimulator.js`:
   - Real-time continuous ASCII/Hex data streaming supporting major digital indicator protocols:
     * Mettler Toledo SICS (`S S <weight> <unit>`, `S D <weight> <unit>`, `Z`, `T`)
     * Avery Weigh-Tronix (`<STX><STATUS><WEIGHT><CR><LF>`)
     * Essae (`<STX><POLARITY><WEIGHT><STATUS><ETX>`)
   - Dynamic zero-tracking simulation, motion/settling noise, stability lock detection.
   - REST/SSE endpoints: `GET /api/telemetry/stream`, `POST /api/telemetry/zero`, `POST /api/telemetry/tare`, `POST /api/telemetry/set-weight`.
2. Build the Batch CSV/Excel Import/Export Engine in `server/src/services/batchImportExport.js`:
   - High-throughput CSV parsing for 10-point weighbridge calibration series with automated turning-point and MPE error calculation.
   - CSV/Excel export of complete test session series.
   - Endpoints: `POST /api/batch/import-csv`, `GET /api/batch/export-csv/:sessionId`.
3. Mount the new routes in `server/src/index.js`.
4. Build the Frontend Components:
   - `client/src/components/telemetry/SerialTelemetryToolbar.jsx`: Live indicator display with protocol switcher, stability lock indicator, zero-tracking status, Web Serial API connector with mock fallback, and single-click capture button to insert active reading into test table row.
   - `client/src/components/batch/BatchCsvModal.jsx`: Drag-and-drop CSV upload, preview table with validation highlights, and one-click import into weighbridge calibration series.
5. Verify syntax and functionality, document all protocols and endpoints in `d:\sih\.agents\orchestrator\worker_m2\handoff.md`, and notify the orchestrator.
