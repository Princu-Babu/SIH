# Handoff Report — Explorer 3: Metrological Engine & Test Infrastructure

- **Agent**: Explorer 3 (Metrological Engine & Test Infrastructure Explorer)
- **Target**: Parent Orchestrator (`24eeab26-9c9e-40da-ba51-752fe64ab8a5`)
- **Date**: 2026-08-30T17:20:00+05:30
- **Integrity Mode**: Benchmark

---

## 1. Observation

### 1.1 Metrological Engine Codebase Structure
1. **Server Calculation Service**: `server/src/services/mpeCalculator.js` (685 lines) contains:
   - `MPE_TABLE` (lines 8–29): Table 3 limits for `CLASS_I`, `CLASS_II`, `CLASS_III`, `CLASS_IIII`.
   - `getMPE(accuracyClass, loadInE, isInService)` (lines 40–54): calculates initial ($0.5e, 1.0e, 1.5e$) or in-service ($1.0e, 2.0e, 3.0e$) MPE.
   - `calculateIndicationAndError(appliedLoad, indicatedValue, verificationInterval, deltaL)` (lines 61–73): implements $P = I + 0.5e - \Delta L$ and $E = P - L$.
   - 6 Test evaluation functions: `calculateWeighingPerformance`, `calculateRepeatability`, `calculateEccentricity`, `calculateTemperatureEffect`, `calculateStability`, `calculateTimeDependence`.
2. **Frontend Utility**: `client/src/utils/metrology.js` (106 lines):
   - `ACCURACY_CLASSES` with zone boundaries ($50000, 200000$ for Class I; $5000, 20000$ for Class II; $500, 2000$ for Class III; $50, 200$ for Class IIII).
   - `calculateMpe`, `calculateContinuousIndication`, `calculateCorrectedError`.
3. **Database Schema**: `server/prisma/schema.prisma` lines 59–77:
   - `Instrument` model holds `accuracyClass`, `maxCapacity`, `minCapacity`, `verificationInterval` ($e$), `actualInterval` ($d$), `unit`.
   - Lacks fields for multi-interval configuration, tare type (`SUBTRACTIVE` vs `ADDITIVE`), and uncertainty budget.
4. **PDF Reports**:
   - `server/src/services/pdfDataSheet.js` (1340 lines): multi-page technical report with test tables, QR code, and signatures.
   - `server/src/services/pdfCertificate.js` (645 lines): single-page legal test certificate with QR code and signatures.

### 1.2 Identified Calculation Gaps Against R1 Requirements
1. **Multi-Interval / Multiple-Range**:
   - In `server/src/services/mpeCalculator.js` line 85: `const e = Number(instrument?.verificationInterval) || 0.001;` assumes a single constant $e$.
   - In `client/src/pages/tests/TestDataEntryPage.jsx` lines 44–45: accepts only single scalar `verificationScaleInterval_e`.
2. **Subtractive vs Additive Tare**:
   - `mpeCalculator.js` contains zero references or parameters for `tare` or `tareType`.
   - `InstrumentFormPage.jsx` line 35 has `tareType: 'SUBTRACTIVE'`, but this is never passed or saved in the database or calculator.
3. **Measurement Uncertainty Budget ($U = k \cdot u_c, k=2$)**:
   - Grep search for `uncertainty`, `expandedUncertainty`, or `k=2` across the repository returns 0 occurrences in calculation engines or reporting.
4. **Boundary Load Step Points**:
   - In `client/src/pages/tests/TestDataEntryPage.jsx` lines 129–136, test points are hardcoded to percentages `[0%, 20%, 40%, 60%, 80%, 100%]`, which misses exact OIML R-76 step points ($500e, 2000e, 10000e$).
5. **Hysteresis Evaluation**:
   - `server/src/services/mpeCalculator.js` evaluates points individually for $|E_c| \le MPE$, but never computes $Hys(L) = |P_{dec}(L) - P_{inc}(L)|$ or enforces $Hys(L) \le MPE(L)$.

### 1.3 Test Infrastructure Audit
1. **Package.json Scripts**:
   - Root `package.json`:
     ```json
     "scripts": {
       "setup": "npm install && cd server && npx prisma migrate dev --name init && npx prisma db seed && cd ..",
       "dev": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
       "start": "concurrently \"npm start --workspace=server\" \"npm start --workspace=client\""
     }
     ```
     No `test`, `build`, or `lint` scripts exist at root.
   - `server/package.json`: `"dev"`, `"start"`, `"seed"`. No `test` script, no test runner installed.
   - `client/package.json`: `"dev"`, `"build"`, `"preview"`. No `test` or `lint` scripts.
2. **Test Files**:
   - Searching for `*.test.js`, `*.spec.js`, or `*test*` across `d:\sih` yielded **0 test files**.
3. **Build Status**:
   - `npm run build --workspace=client` was executed: built in 11.47s (code 0).
   - `node -c` was executed across all server JS files: 0 syntax errors (code 0).

---

## 2. Logic Chain

1. **Premise 1**: OIML R-76-1:2006 Table 3 mandates tiered MPE step points ($500e, 2000e, 10000e$ for Class III), turning point continuous indications ($P = I + 0.5e - \Delta L$), hysteresis limits ($Hys \le MPE$), and multi-interval scale interval switching.
2. **Premise 2**: Direct observation of `server/src/services/mpeCalculator.js` confirms core Table 3 logic and turning points are implemented for single-interval instruments, but multi-interval instruments, tare compensation, and uncertainty calculations are absent.
3. **Premise 3**: Inspection of `client/src/pages/tests/TestDataEntryPage.jsx` shows load points generated as fixed percentages ($20\%, 40\%, 60\%, \dots$) instead of exact boundary step points ($500e, 2000e$).
4. **Premise 4**: Direct scan of `package.json` files and filesystem confirms complete absence of test runners (Vitest/Jest), test files, coverage configurations, and linting.
5. **Deduction**: To meet Requirement R1 and the acceptance criteria ("Full automated test suite passes with 100% test success across all calculation modules" and "Zero build or lint errors on client and server"), the system requires:
   - Implementation of multi-interval calculations ($e_1, e_2, e_3$), tare effect on MPE, expanded uncertainty budget ($U = 2 \cdot u_c$), hysteresis checking, and automated step-point generation.
   - Installation and orchestration of Vitest / Supertest test infrastructure with 4 distinct tiers of automated tests.

---

## 3. Caveats

1. **Database Schema Migrations**: Adding multi-interval and tare fields to `Instrument` or `TestResult` will require running Prisma migrations if SQLite / PostgreSQL is live; alternatively, JSON data fields in `TestResult.data` and `TestResult.calculations` can store multi-interval payloads without breaking backwards compatibility.
2. **Browser Telemetry Testing**: Testing physical RS-232 / USB serial hardware in automated CI requires virtual serial port mocking / Web Serial API simulation.

---

## 4. Conclusion

1. **Calculation Engines**: The existing calculation engine in `mpeCalculator.js` is structurally sound and mathematically accurate for standard single-interval instruments across Class I–IIII. However, to achieve competitive victory in SIH 2026 and fulfill Requirement R1, it must be augmented with:
   - Multi-interval resolution and tiered MPE envelope calculation.
   - Subtractive vs additive tare MPE adjustments.
   - GUM / EURAMET cg-18 compliant expanded uncertainty engine ($U = 2 \cdot u_c$).
   - Dynamic boundary step-point generator ($500e, 2000e$).
2. **Test Infrastructure**: Must be established from the ground up by installing Vitest, `@vitest/coverage-v8`, and Supertest, adding workspace scripts (`npm test`, `npm run build`, `npm run lint`), and authoring comprehensive test suites across Tiers 1–4.

---

## 5. Verification Method

To independently verify the observations in this report:

1. **Verify Absence of Test Scripts & Files**:
   - Inspect root `package.json`, `server/package.json`, and `client/package.json`.
   - Run in PowerShell:
     ```powershell
     Get-ChildItem -Path d:\sih -Recurse -Include *.test.js,*.spec.js,*.test.jsx | Measure-Object
     ```
     Expected count: `0`.
2. **Verify Metrological Engine Execution & Step Points**:
   - Run in PowerShell:
     ```powershell
     node -e "const { getMPE } = require('./server/src/services/mpeCalculator'); console.log('500e:', getMPE('CLASS_III', 500), '500.01e:', getMPE('CLASS_III', 500.01));"
     ```
     Expected output: `500e: 0.5 500.01e: 1`.
3. **Verify Client Build**:
   - Run in PowerShell:
     ```powershell
     npm run build --workspace=client
     ```
     Expected exit code: `0`.
4. **Inspect Analysis Report**:
   - Read `d:\sih\.agents\orchestrator\survey_explorer_3\analysis.md`.
