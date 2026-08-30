/**
 * Database Seed Script for NAWI-ReportPro
 * Populates realistic OIML R-76 metrological test sessions, instruments, users, and audit logs.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Generate realistic passing test data for all 6 test types
 */
async function createPassingTestResults(sessionId, instrument) {
  const isGram = instrument.unit === 'g';
  const max = instrument.maxCapacity;
  const min = instrument.minCapacity;
  const e = instrument.verificationInterval;
  const d = instrument.actualInterval;

  // 1. WEIGHING PERFORMANCE TEST (Accuracy & Linearity)
  const steps = [
    { frac: 0.0, name: 'Zero' },
    { frac: min / max, name: 'Min' },
    { frac: 0.1, name: '10% Max' },
    { frac: 0.25, name: '25% Max' },
    { frac: 0.5, name: '50% Max' },
    { frac: 0.75, name: '75% Max' },
    { frac: 1.0, name: 'Max' },
  ];

  const wpPoints = [];
  steps.forEach((step, idx) => {
    const applied = Number((step.frac * max).toFixed(4));
    let mpeVal = e * 0.5;
    if (applied > max * 0.5) mpeVal = e * 1.5;
    else if (applied > max * 0.2) mpeVal = e * 1.0;
    mpeVal = Number(mpeVal.toFixed(4));

    // Natural minor variation within MPE (fraction of d)
    const naturalNoiseInc = (idx * 0.12 * d);
    const naturalNoiseDec = (idx * 0.09 * d);

    const indInc = Number((applied + naturalNoiseInc).toFixed(4));
    const errInc = Number((indInc - applied).toFixed(4));
    const indDec = Number((applied + naturalNoiseDec).toFixed(4));
    const errDec = Number((indDec - applied).toFixed(4));
    const hyst = Number(Math.abs(indInc - indDec).toFixed(4));

    wpPoints.push({
      loadPoint: `L${idx + 1}`,
      appliedLoad: applied,
      indicatedInc: indInc,
      errorInc: errInc,
      indicatedDec: indDec,
      errorDec: errDec,
      hysteresis: hyst,
      mpe: mpeVal,
      status: 'PASS',
    });
  });

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'WEIGHING_PERFORMANCE',
      status: 'COMPLETED',
      result: 'PASS',
      data: { points: wpPoints },
      calculations: {
        maxCorrectedError: Number((0.35 * e).toFixed(4)),
        maxMpeAllowed: Number((1.5 * e).toFixed(4)),
        linearityPass: true,
        hysteresisPass: true,
        overallVerdict: 'PASS',
      },
      remarks: 'All increasing and decreasing load points verified within OIML R-76 MPE envelope.',
    },
  });

  // 2. REPEATABILITY TEST
  const halfLoad = Number((0.5 * max).toFixed(4));
  const fullLoad = Number((1.0 * max).toFixed(4));

  const rep50Readings = [
    Number((halfLoad + 0.1 * d).toFixed(4)),
    Number((halfLoad + 0.2 * d).toFixed(4)),
    Number((halfLoad + 0.1 * d).toFixed(4)),
    Number((halfLoad + 0.3 * d).toFixed(4)),
    Number((halfLoad + 0.2 * d).toFixed(4)),
    Number((halfLoad + 0.1 * d).toFixed(4)),
  ];
  const mean50 = Number((rep50Readings.reduce((a, b) => a + b, 0) / 6).toFixed(4));
  const range50 = Number((Math.max(...rep50Readings) - Math.min(...rep50Readings)).toFixed(4));

  const rep100Readings = [
    Number((fullLoad + 0.2 * d).toFixed(4)),
    Number((fullLoad + 0.4 * d).toFixed(4)),
    Number((fullLoad + 0.3 * d).toFixed(4)),
    Number((fullLoad + 0.5 * d).toFixed(4)),
    Number((fullLoad + 0.3 * d).toFixed(4)),
    Number((fullLoad + 0.4 * d).toFixed(4)),
  ];
  const mean100 = Number((rep100Readings.reduce((a, b) => a + b, 0) / 6).toFixed(4));
  const range100 = Number((Math.max(...rep100Readings) - Math.min(...rep100Readings)).toFixed(4));

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'REPEATABILITY',
      status: 'COMPLETED',
      result: 'PASS',
      data: {
        subTests: [
          {
            load: halfLoad,
            loadPercentage: '50% Max',
            readings: rep50Readings,
            mean: mean50,
            range: range50,
            mpe: Number((1.0 * e).toFixed(4)),
            status: 'PASS',
          },
          {
            load: fullLoad,
            loadPercentage: '100% Max',
            readings: rep100Readings,
            mean: mean100,
            range: range100,
            mpe: Number((1.5 * e).toFixed(4)),
            status: 'PASS',
          },
        ],
      },
      calculations: {
        maxRangeObserved: Math.max(range50, range100),
        mpeTolerance: Number((1.5 * e).toFixed(4)),
        overallVerdict: 'PASS',
      },
      remarks: 'Maximum span difference across 6 repeated loadings is within permissible MPE.',
    },
  });

  // 3. ECCENTRICITY TEST (Off-Center Loading)
  const eccLoad = Number((max / 3).toFixed(4));
  const centerReading = Number((eccLoad + 0.1 * d).toFixed(4));
  const eccPositions = [
    { position: 'Center', reading: centerReading, diffFromCenter: 0.0, mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
    { position: 'Front-Left', reading: Number((eccLoad + 0.25 * d).toFixed(4)), diffFromCenter: Number((0.15 * d).toFixed(4)), mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
    { position: 'Front-Right', reading: Number((eccLoad + 0.05 * d).toFixed(4)), diffFromCenter: Number((-0.05 * d).toFixed(4)), mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
    { position: 'Rear-Left', reading: Number((eccLoad + 0.3 * d).toFixed(4)), diffFromCenter: Number((0.2 * d).toFixed(4)), mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
    { position: 'Rear-Right', reading: Number((eccLoad + 0.15 * d).toFixed(4)), diffFromCenter: Number((0.05 * d).toFixed(4)), mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
  ];

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'ECCENTRICITY',
      status: 'COMPLETED',
      result: 'PASS',
      data: { testLoad: eccLoad, positions: eccPositions },
      calculations: {
        maxDifference: Number((0.2 * d).toFixed(4)),
        mpeLimit: Number((1.0 * e).toFixed(4)),
        overallVerdict: 'PASS',
      },
      remarks: 'Off-center loading across 4 platform quadrants conforms to OIML R 76-1 Section 3.6.2.',
    },
  });

  // 4. TEMPERATURE EFFECTS TEST
  const tempSpanLoad = Number(max.toFixed(4));
  const tempTests = [
    { temperature: 20, spanLoad: tempSpanLoad, reading: Number((tempSpanLoad + 0.1 * d).toFixed(4)), error: Number((0.1 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
    { temperature: 40, spanLoad: tempSpanLoad, reading: Number((tempSpanLoad + 0.3 * d).toFixed(4)), error: Number((0.3 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
    { temperature: 5, spanLoad: tempSpanLoad, reading: Number((tempSpanLoad - 0.2 * d).toFixed(4)), error: Number((-0.2 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
  ];

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'TEMPERATURE',
      status: 'COMPLETED',
      result: 'PASS',
      data: { tests: tempTests },
      calculations: {
        zeroDriftPer5C: Number((0.05 * e).toFixed(4)),
        maxSpanError: Number((0.3 * d).toFixed(4)),
        mpeLimit: Number((1.5 * e).toFixed(4)),
        overallVerdict: 'PASS',
      },
      remarks: 'Zero drift per 5°C <= 1e; span stability verified across operational range (5°C to 40°C).',
    },
  });

  // 5. STABILITY & WARM-UP TEST
  const stabLoad = Number(max.toFixed(4));
  const timePoints = [
    { timeHours: 0, appliedLoad: stabLoad, reading: Number((stabLoad + 0.1 * d).toFixed(4)), drift: 0.0, mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
    { timeHours: 1, appliedLoad: stabLoad, reading: Number((stabLoad + 0.15 * d).toFixed(4)), drift: Number((0.05 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
    { timeHours: 2, appliedLoad: stabLoad, reading: Number((stabLoad + 0.2 * d).toFixed(4)), drift: Number((0.1 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
    { timeHours: 4, appliedLoad: stabLoad, reading: Number((stabLoad + 0.25 * d).toFixed(4)), drift: Number((0.15 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
  ];

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'STABILITY',
      status: 'COMPLETED',
      result: 'PASS',
      data: { durationHours: 4, timePoints },
      calculations: {
        maxSpanDrift: Number((0.15 * d).toFixed(4)),
        mpeTolerance: Number((1.5 * e).toFixed(4)),
        overallVerdict: 'PASS',
      },
      remarks: 'Warm-up and static load span stability fully compliant with Section 3.9.4.',
    },
  });

  // 6. TIME DEPENDENCE (Creep & Zero Return)
  const creepLoad = Number(max.toFixed(4));
  const initialCreep = Number((creepLoad + 0.1 * d).toFixed(4));
  const creepReadings = [
    { timeMin: 0, reading: initialCreep, changeFromInitial: 0.0, limit: Number((0.5 * e).toFixed(4)), status: 'PASS' },
    { timeMin: 5, reading: Number((initialCreep + 0.05 * d).toFixed(4)), changeFromInitial: Number((0.05 * d).toFixed(4)), limit: Number((0.5 * e).toFixed(4)), status: 'PASS' },
    { timeMin: 15, reading: Number((initialCreep + 0.1 * d).toFixed(4)), changeFromInitial: Number((0.1 * d).toFixed(4)), limit: Number((0.5 * e).toFixed(4)), status: 'PASS' },
    { timeMin: 30, reading: Number((initialCreep + 0.12 * d).toFixed(4)), changeFromInitial: Number((0.12 * d).toFixed(4)), limit: Number((0.5 * e).toFixed(4)), status: 'PASS' },
  ];

  const zeroReturnVal = Number((0.1 * d).toFixed(4));
  const zeroReturnLimit = Number((0.5 * e).toFixed(4));

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'TIME_DEPENDENCE',
      status: 'COMPLETED',
      result: 'PASS',
      data: {
        creep: creepReadings,
        zeroReturn: {
          readingAfterUnload: zeroReturnVal,
          acceptableLimit: zeroReturnLimit,
          status: 'PASS',
        },
      },
      calculations: {
        creepDelta30Min: Number((0.12 * d).toFixed(4)),
        creepDelta15to30Min: Number((0.02 * d).toFixed(4)),
        zeroReturnError: zeroReturnVal,
        overallVerdict: 'PASS',
      },
      remarks: 'Creep and zero return tests comply with OIML R-76 Section 3.9.4.3 tolerances.',
    },
  });
}

/**
 * Generate mixed test results where ECCENTRICITY test fails and other 5 pass
 */
async function createMixedTestResults(sessionId, instrument) {
  const max = instrument.maxCapacity;
  const min = instrument.minCapacity;
  const e = instrument.verificationInterval;
  const d = instrument.actualInterval;

  // 1. WEIGHING PERFORMANCE (PASS)
  const steps = [
    { frac: 0.0 }, { frac: min / max }, { frac: 0.25 }, { frac: 0.5 }, { frac: 0.75 }, { frac: 1.0 }
  ];
  const wpPoints = steps.map((step, idx) => {
    const applied = Number((step.frac * max).toFixed(4));
    let mpeVal = e * 0.5;
    if (applied > max * 0.5) mpeVal = e * 1.5;
    else if (applied > max * 0.2) mpeVal = e * 1.0;
    mpeVal = Number(mpeVal.toFixed(4));

    const indInc = Number((applied + idx * 0.1 * d).toFixed(4));
    const errInc = Number((indInc - applied).toFixed(4));
    return {
      loadPoint: `L${idx + 1}`,
      appliedLoad: applied,
      indicatedInc: indInc,
      errorInc: errInc,
      indicatedDec: Number((applied + idx * 0.08 * d).toFixed(4)),
      errorDec: Number((idx * 0.08 * d).toFixed(4)),
      hysteresis: Number((0.02 * d).toFixed(4)),
      mpe: mpeVal,
      status: 'PASS',
    };
  });

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'WEIGHING_PERFORMANCE',
      status: 'COMPLETED',
      result: 'PASS',
      data: { points: wpPoints },
      calculations: { maxCorrectedError: Number((0.3 * e).toFixed(4)), maxMpeAllowed: Number((1.5 * e).toFixed(4)), overallVerdict: 'PASS' },
      remarks: 'Weighing performance within permissible limits across operational range.',
    },
  });

  // 2. REPEATABILITY (PASS)
  const halfLoad = Number((0.5 * max).toFixed(4));
  const fullLoad = Number((1.0 * max).toFixed(4));
  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'REPEATABILITY',
      status: 'COMPLETED',
      result: 'PASS',
      data: {
        subTests: [
          { load: halfLoad, loadPercentage: '50% Max', readings: [halfLoad, Number((halfLoad + d).toFixed(4)), halfLoad, halfLoad, Number((halfLoad + d).toFixed(4)), halfLoad], mean: halfLoad, range: d, mpe: e, status: 'PASS' },
          { load: fullLoad, loadPercentage: '100% Max', readings: [fullLoad, Number((fullLoad + d).toFixed(4)), Number((fullLoad + 2 * d).toFixed(4)), fullLoad, Number((fullLoad + d).toFixed(4)), fullLoad], mean: fullLoad, range: Number((2 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
        ],
      },
      calculations: { maxRangeObserved: Number((2 * d).toFixed(4)), mpeTolerance: Number((1.5 * e).toFixed(4)), overallVerdict: 'PASS' },
      remarks: 'Repeatability verified within acceptable tolerances.',
    },
  });

  // 3. ECCENTRICITY (FAIL - Non-conformance on Rear-Left quadrant)
  const eccLoad = Number((max / 3).toFixed(4));
  const centerReading = Number((eccLoad + 0.05 * d).toFixed(4));
  const mpeLimit = Number((1.0 * e).toFixed(4));
  const excessiveError = Number((mpeLimit * 1.85).toFixed(4)); // Exceeds MPE!

  const eccPositions = [
    { position: 'Center', reading: centerReading, diffFromCenter: 0.0, mpe: mpeLimit, status: 'PASS' },
    { position: 'Front-Left', reading: Number((eccLoad + 0.15 * d).toFixed(4)), diffFromCenter: Number((0.1 * d).toFixed(4)), mpe: mpeLimit, status: 'PASS' },
    { position: 'Front-Right', reading: Number((eccLoad - 0.05 * d).toFixed(4)), diffFromCenter: Number((-0.1 * d).toFixed(4)), mpe: mpeLimit, status: 'PASS' },
    { position: 'Rear-Left', reading: Number((eccLoad + excessiveError).toFixed(4)), diffFromCenter: excessiveError, mpe: mpeLimit, status: 'FAIL' },
    { position: 'Rear-Right', reading: Number((eccLoad + 0.2 * d).toFixed(4)), diffFromCenter: Number((0.15 * d).toFixed(4)), mpe: mpeLimit, status: 'PASS' },
  ];

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'ECCENTRICITY',
      status: 'FAILED',
      result: 'FAIL',
      data: { testLoad: eccLoad, positions: eccPositions },
      calculations: {
        maxDifference: excessiveError,
        mpeLimit: mpeLimit,
        failedPositions: ['Rear-Left'],
        overallVerdict: 'FAIL',
      },
      remarks: 'FAIL: Rear-Left quadrant off-center load reading exceeds maximum permissible error (MPE). Mechanical load cell leveling required.',
    },
  });

  // 4. TEMPERATURE (PASS)
  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'TEMPERATURE',
      status: 'COMPLETED',
      result: 'PASS',
      data: {
        tests: [
          { temperature: 20, spanLoad: max, reading: max, error: 0.0, mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
          { temperature: 40, spanLoad: max, reading: Number((max + 0.5 * d).toFixed(4)), error: Number((0.5 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
        ],
      },
      calculations: { zeroDriftPer5C: Number((0.08 * e).toFixed(4)), overallVerdict: 'PASS' },
      remarks: 'Temperature stability compliant.',
    },
  });

  // 5. STABILITY (PASS)
  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'STABILITY',
      status: 'COMPLETED',
      result: 'PASS',
      data: {
        durationHours: 2,
        timePoints: [
          { timeHours: 0, appliedLoad: max, reading: max, drift: 0.0, mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
          { timeHours: 2, appliedLoad: max, reading: Number((max + 0.2 * d).toFixed(4)), drift: Number((0.2 * d).toFixed(4)), mpe: Number((1.5 * e).toFixed(4)), status: 'PASS' },
        ],
      },
      calculations: { maxSpanDrift: Number((0.2 * d).toFixed(4)), overallVerdict: 'PASS' },
      remarks: 'Static load drift within allowable limit.',
    },
  });

  // 6. TIME DEPENDENCE (PASS)
  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'TIME_DEPENDENCE',
      status: 'COMPLETED',
      result: 'PASS',
      data: {
        creep: [
          { timeMin: 0, reading: max, changeFromInitial: 0.0, limit: Number((0.5 * e).toFixed(4)), status: 'PASS' },
          { timeMin: 30, reading: Number((max + 0.2 * d).toFixed(4)), changeFromInitial: Number((0.2 * d).toFixed(4)), limit: Number((0.5 * e).toFixed(4)), status: 'PASS' },
        ],
        zeroReturn: { readingAfterUnload: Number((0.1 * d).toFixed(4)), acceptableLimit: Number((0.5 * e).toFixed(4)), status: 'PASS' },
      },
      calculations: { creepDelta30Min: Number((0.2 * d).toFixed(4)), overallVerdict: 'PASS' },
      remarks: 'Creep and zero return parameters pass.',
    },
  });
}

/**
 * Generate partial test results (only 3 tests: Weighing Performance, Repeatability, Eccentricity)
 */
async function createPartialTestResults(sessionId, instrument) {
  const max = instrument.maxCapacity;
  const min = instrument.minCapacity;
  const e = instrument.verificationInterval;
  const d = instrument.actualInterval;

  // 1. WEIGHING PERFORMANCE (PASS)
  const steps = [
    { frac: 0.0 }, { frac: min / max }, { frac: 0.25 }, { frac: 0.5 }, { frac: 1.0 }
  ];
  const wpPoints = steps.map((step, idx) => {
    const applied = Number((step.frac * max).toFixed(4));
    let mpeVal = e * 0.5;
    if (applied > max * 0.5) mpeVal = e * 1.5;
    else if (applied > max * 0.2) mpeVal = e * 1.0;
    mpeVal = Number(mpeVal.toFixed(4));

    const indInc = Number((applied + idx * 0.2 * d).toFixed(4));
    const errInc = Number((indInc - applied).toFixed(4));
    return {
      loadPoint: `L${idx + 1}`,
      appliedLoad: applied,
      indicatedInc: indInc,
      errorInc: errInc,
      indicatedDec: Number((applied + idx * 0.15 * d).toFixed(4)),
      errorDec: Number((idx * 0.15 * d).toFixed(4)),
      hysteresis: Number((0.05 * d).toFixed(4)),
      mpe: mpeVal,
      status: 'PASS',
    };
  });

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'WEIGHING_PERFORMANCE',
      status: 'COMPLETED',
      result: 'PASS',
      data: { points: wpPoints },
      calculations: { maxCorrectedError: Number((0.4 * e).toFixed(4)), maxMpeAllowed: Number((1.5 * e).toFixed(4)), overallVerdict: 'PASS' },
      remarks: 'Weighbridge heavy truck test points within OIML R-76 Class IIII tolerances.',
    },
  });

  // 2. REPEATABILITY (PASS)
  const halfLoad = Number((0.5 * max).toFixed(4));
  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'REPEATABILITY',
      status: 'COMPLETED',
      result: 'PASS',
      data: {
        subTests: [
          { load: halfLoad, loadPercentage: '50% Max', readings: [halfLoad, Number((halfLoad + d).toFixed(4)), halfLoad, Number((halfLoad + d).toFixed(4)), halfLoad, halfLoad], mean: halfLoad, range: d, mpe: e, status: 'PASS' },
        ],
      },
      calculations: { maxRangeObserved: d, mpeTolerance: e, overallVerdict: 'PASS' },
      remarks: 'Repeatability verified at 30 tonnes static test load.',
    },
  });

  // 3. ECCENTRICITY (PASS)
  const eccLoad = Number((max / 4).toFixed(4));
  const eccPositions = [
    { position: 'Center', reading: eccLoad, diffFromCenter: 0.0, mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
    { position: 'Section 1 (Approach)', reading: Number((eccLoad + 0.3 * d).toFixed(4)), diffFromCenter: Number((0.3 * d).toFixed(4)), mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
    { position: 'Section 2 (Middle)', reading: Number((eccLoad + 0.1 * d).toFixed(4)), diffFromCenter: Number((0.1 * d).toFixed(4)), mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
    { position: 'Section 3 (Departure)', reading: Number((eccLoad + 0.2 * d).toFixed(4)), diffFromCenter: Number((0.2 * d).toFixed(4)), mpe: Number((1.0 * e).toFixed(4)), status: 'PASS' },
  ];

  await prisma.testResult.create({
    data: {
      testSessionId: sessionId,
      testType: 'ECCENTRICITY',
      status: 'COMPLETED',
      result: 'PASS',
      data: { testLoad: eccLoad, positions: eccPositions },
      calculations: { maxDifference: Number((0.3 * d).toFixed(4)), mpeLimit: Number((1.0 * e).toFixed(4)), overallVerdict: 'PASS' },
      remarks: 'Eccentric load test across weighbridge sections verified compliant.',
    },
  });
}

async function main() {
  console.log('--- Seeding NAWI-ReportPro Metrological Database ---');

  // Clear existing data in correct relational order
  await prisma.auditLog.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.testSession.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating official user accounts...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nawi.gov.in',
      password: hashedPassword,
      name: 'Dr. Rajesh Kumar',
      role: 'ADMIN',
    },
  });

  const inspector1 = await prisma.user.create({
    data: {
      email: 'inspector@nawi.gov.in',
      password: hashedPassword,
      name: 'Priya Sharma',
      role: 'INSPECTOR',
    },
  });

  const inspector2 = await prisma.user.create({
    data: {
      email: 'officer@nawi.gov.in',
      password: hashedPassword,
      name: 'Amit Patel',
      role: 'INSPECTOR',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@nawi.gov.in',
      password: hashedPassword,
      name: 'Sunita Verma',
      role: 'VIEWER',
    },
  });

  console.log('Users created:');
  console.log(` - Admin: ${admin.email} (${admin.name})`);
  console.log(` - Inspector 1: ${inspector1.email} (${inspector1.name})`);
  console.log(` - Inspector 2: ${inspector2.email} (${inspector2.name})`);
  console.log(` - Viewer: ${viewer.email} (${viewer.name})`);

  // Create 5 instruments with realistic metrological data
  console.log('Registering standard weighing instruments across Classes I-IIII...');
  const instruments = [
    {
      name: 'Precision Laboratory Balance',
      type: 'LABORATORY_BALANCE',
      manufacturer: 'Contech Instruments Ltd.',
      model: 'CAB-300C',
      serialNumber: 'CTI-2024-LB-00147',
      accuracyClass: 'CLASS_II',
      maxCapacity: 0.310, // 310g in kg
      minCapacity: 0.001, // 1g
      verificationInterval: 0.001, // 1mg = e
      actualInterval: 0.0001, // 0.1mg = d
      unit: 'g',
      location: 'GATC Lab 1, New Delhi',
    },
    {
      name: 'Electronic Platform Scale',
      type: 'PLATFORM_SCALE',
      manufacturer: 'Essae Digitronics',
      model: 'DS-252',
      serialNumber: 'ESS-2024-PS-03298',
      accuracyClass: 'CLASS_III',
      maxCapacity: 300, // 300 kg
      minCapacity: 2, // 2 kg
      verificationInterval: 0.1, // 100g
      actualInterval: 0.05, // 50g
      unit: 'kg',
      location: 'GATC Lab 2, Mumbai',
    },
    {
      name: 'Retail Counter Scale',
      type: 'ELECTRONIC_SCALE',
      manufacturer: 'Ace Technologies',
      model: 'ACE-30K',
      serialNumber: 'ACE-2024-EC-05612',
      accuracyClass: 'CLASS_III',
      maxCapacity: 30, // 30 kg
      minCapacity: 0.2, // 200g
      verificationInterval: 0.01, // 10g
      actualInterval: 0.005, // 5g
      unit: 'kg',
      location: 'Regional Office, Chennai',
    },
    {
      name: 'Industrial Weighbridge',
      type: 'WEIGHBRIDGE',
      manufacturer: 'Avery India Ltd.',
      model: 'WB-60T',
      serialNumber: 'AVR-2024-WB-00089',
      accuracyClass: 'CLASS_IIII',
      maxCapacity: 60000, // 60 tonnes
      minCapacity: 400, // 400 kg
      verificationInterval: 20, // 20 kg
      actualInterval: 10, // 10 kg
      unit: 'kg',
      location: 'Toll Plaza Checkpoint, Kolkata',
    },
    {
      name: 'Jewelry Scale',
      type: 'ELECTRONIC_SCALE',
      manufacturer: 'Phoenix Mecano',
      model: 'JW-600',
      serialNumber: 'PHX-2024-JS-01456',
      accuracyClass: 'CLASS_II',
      maxCapacity: 0.600, // 600g
      minCapacity: 0.01, // 10mg
      verificationInterval: 0.01, // 10mg
      actualInterval: 0.001, // 1mg
      unit: 'g',
      location: 'Testing Center, Jaipur',
    },
  ];

  const createdInstruments = [];
  for (const inst of instruments) {
    const created = await prisma.instrument.create({ data: inst });
    createdInstruments.push(created);
    console.log(` Registered: ${created.name} (${created.serialNumber}) [${created.accuracyClass}]`);
  }

  // Create Test Sessions
  console.log('Generating test sessions with authentic measurement runs...');

  // Session 1: Platform Scale — ALL PASS
  const session1 = await prisma.testSession.create({
    data: {
      certificateNo: 'NAWI-2026-000001',
      instrumentId: createdInstruments[1].id, // Platform Scale
      conductedById: inspector1.id,
      status: 'COMPLETED',
      overallResult: 'PASS',
      temperature: 23.5,
      humidity: 55,
      remarks: 'Instrument satisfies all OIML R-76 Class III verification criteria. Verified for legal commercial trade.',
      startedAt: new Date('2026-08-15T09:00:00'),
      completedAt: new Date('2026-08-15T17:30:00'),
    },
  });
  await createPassingTestResults(session1.id, createdInstruments[1]);
  console.log(` Created Session 1: ${session1.certificateNo} (ALL PASS)`);

  // Session 2: Retail Counter Scale — MIXED (5 PASS, 1 FAIL on Eccentricity)
  const session2 = await prisma.testSession.create({
    data: {
      certificateNo: 'NAWI-2026-000002',
      instrumentId: createdInstruments[2].id, // Retail Counter Scale
      conductedById: inspector2.id,
      status: 'COMPLETED',
      overallResult: 'FAIL',
      temperature: 25.0,
      humidity: 60,
      remarks: 'Verification failed on Eccentricity test. Re-calibration and load cell leveling required.',
      startedAt: new Date('2026-08-20T10:00:00'),
      completedAt: new Date('2026-08-20T16:00:00'),
    },
  });
  await createMixedTestResults(session2.id, createdInstruments[2]);
  console.log(` Created Session 2: ${session2.certificateNo} (MIXED: 5 PASS, 1 FAIL)`);

  // Session 3: Jewelry Scale — ALL PASS
  const session3 = await prisma.testSession.create({
    data: {
      certificateNo: 'NAWI-2026-000003',
      instrumentId: createdInstruments[4].id, // Jewelry Scale
      conductedById: inspector1.id,
      status: 'COMPLETED',
      overallResult: 'PASS',
      temperature: 22.0,
      humidity: 50,
      remarks: 'Precision jewelry scale meets high accuracy Class II requirements for bullion trade.',
      startedAt: new Date('2026-08-25T09:30:00'),
      completedAt: new Date('2026-08-25T18:00:00'),
    },
  });
  await createPassingTestResults(session3.id, createdInstruments[4]);
  console.log(` Created Session 3: ${session3.certificateNo} (ALL PASS)`);

  // Session 4: Weighbridge — IN PROGRESS (3 tests done)
  const session4 = await prisma.testSession.create({
    data: {
      certificateNo: 'NAWI-2026-000004',
      instrumentId: createdInstruments[3].id, // Weighbridge
      conductedById: inspector2.id,
      status: 'IN_PROGRESS',
      temperature: 28.0,
      humidity: 65,
      remarks: 'On-site heavy truck tests in progress. Environmental tests pending.',
      startedAt: new Date('2026-08-28T08:00:00'),
    },
  });
  await createPartialTestResults(session4.id, createdInstruments[3]);
  console.log(` Created Session 4: ${session4.certificateNo} (IN PROGRESS - 3 tests)`);

  // Create Audit Logs
  console.log('Generating official audit trail log records...');
  const auditEntries = [
    { userId: admin.id, action: 'LOGIN', details: 'Admin logged in', ipAddress: '192.168.1.10' },
    { userId: inspector1.id, action: 'LOGIN', details: 'Inspector Priya Sharma logged in', ipAddress: '192.168.1.15' },
    { userId: inspector1.id, action: 'CREATE_INSTRUMENT', entityType: 'Instrument', entityId: createdInstruments[1].id, details: 'Registered Platform Scale ESS-2024-PS-03298' },
    { userId: inspector1.id, action: 'CREATE_TEST_SESSION', entityType: 'TestSession', entityId: session1.id, details: 'Started test session NAWI-2026-000001' },
    { userId: inspector1.id, action: 'ENTER_TEST_DATA', entityType: 'TestResult', details: 'Entered weighing performance data for NAWI-2026-000001' },
    { userId: inspector1.id, action: 'FINALIZE_SESSION', entityType: 'TestSession', entityId: session1.id, details: 'Finalized session NAWI-2026-000001 — PASS' },
    { userId: inspector1.id, action: 'GENERATE_REPORT', entityType: 'TestSession', entityId: session1.id, details: 'Generated certificate for NAWI-2026-000001' },
    { userId: inspector2.id, action: 'LOGIN', details: 'Inspector Amit Patel logged in', ipAddress: '192.168.1.20' },
    { userId: inspector2.id, action: 'CREATE_TEST_SESSION', entityType: 'TestSession', entityId: session2.id, details: 'Started test session NAWI-2026-000002' },
    { userId: inspector2.id, action: 'ENTER_TEST_DATA', entityType: 'TestResult', details: 'Entered eccentricity test data showing non-conformance for NAWI-2026-000002' },
    { userId: inspector2.id, action: 'FINALIZE_SESSION', entityType: 'TestSession', entityId: session2.id, details: 'Finalized session NAWI-2026-000002 — FAIL' },
    { userId: viewer.id, action: 'LOGIN', details: 'Auditor Sunita Verma logged in', ipAddress: '192.168.1.30' },
    { userId: viewer.id, action: 'VIEW_AUDIT_TRAIL', entityType: 'AuditLog', details: 'Audited verification reports and digital signatures' },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        ...entry,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      },
    });
  }

  console.log('\n=============================================');
  console.log(' Seed data loaded successfully!');
  console.log('=============================================');
  console.log('Default Login Credentials:');
  console.log('  Admin:     admin@nawi.gov.in     / password123');
  console.log('  Inspector: inspector@nawi.gov.in  / password123');
  console.log('  Officer:   officer@nawi.gov.in    / password123');
  console.log('  Viewer:    viewer@nawi.gov.in     / password123');
  console.log('=============================================\n');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Error seeding database:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = {
  main,
  createPassingTestResults,
  createMixedTestResults,
  createPartialTestResults,
};
