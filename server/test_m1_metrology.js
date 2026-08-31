/**
 * Comprehensive Verification Test Suite for Worker M1
 * Tests:
 * 1. Multi-interval ($e_1, e_2, e_3$) and multi-range scale MPE calculations
 * 2. Accuracy class step-point boundaries (Class I, II, III, IIII) and in-service 2x MPE
 * 3. Subtractive vs Additive tare adjustments on capacity and MPE tiers
 * 4. ISO GUM / EURAMET cg-18 Measurement Uncertainty Engine ($u_c$, $U=2u_c$, components, DOF)
 * 5. Boundary Load Step-Point Generator ($500e, 2000e, 10000e$)
 * 6. Hysteresis validation ($Hys \le MPE$)
 * 7. PDF Report Generation (Certificate & 5-page DataSheet with uncertainty budget)
 */

const assert = require('assert');
const {
  MPE_TABLE,
  getMPE,
  calculateTareCapacities,
  calculateMultiIntervalMPE,
  getTareAdjustedMPE,
  generateBoundaryLoadPoints,
  validateHysteresis,
  calculateIndicationAndError,
  calculateWeighingPerformance,
  calculateRepeatability,
  calculateEccentricity,
  calculateTemperatureEffect,
  calculateStability,
  calculateTimeDependence,
  evaluateTestResult,
} = require('./src/services/mpeCalculator');

const {
  computeRepeatabilityUncertainty,
  computeResolutionUncertainty,
  computeStandardWeightsUncertainty,
  computeEccentricityUncertainty,
  computeTemperatureUncertainty,
  computeExpandedUncertainty,
  computeCalibrationUncertaintyCurve,
} = require('./src/services/uncertaintyCalculator');

const { generateCertificate } = require('./src/services/pdfCertificate');
const { generateDataSheet } = require('./src/services/pdfDataSheet');

console.log('=== STARTING WORKER M1 METROLOGICAL TEST SUITE ===\n');

let passCount = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passCount++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------------
// 1. MPE STEP POINT & ACCURACY CLASS BENCHMARKS
// -------------------------------------------------------------------
console.log('Test Group 1: OIML R-76 MPE Class Tables & In-Service Doubling');

test('Class III initial verification MPE tiers (0-500e: 0.5e, 500-2000e: 1.0e, 2000-10000e: 1.5e)', () => {
  // At 0e -> 0.5e
  assert.strictEqual(getMPE('CLASS_III', 0, false), 0.5);
  // At 500e boundary -> 0.5e
  assert.strictEqual(getMPE('CLASS_III', 500, false), 0.5);
  // At 501e -> 1.0e
  assert.strictEqual(getMPE('CLASS_III', 501, false), 1.0);
  // At 2000e boundary -> 1.0e
  assert.strictEqual(getMPE('CLASS_III', 2000, false), 1.0);
  // At 2001e -> 1.5e
  assert.strictEqual(getMPE('CLASS_III', 2001, false), 1.5);
  // At 10000e -> 1.5e
  assert.strictEqual(getMPE('CLASS_III', 10000, false), 1.5);
});

test('Class III in-service MPE is exactly 2x initial verification MPE', () => {
  assert.strictEqual(getMPE('CLASS_III', 200, true), 1.0); // 0.5 * 2
  assert.strictEqual(getMPE('CLASS_III', 1000, true), 2.0); // 1.0 * 2
  assert.strictEqual(getMPE('CLASS_III', 5000, true), 3.0); // 1.5 * 2
});

test('Class I, Class II, Class IIII MPE tiers', () => {
  // Class I (0-50000e: 0.5e, 50000-200000e: 1.0e, >200000e: 1.5e)
  assert.strictEqual(getMPE('CLASS_I', 40000, false), 0.5);
  assert.strictEqual(getMPE('CLASS_I', 100000, false), 1.0);
  assert.strictEqual(getMPE('CLASS_I', 300000, false), 1.5);

  // Class II (0-5000e: 0.5e, 5000-20000e: 1.0e, 20000-100000e: 1.5e)
  assert.strictEqual(getMPE('CLASS_II', 3000, false), 0.5);
  assert.strictEqual(getMPE('CLASS_II', 15000, false), 1.0);
  assert.strictEqual(getMPE('CLASS_II', 50000, false), 1.5);

  // Class IIII (0-50e: 0.5e, 50-200e: 1.0e, 200-1000e: 1.5e)
  assert.strictEqual(getMPE('CLASS_IIII', 40, false), 0.5);
  assert.strictEqual(getMPE('CLASS_IIII', 150, false), 1.0);
  assert.strictEqual(getMPE('CLASS_IIII', 500, false), 1.5);
});

// -------------------------------------------------------------------
// 2. MULTI-INTERVAL AND MULTI-RANGE SCALES
// -------------------------------------------------------------------
console.log('\nTest Group 2: Multi-Interval Scales (e1, e2, e3 with switching thresholds)');

test('Multi-interval dual-range scale (Range 1: 0-6kg, e1=1g; Range 2: 6-15kg, e2=2g)', () => {
  const multiRanges = [
    { max: 6, e: 0.001, d: 0.001, min: 0.02 },
    { max: 15, e: 0.002, d: 0.002, min: 0.04 },
  ];

  // At Load = 0.4 kg: In Range 1 (e1 = 1g). m = 400e1 <= 500e1 -> MPE = 0.5 * 1g = 0.0005 kg
  const r1 = calculateMultiIntervalMPE(0.4, 'CLASS_III', multiRanges, false);
  assert.strictEqual(r1.currentRangeIndex, 0);
  assert.strictEqual(r1.currentE, 0.001);
  assert.strictEqual(r1.mpeInE, 0.5);
  assert.strictEqual(r1.mpe, 0.0005);

  // At Load = 1.0 kg: In Range 1 (e1 = 1g). m = 1000e1 (500e-2000e) -> MPE = 1.0 * 1g = 0.001 kg
  const r2 = calculateMultiIntervalMPE(1.0, 'CLASS_III', multiRanges, false);
  assert.strictEqual(r2.currentRangeIndex, 0);
  assert.strictEqual(r2.currentE, 0.001);
  assert.strictEqual(r2.mpeInE, 1.0);
  assert.strictEqual(r2.mpe, 0.001);

  // At Load = 5.0 kg: In Range 1 (e1 = 1g). m = 5000e1 (>2000e) -> MPE = 1.5 * 1g = 0.0015 kg
  const r3 = calculateMultiIntervalMPE(5.0, 'CLASS_III', multiRanges, false);
  assert.strictEqual(r3.currentRangeIndex, 0);
  assert.strictEqual(r3.currentE, 0.001);
  assert.strictEqual(r3.mpeInE, 1.5);
  assert.strictEqual(r3.mpe, 0.0015);

  // At Load = 7.0 kg: In Range 2 (e2 = 2g). m = 7.0 / 0.002 = 3500e2 (>2000e) -> MPE = 1.5 * 2g = 0.003 kg
  const r4 = calculateMultiIntervalMPE(7.0, 'CLASS_III', multiRanges, false);
  assert.strictEqual(r4.currentRangeIndex, 1);
  assert.strictEqual(r4.currentE, 0.002);
  assert.strictEqual(r4.mpeInE, 1.5);
  assert.strictEqual(r4.mpe, 0.003);
});

test('Multi-interval triple-range scale (Range 1: 0-3t, e1=1kg; Range 2: 3-6t, e2=2kg; Range 3: 6-15t, e3=5kg)', () => {
  const tripleRanges = [
    { max: 3000, e: 1, d: 1, min: 20 },
    { max: 6000, e: 2, d: 2, min: 40 },
    { max: 15000, e: 5, d: 5, min: 100 },
  ];

  // At 2500 kg: Range 1 (e=1kg). m = 2500e (>2000e) -> MPE = 1.5 * 1 = 1.5 kg
  const p1 = calculateMultiIntervalMPE(2500, 'CLASS_III', tripleRanges, false);
  assert.strictEqual(p1.currentRangeIndex, 0);
  assert.strictEqual(p1.currentE, 1);
  assert.strictEqual(p1.mpe, 1.5);

  // At 5000 kg: Range 2 (e=2kg). m = 5000 / 2 = 2500e (>2000e) -> MPE = 1.5 * 2 = 3.0 kg
  const p2 = calculateMultiIntervalMPE(5000, 'CLASS_III', tripleRanges, false);
  assert.strictEqual(p2.currentRangeIndex, 1);
  assert.strictEqual(p2.currentE, 2);
  assert.strictEqual(p2.mpe, 3.0);

  // At 12000 kg: Range 3 (e=5kg). m = 12000 / 5 = 2400e (>2000e) -> MPE = 1.5 * 5 = 7.5 kg
  const p3 = calculateMultiIntervalMPE(12000, 'CLASS_III', tripleRanges, false);
  assert.strictEqual(p3.currentRangeIndex, 2);
  assert.strictEqual(p3.currentE, 5);
  assert.strictEqual(p3.mpe, 7.5);
});

// -------------------------------------------------------------------
// 3. SUBTRACTIVE VS ADDITIVE TARE ADJUSTMENTS
// -------------------------------------------------------------------
console.log('\nTest Group 3: Subtractive Tare and Additive Tare Adjustments');

test('Subtractive tare shifts net capacity Max_net = Max - T and applies gross load to MPE evaluation', () => {
  const max = 150; // kg
  const tare = { value: 30, type: 'SUBTRACTIVE' };
  const cap = calculateTareCapacities(max, tare);

  assert.strictEqual(cap.maxNet, 120);
  assert.strictEqual(cap.maxGross, 150);
  assert.strictEqual(cap.isTareActive, true);

  // Multi-interval scale with tare: Net load = 4kg, Tare = 3kg -> Gross load = 7kg
  // Dual range: 0-6kg (e1=1g), 6-15kg (e2=2g)
  const multiRanges = [
    { max: 6, e: 0.001, d: 0.001 },
    { max: 15, e: 0.002, d: 0.002 },
  ];
  const tareInfo = { value: 3.0, type: 'SUBTRACTIVE' };
  const res = calculateMultiIntervalMPE(4.0, 'CLASS_III', multiRanges, false, tareInfo);

  // Gross load is 4 + 3 = 7 kg -> Operates in Range 2 (6-15kg) with e2 = 2g
  assert.strictEqual(res.grossLoad, 7.0);
  assert.strictEqual(res.netLoad, 4.0);
  assert.strictEqual(res.currentRangeIndex, 1);
  assert.strictEqual(res.currentE, 0.002);
  assert.strictEqual(res.mpe, 0.003); // 1.5 * 2g
});

test('Additive tare increases gross capacity Max_gross = Max + T without shrinking net capacity', () => {
  const max = 150;
  const tare = { value: 20, type: 'ADDITIVE' };
  const cap = calculateTareCapacities(max, tare);

  assert.strictEqual(cap.maxNet, 150);
  assert.strictEqual(cap.maxGross, 170);
  assert.strictEqual(cap.tareType, 'ADDITIVE');
});

// -------------------------------------------------------------------
// 4. ISO GUM / EURAMET CG-18 MEASUREMENT UNCERTAINTY ENGINE
// -------------------------------------------------------------------
console.log('\nTest Group 4: Measurement Uncertainty Engine (ISO GUM / EURAMET cg-18)');

test('Compute expanded uncertainty budget with all 5 standard components (k=2, 95% confidence)', () => {
  const repStdDev = 0.002; // s = 2g
  const d = 0.01;          // d = 10g
  const load = 100;        // L = 100 kg
  const accClass = 'CLASS_III';
  const options = {
    eccError: 0.005,      // 5g eccentricity deviation
    eccLoad: 50,          // at 50 kg
    tempVariation: 2.0,   // 2 deg C
    coverageFactor: 2,
    nReadings: 6,
  };

  const budget = computeExpandedUncertainty(repStdDev, d, load, accClass, options);

  // Verify components exist and are positive
  assert(budget.components.repeatability > 0, 'u_rep must be > 0');
  assert(budget.components.resolution > 0, 'u_res must be > 0');
  assert(budget.components.standardWeights > 0, 'u_std must be > 0');
  assert(budget.components.eccentricity > 0, 'u_ecc must be > 0');
  assert(budget.components.temperature > 0, 'u_temp must be > 0');

  // Verify digital resolution formula: u_res = d / (2 * sqrt(3))
  const expectedURes = d / (2 * Math.sqrt(3));
  assert(Math.abs(budget.components.resolution - expectedURes) < 1e-5, 'u_res matches d / (2*sqrt(3))');

  // Verify combined standard uncertainty: uc = sqrt(sum(ui^2))
  const expectedUc = Math.sqrt(
    Math.pow(budget.components.repeatability, 2) +
    Math.pow(budget.components.resolution, 2) +
    Math.pow(budget.components.standardWeights, 2) +
    Math.pow(budget.components.eccentricity, 2) +
    Math.pow(budget.components.temperature, 2)
  );
  assert(Math.abs(budget.standardUncertainty - expectedUc) < 1e-4, 'u_c matches root-sum-square');

  // Verify expanded uncertainty U = k * uc
  assert.strictEqual(budget.coverageFactor, 2);
  assert(Math.abs(budget.expandedUncertainty - 2 * budget.standardUncertainty) < 1e-4, 'U = 2 * u_c');
  assert(budget.effectiveDOF >= 5, 'Effective degrees of freedom calculated');
});

test('Uncertainty engine handles zero standard deviation with EURAMET cg-18 resolution lower bound', () => {
  const d = 0.001;
  const budget = computeExpandedUncertainty(0, d, 50, 'CLASS_III');
  // u_rep should not be 0; it defaults to d / (2 * sqrt(3))
  assert(budget.components.repeatability > 0);
  assert(budget.expandedUncertainty > 0);
});

// -------------------------------------------------------------------
// 5. BOUNDARY LOAD STEP-POINT GENERATOR & HYSTERESIS VALIDATION
// -------------------------------------------------------------------
console.log('\nTest Group 5: Boundary Load Step-Point Generator & Hysteresis');

test('Boundary load generator produces exact Min, 500e, 2000e, Max test points for single-range Class III', () => {
  const instrument = {
    accuracyClass: 'CLASS_III',
    maxCapacity: 150,
    verificationInterval: 0.05, // e = 0.05 kg -> 500e = 25 kg, 2000e = 100 kg, Min(20e) = 1 kg
    minCapacity: 1.0,
  };

  const points = generateBoundaryLoadPoints(instrument);
  assert(points.length >= 5, 'Should generate at least 5 boundary points');

  const stepTypes = points.map(p => p.stepType);
  assert(stepTypes.includes('ZERO'), 'Must include ZERO');
  assert(stepTypes.includes('MIN'), 'Must include MIN');
  assert(stepTypes.includes('STEP_500E'), 'Must include STEP_500E');
  assert(stepTypes.includes('STEP_2000E'), 'Must include STEP_2000E');
  assert(stepTypes.includes('MAX'), 'Must include MAX');

  const pt500 = points.find(p => p.stepType === 'STEP_500E');
  assert.strictEqual(pt500.nominalLoad, 25); // 500 * 0.05
  const pt2000 = points.find(p => p.stepType === 'STEP_2000E');
  assert.strictEqual(pt2000.nominalLoad, 100); // 2000 * 0.05
});

test('Hysteresis validation passes when |P_dec - P_inc| <= MPE and fails when exceeding MPE', () => {
  const instrument = { accuracyClass: 'CLASS_III', verificationInterval: 0.01 };
  
  // Compliant hysteresis
  const incPointsPass = [
    { appliedLoad: 50, indicatedValue: 50.002 },
  ];
  const decPointsPass = [
    { appliedLoad: 50, indicatedValue: 50.005 },
  ];
  const hysPass = validateHysteresis(incPointsPass, decPointsPass, instrument, false);
  assert.strictEqual(hysPass.overallPass, true);
  assert.strictEqual(hysPass.maxHysteresis, 0.003);

  // Non-compliant hysteresis (diff is 0.03, MPE is 0.015)
  const incPointsFail = [
    { appliedLoad: 50, indicatedValue: 50.000 },
  ];
  const decPointsFail = [
    { appliedLoad: 50, indicatedValue: 50.035 },
  ];
  const hysFail = validateHysteresis(incPointsFail, decPointsFail, instrument, false);
  assert.strictEqual(hysFail.overallPass, false);
  assert.strictEqual(hysFail.maxHysteresis, 0.035);
});

// -------------------------------------------------------------------
// 6. PDF REPORT GENERATION WITH UNCERTAINTY & MULTI-INTERVAL
// -------------------------------------------------------------------
console.log('\nTest Group 6: PDF Report Generator Services');

test('Generate official single-page PDF Certificate with multi-interval and expanded uncertainty', async () => {
  const sessionData = {
    certificateNo: 'NAWI-2026-TEST01',
    startedAt: new Date(),
    completedAt: new Date(),
    overallResult: 'PASS',
    temperature: 22.5,
    humidity: 50.0,
    conductedBy: { name: 'Inspector A. Sharma', email: 'asharma@gov.in' },
    instrument: {
      name: 'Retail Price Computing Scale',
      model: 'DIGI-DS-502',
      serialNumber: 'SN-987654',
      accuracyClass: 'CLASS_III',
      maxCapacity: 15,
      verificationInterval: 0.002,
      actualInterval: 0.002,
      unit: 'kg',
      ranges: [
        { max: 6, e: 0.001, d: 0.001 },
        { max: 15, e: 0.002, d: 0.002 },
      ],
    },
    testResults: [
      { testType: 'WEIGHING_PERFORMANCE', status: 'COMPLETED', result: 'PASS', remarks: 'Compliant' },
      { testType: 'REPEATABILITY', status: 'COMPLETED', result: 'PASS', calculations: { maxStdDev: 0.0008 } },
      { testType: 'ECCENTRICITY', status: 'COMPLETED', result: 'PASS', calculations: { maxDifferenceFromCenter: 0.001 } },
      { testType: 'TEMPERATURE', status: 'COMPLETED', result: 'PASS' },
      { testType: 'STABILITY', status: 'COMPLETED', result: 'PASS' },
      { testType: 'TIME_DEPENDENCE', status: 'COMPLETED', result: 'PASS' },
    ],
  };

  const pdfBuffer = await generateCertificate(sessionData);
  assert(Buffer.isBuffer(pdfBuffer), 'Must return valid Buffer');
  assert(pdfBuffer.length > 1000, 'PDF buffer should be non-empty');
});

test('Generate comprehensive 5-page Technical Data Sheet PDF with uncertainty budget and multi-interval breakdown', async () => {
  const sessionData = {
    certificateNo: 'NAWI-2026-DATASHEET01',
    startedAt: new Date(),
    completedAt: new Date(),
    overallResult: 'PASS',
    temperature: 23.0,
    humidity: 52.0,
    conductedBy: { name: 'Dr. Rajesh Kumar', email: 'rkumar@gov.in' },
    instrument: {
      name: 'High Precision Multi-Interval Scale',
      model: 'METTLER-PRO-3000',
      serialNumber: 'SN-MI-112233',
      accuracyClass: 'CLASS_III',
      maxCapacity: 30,
      minCapacity: 0.04,
      verificationInterval: 0.002,
      actualInterval: 0.002,
      unit: 'kg',
      ranges: [
        { max: 6, e: 0.001, d: 0.001, min: 0.02 },
        { max: 15, e: 0.002, d: 0.002, min: 0.04 },
        { max: 30, e: 0.005, d: 0.005, min: 0.10 },
      ],
    },
    testResults: [
      {
        testType: 'WEIGHING_PERFORMANCE',
        status: 'COMPLETED',
        result: 'PASS',
        data: {
          points: [
            { appliedLoad: 0, indicatedValue: 0, isIncreasing: true },
            { appliedLoad: 5, indicatedValue: 5.0002, isIncreasing: true },
            { appliedLoad: 12, indicatedValue: 12.001, isIncreasing: true },
            { appliedLoad: 25, indicatedValue: 25.002, isIncreasing: true },
            { appliedLoad: 25, indicatedValue: 25.0025, isIncreasing: false },
            { appliedLoad: 12, indicatedValue: 12.0012, isIncreasing: false },
            { appliedLoad: 5, indicatedValue: 5.0003, isIncreasing: false },
            { appliedLoad: 0, indicatedValue: 0.0001, isIncreasing: false },
          ],
        },
      },
      {
        testType: 'REPEATABILITY',
        status: 'COMPLETED',
        result: 'PASS',
        data: {
          series: [
            { load: 15, readings: [15.0001, 15.0002, 15.0001, 15.0003, 15.0002, 15.0001] },
            { load: 30, readings: [30.0002, 30.0005, 30.0003, 30.0004, 30.0002, 30.0003] },
          ],
        },
        calculations: { maxStdDev: 0.0002 },
      },
      {
        testType: 'ECCENTRICITY',
        status: 'COMPLETED',
        result: 'PASS',
        data: {
          positions: [
            { position: 'CENTER', appliedLoad: 10, indicatedValue: 10.0002 },
            { position: 'POS_FRONT_LEFT', appliedLoad: 10, indicatedValue: 10.0005 },
            { position: 'POS_FRONT_RIGHT', appliedLoad: 10, indicatedValue: 10.0003 },
            { position: 'POS_BACK_RIGHT', appliedLoad: 10, indicatedValue: 10.0004 },
            { position: 'POS_BACK_LEFT', appliedLoad: 10, indicatedValue: 10.0003 },
          ],
        },
        calculations: { maxDifferenceFromCenter: 0.0003 },
      },
      {
        testType: 'TEMPERATURE',
        status: 'COMPLETED',
        result: 'PASS',
        data: {
          temperaturePoints: [
            { temperature: 10, zeroIndication: 0, spanLoad: 30, spanIndication: 30.001 },
            { temperature: 20, zeroIndication: 0, spanLoad: 30, spanIndication: 30.000 },
            { temperature: 40, zeroIndication: 0.0002, spanLoad: 30, spanIndication: 30.002 },
          ],
        },
      },
      {
        testType: 'STABILITY',
        status: 'COMPLETED',
        result: 'PASS',
        data: {
          timePoints: [
            { timestampMinutes: 0, zeroReading: 0, loadReading: 30.000, appliedLoad: 30 },
            { timestampMinutes: 60, zeroReading: 0.0001, loadReading: 30.0002, appliedLoad: 30 },
            { timestampMinutes: 120, zeroReading: 0.0001, loadReading: 30.0003, appliedLoad: 30 },
          ],
        },
      },
      {
        testType: 'TIME_DEPENDENCE',
        status: 'COMPLETED',
        result: 'PASS',
        data: {
          testLoad: 30,
          creepReadings: [
            { minute: 0, indication: 30.000 },
            { minute: 5, indication: 30.0002 },
            { minute: 15, indication: 30.0004 },
            { minute: 30, indication: 30.0006 },
          ],
          zeroReturn: { appliedLoad: 30, indicationAfterUnload: 0.0002 },
        },
      },
    ],
  };

  const pdfBuffer = await generateDataSheet(sessionData);
  assert(Buffer.isBuffer(pdfBuffer), 'Must return valid Buffer');
  assert(pdfBuffer.length > 5000, 'DataSheet PDF buffer should be substantive multi-page document');
});

console.log(`\n=== TEST SUITE COMPLETED: ${passCount} / ${totalTests} TESTS PASSED ===\n`);
if (passCount === totalTests) {
  console.log('ALL WORKER M1 VERIFICATION TESTS PASSED PERFECTLY!\n');
}
