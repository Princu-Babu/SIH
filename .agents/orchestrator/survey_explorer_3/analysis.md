# Metrological Engine & Test Infrastructure Survey Report
**NAWI-ReportPro — OIML R-76 Legal Metrology Verification System**  
**Explorer 3 Survey & Architectural Gap Analysis**  
**Date**: 2026-08-30  

---

## 1. Executive Summary

NAWI-ReportPro is an enterprise-grade digital verification and test report generation system for Non-Automatic Weighing Instruments (NAWI), engineered to align with **OIML Recommendation R-76 (Edition 2006/E)** and the **Legal Metrology Act, 2009 & General Rules, 2011 (Department of Legal Metrology, Ministry of Consumer Affairs, Government of India)**.

A thorough technical inspection of the codebase across `d:\sih` (`server/`, `client/`, database schema, and test infrastructure) reveals a functional and well-structured baseline:
1. **Core Metrological Calculations**: Both server (`server/src/services/mpeCalculator.js`) and client (`client/src/utils/metrology.js`) implement core OIML R-76 Table 3 MPE calculations for all four accuracy classes (**Class I, Class II, Class III, Class IIII**), turning point interpolation ($P = I + 0.5e - \Delta L$), zero error correction ($E_c = E - E_0$), and dispatch logic for 6 required test types:
   - Weighing Performance (Accuracy & Linearity)
   - Repeatability
   - Eccentricity (Off-Center Loading)
   - Temperature Effects
   - Stability & Warm-up
   - Time-Dependence (Creep & Zero Return)
2. **Multi-Page Official PDF Reporting**: Multi-page PDF Technical Data Sheet (`server/src/services/pdfDataSheet.js`) and official single-page Test Certificate (`server/src/services/pdfCertificate.js`) with dynamic QR codes, tricolor national banners, and tabular breakdown of all 6 test results.
3. **Critical Metrological Gaps (Requirement R1 & SIH Victory Criteria)**:
   - **Multi-Interval & Multi-Range Weighing Instruments**: The database schema, UI forms, and calculation engine only support a single verification scale interval $e$ and single $Max$. Multi-interval instruments with tiered $e_1, e_2, e_3$ and switching thresholds $Max_1, Max_2, Max_3$ are currently unsupported.
   - **Subtractive vs. Additive Tare Effect on MPE**: Calculations do not account for subtractive tare ($Max_{net} = Max - T$) vs additive tare ($Max_{gross} = Max + T$) when determining MPE step tiers.
   - **Measurement Uncertainty & Expanded Uncertainty Budget ($U = k \cdot u_c, k=2$)**: Completely missing from both backend and frontend. GUM / EURAMET cg-18 compliant uncertainty budget (repeatability, digital resolution, standard weights, eccentricity, temperature drift) must be computed and rendered.
   - **Boundary Load Testing at Exact MPE Step Points**: The UI hardcodes load percentages ($0\%, 20\%, 40\%, 60\%, 80\%, 100\%$ of $Max$), which fails to hit the exact OIML R-76 step points ($500e, 2000e, 10000e$ for Class III; $50000e, 200000e$ for Class I).
   - **Hysteresis Evaluation**: Although displayed in the PDF, $Hys(L) = |P_{dec}(L) - P_{inc}(L)| \le |MPE|$ is not explicitly verified in `calculateWeighingPerformance`.
4. **Test Infrastructure Deficit**:
   - **Zero automated test suites exist** (0 test files in `client` or `server`).
   - No test runners (Vitest / Jest / Supertest) are configured in `package.json`.
   - No root scripts for `npm test`, `npm run lint`, or workspace-wide builds exist.

---

## 2. Metrological Calculation Engines Audit (OIML R-76)

### 2.1 File Locations & Responsibilities
- **Server Engine**: `server/src/services/mpeCalculator.js` (685 lines)
  - Exports: `MPE_TABLE`, `getMPE`, `calculateIndicationAndError`, `calculateWeighingPerformance`, `calculateRepeatability`, `calculateEccentricity`, `calculateTemperatureEffect`, `calculateStability`, `calculateTimeDependence`, `evaluateTestResult`.
- **Frontend Utility**: `client/src/utils/metrology.js` (106 lines)
  - Exports: `ACCURACY_CLASSES`, `calculateMpe`, `calculateContinuousIndication`, `calculateCorrectedError`, `roundTo`, `formatNumber`.
- **Database Schema**: `server/prisma/schema.prisma`
  - Models: `AccuracyClass` (`CLASS_I`, `CLASS_II`, `CLASS_III`, `CLASS_IIII`), `Instrument` (`verificationInterval`, `actualInterval`, `maxCapacity`, `minCapacity`), `TestSession`, `TestResult`.
- **PDF Generation**: `server/src/services/pdfDataSheet.js` & `server/src/services/pdfCertificate.js`.

---

### 2.2 Accuracy Classes & OIML R-76 Table 3 MPE Limits

OIML R-76 Table 3 defines Maximum Permissible Errors on initial verification as follows:

| Accuracy Class | Tier 1: $\pm 0.5e$ | Tier 2: $\pm 1.0e$ | Tier 3: $\pm 1.5e$ | Max Verification Intervals $n$ |
| :--- | :--- | :--- | :--- | :--- |
| **Class I (Special)** | $0 \le m \le 50\,000e$ | $50\,000e < m \le 200\,000e$ | $m > 200\,000e$ | $n \ge 50\,000$ |
| **Class II (High)** | $0 \le m \le 5\,000e$ | $5\,000e < m \le 20\,000e$ | $20\,000e < m \le 100\,000e$ | $100 \le n \le 100\,000$ |
| **Class III (Medium)** | $0 \le m \le 500e$ | $500e < m \le 2\,000e$ | $2\,000e < m \le 10\,000e$ | $100 \le n \le 10\,000$ |
| **Class IIII (Ordinary)**| $0 \le m \le 50e$ | $50e < m \le 200e$ | $200e < m \le 1\,000e$ | $100 \le n \le 1\,000$ |

#### In-Service Verification Multiplier
- Per OIML R-76-1 clause 3.5.2, MPE for in-service verification is **$2 \times$** initial verification MPE ($\pm 1.0e, \pm 2.0e, \pm 3.0e$).
- In `mpeCalculator.js` (line 53) and `metrology.js` (line 58), the $2\times$ factor is correctly applied when `isInService === true`.

#### Boundary Condition Audit
In `server/src/services/mpeCalculator.js`:
```javascript
const MPE_TABLE = {
  CLASS_I: [
    { minLoad: 0, maxLoad: 50000, mpeInitial: 0.5 },
    { minLoad: 50000, maxLoad: 200000, mpeInitial: 1.0 },
    { minLoad: 200000, maxLoad: Infinity, mpeInitial: 1.5 },
  ],
  CLASS_II: [
    { minLoad: 0, maxLoad: 5000, mpeInitial: 0.5 },
    { minLoad: 5000, maxLoad: 20000, mpeInitial: 1.0 },
    { minLoad: 20000, maxLoad: 100000, mpeInitial: 1.5 },
  ],
  CLASS_III: [
    { minLoad: 0, maxLoad: 500, mpeInitial: 0.5 },
    { minLoad: 500, maxLoad: 2000, mpeInitial: 1.0 },
    { minLoad: 2000, maxLoad: 10000, mpeInitial: 1.5 },
  ],
  CLASS_IIII: [
    { minLoad: 0, maxLoad: 50, mpeInitial: 0.5 },
    { minLoad: 50, maxLoad: 200, mpeInitial: 1.0 },
    { minLoad: 200, maxLoad: 1000, mpeInitial: 1.5 },
  ],
};
```
- **Finding**: At exact step boundary $500e$ for Class III, `tier.minLoad <= absLoad && absLoad <= tier.maxLoad` hits Tier 1 first, yielding $0.5e$ (Compliant with OIML R-76: $m \le 500e \implies \pm 0.5e$).
- At $500.01e$, Tier 1 fails and Tier 2 matches, yielding $1.0e$ (Compliant).
- At $2000e$, Tier 2 matches, yielding $1.0e$ (Compliant).
- At $2000.01e$, Tier 3 matches, yielding $1.5e$ (Compliant).
- **Edge Case Gap**: In `client/src/utils/metrology.js`, `zone1` and `zone2` are checked via `if (m <= limits.zone1) factor = 0.5; else if (m <= limits.zone2) factor = 1.0; else factor = 1.5;`. For loads exceeding the maximum permissible $n$ for Class IIII ($> 1000e$), `factor = 1.5` is returned, but there is no warning or invalidation that the instrument specification exceeds the class limit.

---

### 2.3 Continuous Indication & Turning Points (OIML R-76 §A.4.4.3)

#### Formula & Methodology
For digital indicating instruments with scale interval $d$, turning points using small fractional weights $\Delta L$ (typically $0.1e$) determine the continuous indication $P$:
$$P = I + \frac{1}{2}e - \Delta L$$
The error of indication $E$ is:
$$E = P - L = I + \frac{1}{2}e - \Delta L - L$$
The corrected error $E_c$ eliminates the initial zero load error $E_0$:
$$E_c = E - E_0$$

#### Implementation Audit
In `server/src/services/mpeCalculator.js` lines 57–73 & 98–120:
- When $\Delta L$ is supplied, $P$ is calculated as $I + 0.5e - \Delta L$.
- When $\Delta L$ is absent/omitted, $P = I$ and $E = I - L$.
- In `calculateWeighingPerformance`, $E_0$ is dynamically extracted from the test point where `appliedLoad === 0 && isIncreasing !== false`.
- If no zero point is provided in the array, `zeroError` defaults to $0$.

---

### 2.4 Test Verification Modules Detailed Audit

| Test Module | Standard Ref | Current Calculation Logic | Verification Verdict | Identified Gaps |
| :--- | :--- | :--- | :--- | :--- |
| **1. Weighing Performance** | OIML R-76 §3.5, §A.4.4 | Computes $P, E, E_c$ for increasing and decreasing points. Checks $|E_c| \le MPE$. | **Working** | Hysteresis $Hys = \|P_{dec} - P_{inc}\|$ is not explicitly verified against $MPE$. Missing automated step-point generation. |
| **2. Repeatability** | OIML R-76 §3.6.1, §A.4.10 | Computes range $R = Max(I) - Min(I)$ across repeated readings. Checks $R \le MPE(L)$. | **Working** | Does not compute sample standard deviation $s_r = \sqrt{\frac{\sum (x_i - \bar{x})^2}{n-1}}$, does not check minimum repetition count $n \ge 6$ or $n \ge 3$. |
| **3. Eccentricity** | OIML R-76 §3.6.2, §A.4.7 | Tests off-center positions at $1/3 Max$. Checks $\|E\| \le MPE$ and $\|P_{pos} - P_{center}\| \le MPE$. | **Working** | Does not support multi-support weighbridge loading rules ($1/(n-1) Max$ or $0.8 Max$ rolling axle loads). |
| **4. Temperature Effects** | OIML R-76 §3.9.2, §A.5.3 | Checks span error $\le MPE$ and zero drift per $5^\circ\text{C}$: $\frac{\|\Delta E_0\|}{\Delta T} \times 5 \le 1.0e$. | **Working** | Class I zero drift threshold should be $0.5e / 1^\circ\text{C}$. |
| **5. Stability & Warm-up** | OIML R-76 §3.9.4, §A.5.2 | Checks span drift $\le MPE$ and zero drift $\le 1.0e$ over time duration. | **Working** | Fully functional. |
| **6. Time Dependence (Creep & Zero Return)** | OIML R-76 §3.9.4.3, §3.9.4.4 | Checks $\Delta(30\text{m}-0\text{m}) \le 0.5 MPE$, $\Delta(30\text{m}-15\text{m}) \le 0.2 MPE$, zero return after 30m unload $\le 0.5e$. | **Working** | Fully compliant. |

---

## 3. Analysis of R1 Specific Metrological Requirements & Gaps

### 3.1 Multi-Interval & Multiple-Range Instruments

#### OIML R-76 Specifications (Clause 3.2, 3.3, 3.4)
- **Multi-Interval Instrument**: A weighing instrument having one weighing range divided into partial weighing ranges:
  - Range 1: from $Min_1$ to $Max_1$, verification scale interval $e_1$ ($n_1 = Max_1 / e_1$)
  - Range 2: from $Max_1$ to $Max_2$, verification scale interval $e_2$ ($e_2 > e_1$, $n_2 = Max_2 / e_2$)
  - Range 3: from $Max_2$ to $Max_3$, verification scale interval $e_3$ ($e_3 > e_2$)
  - **Dynamic Transition Rule**: On increasing load, the scale interval switches automatically from $e_1$ to $e_2$ when the load exceeds $Max_1$. On decreasing load, the scale interval remains $e_2$ until the load drops below $Max_1$ (or zero, depending on indicator behavior).
  - **MPE Envelope**: The MPE tier limits ($500e_i, 2000e_i, 10000e_i$) and permissible error in mass units ($MPE_{mass} = MPE(m_i) \cdot e_i$) apply strictly to the partial range active for that load.
- **Multiple-Range Instrument**: Has distinct, separate weighing ranges (manually or automatically selected), each with independent $Min_i, Max_i, e_i, d_i$.

#### Current Codebase Limitations
- `Instrument` model in `schema.prisma` only has scalar fields: `verificationInterval Float`, `actualInterval Float`, `maxCapacity Float`, `minCapacity Float`.
- `mpeCalculator.js` accepts only a single `instrument.verificationInterval`.
- `InstrumentFormPage.jsx` has no fields for multi-interval configuration ($e_1, e_2, Max_1, Max_2$).

#### Proposed Architectural Solution
1. Add optional multi-interval configuration in `Instrument` model (stored in JSON or structured fields):
   ```json
   {
     "isMultiInterval": true,
     "intervals": [
       { "range": 1, "maxCapacity": 60, "minCapacity": 0.4, "verificationInterval": 0.02, "actualInterval": 0.02 },
       { "range": 2, "maxCapacity": 150, "minCapacity": 0.4, "verificationInterval": 0.05, "actualInterval": 0.05 }
     ]
   }
   ```
2. Enhance `getMPE` and `calculateWeighingPerformance` to dynamically determine the active interval $i$ for applied load $L$:
   $$e_i = \text{resolveInterval}(L, \text{intervals})$$
   $$m_i = L / e_i$$
   $$MPE_{mass}(L) = getMPE(\text{accuracyClass}, m_i) \cdot e_i$$

---

### 3.2 Subtractive vs Additive Tare Effect on MPE Calculations

#### OIML R-76 Specifications (Clause 3.5.3.4 & T.2.7.4)
- **Subtractive Tare (T = -T)**:
  - The maximum weighing capacity for net loads is reduced to $Max_{net} = Max - T$.
  - MPE for any net load $L_{net}$ is determined by the net load value: $m = L_{net} / e$.
- **Additive Tare (T = +T)**:
  - The device allows weighing net loads up to $Max$ even after taring, resulting in total gross loads up to $Max + T$.
  - The MPE tier limits must be calculated using the gross load or the extended additive range limits.

#### Current Codebase Limitations
- `InstrumentFormPage.jsx` has a form field `tareType: 'SUBTRACTIVE'`, but it is **not saved to Prisma** (not in `schema.prisma`).
- `mpeCalculator.js` has no tare calculation logic.

#### Proposed Architectural Solution
1. Add `tareType` (`SUBTRACTIVE` | `ADDITIVE`) and `maxTare` to `schema.prisma` and test payload.
2. In `mpeCalculator.js`, implement tare-compensated MPE evaluation:
   ```javascript
   function getMpeWithTare(load, tare, tareType, accuracyClass, e, isInService) {
     const effectiveLoad = tareType === 'ADDITIVE' ? (Number(load) + Number(tare || 0)) : Number(load);
     const loadInE = effectiveLoad / e;
     const mpeInE = getMPE(accuracyClass, loadInE, isInService);
     return mpeInE * e;
   }
   ```

---

### 3.3 Measurement Uncertainty & Expanded Uncertainty Budget ($U = k \cdot u_c, k=2$)

#### Metrological Standard: EURAMET cg-18 & GUM (JCGM 100:2008)
The uncertainty of calibration/verification for a weighing instrument comprises:

1. **Type A Uncertainty (Repeatability)**:
   $$s = \sqrt{\frac{1}{n-1} \sum_{i=1}^n (I_i - \bar{I})^2}$$
   $$u(rep) = \frac{s}{\sqrt{n}} \quad \text{(for mean)} \quad \text{or} \quad u(rep) = s \quad \text{(for single measurement)}$$

2. **Type B Uncertainty Components**:
   - **Resolution at Zero ($u_{res0}$)**:
     $$u(res_0) = \frac{d_0}{2\sqrt{3}}$$
   - **Resolution at Load ($u_{resL}$)**:
     $$u(res_L) = \frac{d_L}{2\sqrt{3}}$$
   - **Reference Standard Calibration Weights ($u_{std}$)**:
     $$u(std) = \frac{U_{cert}}{k_{cert}} = \frac{U_{cert}}{2}$$
   - **Eccentricity Contribution ($u_{ecc}$)**:
     $$u(ecc) = \frac{|\Delta I_{ecc, max}|}{2 \cdot L_{ecc} \cdot \sqrt{3}} \cdot L$$
   - **Temperature Drift Contribution ($u_{temp}$)**:
     $$u(temp) = \frac{\Delta T \cdot TC_{span} \cdot L}{\sqrt{3}}$$

3. **Combined Standard Uncertainty ($u_c$)**:
   $$u_c(L) = \sqrt{u(rep)^2 + u(res_0)^2 + u(res_L)^2 + u(std)^2 + u(ecc)^2 + u(temp)^2}$$

4. **Expanded Uncertainty ($U$) with $k=2$ (95.45% Confidence)**:
   $$U(L) = k \cdot u_c(L) = 2 \cdot u_c(L)$$

5. **Guard Band Compliance Rule**:
   $$|E_c(L)| + U(L) \le MPE(L)$$

#### Current Codebase Limitations
- Completely absent in `mpeCalculator.js`, `metrology.js`, `pdfDataSheet.js`, and database schema.

#### Proposed Architectural Solution
- Create a dedicated mathematical module `server/src/services/uncertaintyCalculator.js` (and frontend counterpart `client/src/utils/uncertainty.js`) exporting:
  - `computeUncertaintyBudget(instrument, testData, appliedLoad)`
  - Output: detailed breakdown table ($u_{rep}, u_{res0}, u_{resL}, u_{std}, u_{ecc}, u_{temp}, u_c, U$, effective degrees of freedom $\nu_{eff}$).
  - Integrate into `pdfDataSheet.js` Page 3/4 and Technical Data Sheet UI.

---

### 3.4 Boundary Load Testing at Exact MPE Step Points

#### OIML R-76 Requirements
Standard test points must include:
1. $Min$ capacity ($20e$ for Class III, $100e$ for Class II, $100e$ for Class I, $10e$ for Class IIII).
2. Step point 1: Exact $500e$ ($5000e$ Class II, $50000e$ Class I).
3. Step point 1 boundary: $500e + d$ (or $501e$).
4. Step point 2: Exact $2000e$ ($20000e$ Class II, $200000e$ Class I).
5. Step point 2 boundary: $2000e + d$ (or $2001e$).
6. Maximum capacity: $Max$.
7. Intermediate points: $50\% Max$, $80\% Max$.

#### Current Codebase Limitations
- In `client/src/pages/tests/TestDataEntryPage.jsx` lines 129–136, test points are hardcoded to:
  `[0%, 20%, 40%, 60%, 80%, 100%]` of $Max$.
- For a $150\text{kg}$ Class III scale with $e = 0.05\text{kg}$ ($n = 3000$):
  - $500e = 25\text{kg}$ ($16.67\%$)
  - $2000e = 100\text{kg}$ ($66.67\%$)
  - The default $20\%, 40\%, 60\%, 80\%, 100\%$ ($30\text{kg}, 60\text{kg}, 90\text{kg}, 120\text{kg}, 150\text{kg}$) **completely bypasses the exact $25\text{kg}$ and $100\text{kg}$ step points!**

#### Proposed Architectural Solution
- Implement `generateStandardOimlLoadPoints(instrument)` utility to dynamically calculate exact $Min$, step boundaries ($500e, 500e+d, 2000e, 2000e+d$), $50\% Max$, and $Max$.

---

## 4. Test Infrastructure & Automation Survey

### 4.1 Root, Client, and Server Configuration Audit

| Level | `package.json` Location | Existing Scripts | Missing Required Scripts | Test Framework Installed |
| :--- | :--- | :--- | :--- | :--- |
| **Root** | `d:\sih\package.json` | `setup`, `dev`, `start` | `test`, `test:unit`, `test:coverage`, `build`, `lint` | None |
| **Server** | `d:\sih\server\package.json` | `dev`, `start`, `seed` | `test`, `test:unit`, `test:integration`, `test:coverage`, `lint` | None |
| **Client** | `d:\sih\client\package.json` | `dev`, `build`, `preview` | `test`, `test:unit`, `test:coverage`, `lint` | None |

### 4.2 Build & Lint Verification
- `npm run build --workspace=client` was executed:
  - Result: **SUCCESS** (Vite built `dist/` in 11.47s without errors).
- Server code syntax check (`node -c`):
  - Result: **SUCCESS** (All server files valid JavaScript syntax).
- Linting:
  - **No ESLint or Prettier** configuration exists anywhere in the repository.

---

## 5. Comprehensive Test Suite Architecture (Tiers 1–4)

To guarantee technical supremacy and 100% test success across all calculation modules, the test suite is structured across 4 distinct tiers:

```
tests/
├── tier1_unit_metrology/         # Pure Metrological Engine & Math Units
│   ├── mpe_table_classes.test.js
│   ├── continuous_indication.test.js
│   ├── multi_interval.test.js
│   ├── tare_effects.test.js
│   ├── uncertainty_budget.test.js
│   └── boundary_step_points.test.js
├── tier2_integration_modules/    # 6 OIML R-76 Test Type Verification Suites
│   ├── weighing_performance.test.js
│   ├── repeatability.test.js
│   ├── eccentricity.test.js
│   ├── temperature_effects.test.js
│   ├── stability_warmup.test.js
│   └── time_dependence_creep.test.js
├── tier3_api_system/             # Server REST API & Document Generation
│   ├── instruments_api.test.js
│   ├── test_sessions_api.test.js
│   ├── results_recalculation.test.js
│   ├── session_finalization.test.js
│   ├── pdf_certificate.test.js
│   ├── pdf_datasheet.test.js
│   └── public_verification_route.test.js
└── tier4_e2e_resilience/         # Advanced Telemetry, Offline Queue, CSV
    ├── rs232_telemetry.test.js
    ├── weighbridge_csv_batch.test.js
    └── offline_sync_resilience.test.js
```

### 5.1 Tier-by-Tier Specification Table

| Tier | Target Scope | Key Test Cases & Invariants | Execution Framework |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Pure Metrology Units | - Exact Table 3 MPE thresholds for Class I ($50k, 200k$), Class II ($5k, 20k$), Class III ($500, 2000$), Class IIII ($50, 200$).<br>- In-service verification $2\times$ multiplier.<br>- Continuous indication $P = I + 0.5e - \Delta L$ with float micro-epsilon tolerance.<br>- Multi-interval tiered $e_1, e_2, e_3$ envelope resolution.<br>- Subtractive vs additive tare MPE adjustments.<br>- GUM/EURAMET expanded uncertainty $U = 2 \cdot u_c$ calculation budget. | Vitest / Jest |
| **Tier 2** | Test Type Module Calculators | - Weighing Performance: increasing/decreasing hysteresis $|P_{dec} - P_{inc}| \le MPE$, zero error compensation.<br>- Repeatability: 6 repetitions at $50\% Max$ and $100\% Max$, range $P_{max} - P_{min} \le MPE$, standard deviation $s_r$.<br>- Eccentricity: 5 positions at $1/3 Max$, $|E| \le MPE$, center reference delta.<br>- Temperature: zero drift per $5^\circ\text{C} \le 1.0e$, span error $\le MPE$.<br>- Stability: 8-hour continuous drift evaluation.<br>- Time Dependence: 30m creep $\le 0.5 MPE$, 15-30m delta $\le 0.2 MPE$, zero return $\le 0.5e$. | Vitest / Jest |
| **Tier 3** | API, Security & PDF Reports | - Instrument CRUD validation ($e, d, Max, Min$, uniqueness of serialNumber).<br>- Session creation and state transitions (`PENDING` -> `IN_PROGRESS` -> `COMPLETED` / `FAILED`).<br>- Server-side recalculation of client test data (anti-tamper verification).<br>- Strict finalization guard: rejects if any of 6 required tests is missing.<br>- PDF generation of Certificate and Data Sheet (buffer integrity, page counts, QR payload).<br>- Public verification endpoint `/api/reports/verify/:certificateNo` unauthenticated access. | Vitest + Supertest |
| **Tier 4** | Telemetry & Edge Resilience | - RS-232 serial stream parser: continuous ASCII framing, zero-tracking, stable weight indicator lock.<br>- Weighbridge batch CSV import: 10-point series calculation and automated error curve generation.<br>- Offline IndexedDB / LocalStorage queue caching and auto-commit sync on reconnect. | Vitest / Playwright |

---

## 6. Recommended Action Items for Next Stages

1. **Install Vitest and Supertest Infrastructure**:
   - Add Vitest, `@vitest/coverage-v8`, and `supertest` to root and workspace packages.
   - Configure root scripts: `npm test`, `npm run test:unit`, `npm run test:coverage`, `npm run build`, `npm run lint`.
2. **Implement Multi-Interval & Multiple-Range Module**:
   - Update `mpeCalculator.js` to support tiered $e_i$ and split MPE envelopes across capacity ranges.
3. **Implement Uncertainty Calculation Engine**:
   - Create `uncertaintyCalculator.js` implementing the GUM / EURAMET cg-18 uncertainty budget ($U = 2 \cdot u_c$).
4. **Implement Subtractive / Additive Tare Logic**:
   - Incorporate net vs gross load MPE determination based on tare mode.
5. **Implement Standard Step-Point Generator**:
   - Auto-calculate exact boundary test points ($500e, 2000e$, etc.) in `TestDataEntryPage.jsx`.
6. **Implement Full Test Suite (Tiers 1–4)**:
   - Author comprehensive automated tests across all 4 tiers to achieve 100% pass rate.
