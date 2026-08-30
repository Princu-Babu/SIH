/**
 * OIML R-76 Metrological Calculation Engine
 * Reference: OIML R 76-1:2006 (Non-automatic weighing instruments - Part 1: Metrological and technical requirements)
 * Table 3: Maximum permissible errors on initial verification
 */

// MPE limits by accuracy class and load range in units of verification interval (e)
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

/**
 * Returns Maximum Permissible Error (MPE) in units of verification scale interval (e).
 * Per OIML R-76-1 clause 3.5.2, in-service MPE is 2 * initial verification MPE.
 * 
 * @param {string} accuracyClass - 'CLASS_I', 'CLASS_II', 'CLASS_III', 'CLASS_IIII'
 * @param {number} loadInE - Applied load normalized to verification interval (Load / e)
 * @param {boolean} [isInService=false] - Whether in-service limits apply
 * @returns {number} MPE in units of e
 */
function getMPE(accuracyClass, loadInE, isInService = false) {
  const normClass = String(accuracyClass || 'CLASS_III').toUpperCase();
  const tiers = MPE_TABLE[normClass] || MPE_TABLE.CLASS_III;
  const absLoad = Math.abs(Number(loadInE) || 0);

  let baseMpe = 1.5;
  for (const tier of tiers) {
    if (absLoad >= tier.minLoad && absLoad <= tier.maxLoad) {
      baseMpe = tier.mpeInitial;
      break;
    }
  }

  return isInService ? baseMpe * 2 : baseMpe;
}

/**
 * Helper to calculate continuous indication P and error E using turning points (OIML R-76 A.4.4.3)
 * Formula: P = I + 0.5e - deltaL
 * Error: E = P - L
 */
function calculateIndicationAndError(appliedLoad, indicatedValue, verificationInterval, deltaL) {
  const L = Number(appliedLoad) || 0;
  const I = Number(indicatedValue) || 0;
  const e = Number(verificationInterval) || 1;

  let P = I;
  if (deltaL !== undefined && deltaL !== null && !isNaN(Number(deltaL))) {
    P = I + 0.5 * e - Number(deltaL);
  }

  const E = P - L;
  return { continuousIndication: Number(P.toFixed(8)), error: Number(E.toFixed(8)) };
}

/**
 * 1. Weighing Performance Test Calculation
 * Evaluates error curve across increasing and decreasing loads and checks hysteresis.
 * 
 * @param {Object|Array} data - Array of points or { points: [...] }
 * @param {Object} instrument - Instrument specifications (verificationInterval, accuracyClass, etc.)
 * @param {boolean} [isInService=false]
 */
function calculateWeighingPerformance(data, instrument, isInService = false) {
  const points = Array.isArray(data) ? data : data?.points || [];
  const e = Number(instrument?.verificationInterval) || 0.001;
  const accuracyClass = instrument?.accuracyClass || 'CLASS_III';

  if (!points.length) {
    return {
      points: [],
      maxCorrectedError: 0,
      maxMpeAllowed: 0,
      overallPass: false,
      summary: 'No test measurement points provided.',
    };
  }

  // Find zero error (E0) at initial zero load
  const zeroPoint = points.find(p => Number(p.appliedLoad) === 0 && (p.isIncreasing === true || p.isIncreasing === undefined));
  let zeroError = 0;
  if (zeroPoint) {
    const { error } = calculateIndicationAndError(0, zeroPoint.indicatedValue, e, zeroPoint.deltaL);
    zeroError = error;
  }

  let overallPass = true;
  let maxCorrectedError = 0;
  let maxMpeAllowed = 0;

  const evaluatedPoints = points.map((p, idx) => {
    const appliedLoad = Number(p.appliedLoad) || 0;
    const indicatedValue = Number(p.indicatedValue) || 0;
    const isIncreasing = p.isIncreasing !== false;
    const deltaL = p.deltaL;

    const { continuousIndication, error } = calculateIndicationAndError(appliedLoad, indicatedValue, e, deltaL);
    
    // Corrected error Ec = E - E0 (OIML R-76 A.4.4.3)
    const correctedError = Number((error - zeroError).toFixed(8));
    
    // Calculate MPE
    const loadInE = appliedLoad / e;
    const mpeE = getMPE(accuracyClass, loadInE, isInService);
    const mpeMass = Number((mpeE * e).toFixed(8));

    // Tolerance check (with micro-epsilon for floating point)
    const passed = Math.abs(correctedError) <= mpeMass + 1e-9;
    if (!passed) {
      overallPass = false;
    }

    if (Math.abs(correctedError) > maxCorrectedError) {
      maxCorrectedError = Math.abs(correctedError);
    }
    if (mpeMass > maxMpeAllowed) {
      maxMpeAllowed = mpeMass;
    }

    return {
      index: idx + 1,
      appliedLoad,
      indicatedValue,
      deltaL: deltaL !== undefined ? Number(deltaL) : null,
      continuousIndication,
      error,
      correctedError,
      mpeInE: mpeE,
      mpeMass,
      isIncreasing,
      passed,
    };
  });

  return {
    points: evaluatedPoints,
    zeroError: Number(zeroError.toFixed(8)),
    maxCorrectedError: Number(maxCorrectedError.toFixed(8)),
    maxMpeAllowed: Number(maxMpeAllowed.toFixed(8)),
    overallPass,
    summary: overallPass
      ? 'All measurement points within OIML R-76 Maximum Permissible Error tolerances.'
      : 'One or more measurement points exceeded Maximum Permissible Error tolerances.',
  };
}

/**
 * 2. Repeatability Test Calculation
 * Evaluates multiple consecutive weighings of identical load.
 * Difference between maximum and minimum indication must not exceed |MPE| for that load.
 * 
 * @param {Object|Array} data - Array of series or { series: [{ load, readings: [...] }] }
 * @param {Object} instrument
 * @param {boolean} [isInService=false]
 */
function calculateRepeatability(data, instrument, isInService = false) {
  let series = [];
  if (Array.isArray(data)) {
    series = data;
  } else if (data?.series && Array.isArray(data.series)) {
    series = data.series;
  } else if (data?.readings && Array.isArray(data.readings)) {
    series = [{ load: Number(data.load || instrument?.maxCapacity || 0), readings: data.readings }];
  }

  const e = Number(instrument?.verificationInterval) || 0.001;
  const accuracyClass = instrument?.accuracyClass || 'CLASS_III';

  if (!series.length) {
    return {
      series: [],
      maxRange: 0,
      overallPass: false,
      summary: 'No repeatability test series provided.',
    };
  }

  let overallPass = true;
  let globalMaxRange = 0;

  const evaluatedSeries = series.map((s, idx) => {
    const load = Number(s.load) || 0;
    const rawReadings = Array.isArray(s.readings) ? s.readings : [];
    
    // Normalise reading values
    const numericReadings = rawReadings.map(r => (typeof r === 'object' ? Number(r.indicatedValue ?? r.reading ?? 0) : Number(r)));

    if (numericReadings.length < 2) {
      return {
        seriesIndex: idx + 1,
        load,
        readings: numericReadings,
        maxReading: numericReadings[0] || 0,
        minReading: numericReadings[0] || 0,
        range: 0,
        mpeMass: 0,
        passed: false,
        remarks: 'At least 2 repeated readings required.',
      };
    }

    const maxVal = Math.max(...numericReadings);
    const minVal = Math.min(...numericReadings);
    const range = Number((maxVal - minVal).toFixed(8));

    const loadInE = load / e;
    const mpeE = getMPE(accuracyClass, loadInE, isInService);
    const mpeMass = Number((mpeE * e).toFixed(8));

    const passed = range <= mpeMass + 1e-9;
    if (!passed) {
      overallPass = false;
    }
    if (range > globalMaxRange) {
      globalMaxRange = range;
    }

    return {
      seriesIndex: idx + 1,
      load,
      readings: numericReadings,
      maxReading: maxVal,
      minReading: minVal,
      range,
      mpeInE: mpeE,
      mpeMass,
      passed,
    };
  });

  return {
    series: evaluatedSeries,
    maxRange: Number(globalMaxRange.toFixed(8)),
    overallPass,
    summary: overallPass
      ? `Repeatability satisfied. Maximum observed variation (${globalMaxRange} ${instrument?.unit || 'kg'}) <= MPE.`
      : `Repeatability failed. Maximum variation (${globalMaxRange} ${instrument?.unit || 'kg'}) exceeded MPE limit.`,
  };
}

/**
 * 3. Eccentricity Test Calculation
 * Evaluates off-center loading across specified positions (Center, Corners/Segments).
 * Error at each position must not exceed MPE for the applied eccentricity load (typically 1/3 Max).
 * 
 * @param {Object|Array} data - { positions: [{ position, appliedLoad, indicatedValue, deltaL }] }
 * @param {Object} instrument
 * @param {boolean} [isInService=false]
 */
function calculateEccentricity(data, instrument, isInService = false) {
  const positions = Array.isArray(data) ? data : data?.positions || [];
  const e = Number(instrument?.verificationInterval) || 0.001;
  const accuracyClass = instrument?.accuracyClass || 'CLASS_III';

  if (!positions.length) {
    return {
      positions: [],
      maxError: 0,
      mpe: 0,
      overallPass: false,
      summary: 'No eccentricity positions provided.',
    };
  }

  let overallPass = true;
  let maxError = 0;
  let mpeForTest = 0;

  // Find center position if provided as reference
  const centerPos = positions.find(p => String(p.position).toUpperCase() === 'CENTER' || String(p.position).toUpperCase() === 'POS_CENTER');
  let centerIndication = null;
  if (centerPos) {
    const { continuousIndication } = calculateIndicationAndError(centerPos.appliedLoad, centerPos.indicatedValue, e, centerPos.deltaL);
    centerIndication = continuousIndication;
  }

  let maxDiffFromCenter = 0;

  const evaluatedPositions = positions.map((p, idx) => {
    const posName = p.position || `POS_${idx + 1}`;
    const appliedLoad = Number(p.appliedLoad) || 0;
    const indicatedValue = Number(p.indicatedValue) || 0;
    const deltaL = p.deltaL;

    const { continuousIndication, error } = calculateIndicationAndError(appliedLoad, indicatedValue, e, deltaL);
    const absError = Math.abs(error);

    const loadInE = appliedLoad / e;
    const mpeE = getMPE(accuracyClass, loadInE, isInService);
    const mpeMass = Number((mpeE * e).toFixed(8));
    mpeForTest = mpeMass;

    const passed = absError <= mpeMass + 1e-9;
    if (!passed) {
      overallPass = false;
    }

    if (absError > maxError) {
      maxError = absError;
    }

    let diffFromCenter = null;
    if (centerIndication !== null) {
      diffFromCenter = Number(Math.abs(continuousIndication - centerIndication).toFixed(8));
      if (diffFromCenter > maxDiffFromCenter) {
        maxDiffFromCenter = diffFromCenter;
      }
    }

    return {
      position: posName,
      appliedLoad,
      indicatedValue,
      continuousIndication,
      error,
      diffFromCenter,
      mpeInE: mpeE,
      mpeMass,
      passed,
    };
  });

  return {
    positions: evaluatedPositions,
    maxError: Number(maxError.toFixed(8)),
    mpe: Number(mpeForTest.toFixed(8)),
    maxDifferenceFromCenter: Number(maxDiffFromCenter.toFixed(8)),
    overallPass,
    summary: overallPass
      ? `Eccentricity test passed. Maximum error (${maxError} ${instrument?.unit || 'kg'}) within MPE limit (${mpeForTest} ${instrument?.unit || 'kg'}).`
      : `Eccentricity test failed. Maximum error (${maxError} ${instrument?.unit || 'kg'}) exceeded MPE (${mpeForTest} ${instrument?.unit || 'kg'}).`,
  };
}

/**
 * 4. Temperature Effect Test Calculation
 * Evaluates zero drift and span error over temperature range (-10°C to +40°C or declared).
 * Requirement: Zero drift <= 1e per 5°C temperature difference. Span error <= MPE.
 * 
 * @param {Object|Array} data - { temperaturePoints: [{ temperature, zeroIndication, spanLoad, spanIndication, deltaL }] }
 * @param {Object} instrument
 * @param {boolean} [isInService=false]
 */
function calculateTemperatureEffect(data, instrument, isInService = false) {
  const points = Array.isArray(data) ? data : data?.temperaturePoints || [];
  const e = Number(instrument?.verificationInterval) || 0.001;
  const accuracyClass = instrument?.accuracyClass || 'CLASS_III';

  if (!points.length) {
    return {
      temperaturePoints: [],
      zeroDriftPer5C: 0,
      maxSpanError: 0,
      overallPass: false,
      summary: 'No temperature points provided.',
    };
  }

  let overallPass = true;
  let maxSpanError = 0;
  let maxDriftPer5C = 0;

  // Sort points by temperature
  const sortedPoints = [...points].sort((a, b) => Number(a.temperature) - Number(b.temperature));

  const evaluatedPoints = sortedPoints.map((p, idx) => {
    const temp = Number(p.temperature) || 0;
    const zeroInd = Number(p.zeroIndication) || 0;
    const spanLoad = Number(p.spanLoad) || 0;
    const spanInd = Number(p.spanIndication) || 0;

    const zeroCalc = calculateIndicationAndError(0, zeroInd, e, p.zeroDeltaL);
    const spanCalc = calculateIndicationAndError(spanLoad, spanInd, e, p.spanDeltaL);

    const spanError = spanCalc.error;
    const correctedSpanError = Number((spanError - zeroCalc.error).toFixed(8));

    const loadInE = spanLoad / e;
    const mpeE = getMPE(accuracyClass, loadInE, isInService);
    const mpeMass = Number((mpeE * e).toFixed(8));

    const spanPassed = Math.abs(correctedSpanError) <= mpeMass + 1e-9;
    if (!spanPassed) {
      overallPass = false;
    }
    if (Math.abs(correctedSpanError) > maxSpanError) {
      maxSpanError = Math.abs(correctedSpanError);
    }

    return {
      index: idx + 1,
      temperature: temp,
      zeroIndication: zeroInd,
      zeroError: zeroCalc.error,
      spanLoad,
      spanIndication: spanInd,
      spanError,
      correctedSpanError,
      mpeMass,
      spanPassed,
    };
  });

  // Calculate Zero Drift per 5°C across adjacent temperatures
  const zeroDrifts = [];
  for (let i = 0; i < evaluatedPoints.length - 1; i++) {
    const p1 = evaluatedPoints[i];
    const p2 = evaluatedPoints[i + 1];
    const deltaT = Math.abs(p2.temperature - p1.temperature);
    
    if (deltaT > 0) {
      const deltaE0 = Math.abs(p2.zeroError - p1.zeroError);
      // Normalized to 5 deg C: (deltaE0 / deltaT) * 5
      const driftPer5C = Number(((deltaE0 / deltaT) * 5).toFixed(8));
      const allowedDrift = Number((1.0 * e).toFixed(8)); // 1e per 5 deg C

      const driftPassed = driftPer5C <= allowedDrift + 1e-9;
      if (!driftPassed) {
        overallPass = false;
      }
      if (driftPer5C > maxDriftPer5C) {
        maxDriftPer5C = driftPer5C;
      }

      zeroDrifts.push({
        fromTemp: p1.temperature,
        toTemp: p2.temperature,
        deltaT,
        deltaE0,
        driftPer5C,
        allowedDrift,
        driftPassed,
      });
    }
  }

  return {
    temperaturePoints: evaluatedPoints,
    zeroDriftEvaluations: zeroDrifts,
    zeroDriftPer5C: Number(maxDriftPer5C.toFixed(8)),
    maxSpanError: Number(maxSpanError.toFixed(8)),
    overallPass,
    summary: overallPass
      ? `Temperature test compliant. Max zero drift (${maxDriftPer5C} / 5°C) <= 1e (${e}).`
      : 'Temperature test failed. Zero drift or span error exceeded OIML R-76 limit.',
  };
}

/**
 * 5. Stability / Warm-Up Test Calculation
 * Evaluates zero and span drift over time after power-on.
 * 
 * @param {Object|Array} data - { timePoints: [{ timestampMinutes, zeroReading, loadReading, appliedLoad }] }
 * @param {Object} instrument
 * @param {boolean} [isInService=false]
 */
function calculateStability(data, instrument, isInService = false) {
  const points = Array.isArray(data) ? data : data?.timePoints || [];
  const e = Number(instrument?.verificationInterval) || 0.001;
  const accuracyClass = instrument?.accuracyClass || 'CLASS_III';

  if (!points.length) {
    return {
      timePoints: [],
      maxZeroDrift: 0,
      maxSpanDrift: 0,
      overallPass: false,
      summary: 'No stability time-series points provided.',
    };
  }

  let overallPass = true;
  const initialZero = Number(points[0]?.zeroReading) || 0;
  const initialLoadReading = Number(points[0]?.loadReading) || 0;
  const appliedLoad = Number(points[0]?.appliedLoad || instrument?.maxCapacity || 0);

  const loadInE = appliedLoad / e;
  const mpeE = getMPE(accuracyClass, loadInE, isInService);
  const mpeMass = Number((mpeE * e).toFixed(8));
  const allowedZeroDrift = Number((1.0 * e).toFixed(8)); // 1.0e

  let maxZeroDrift = 0;
  let maxSpanDrift = 0;

  const evaluatedPoints = points.map((p, idx) => {
    const tMin = Number(p.timestampMinutes ?? idx * 15);
    const zeroReading = Number(p.zeroReading) || 0;
    const loadReading = Number(p.loadReading) || 0;

    const zeroDrift = Number(Math.abs(zeroReading - initialZero).toFixed(8));
    const spanDrift = Number(Math.abs(loadReading - initialLoadReading).toFixed(8));

    if (zeroDrift > maxZeroDrift) maxZeroDrift = zeroDrift;
    if (spanDrift > maxSpanDrift) maxSpanDrift = spanDrift;

    const zeroPassed = zeroDrift <= allowedZeroDrift + 1e-9;
    const spanPassed = spanDrift <= mpeMass + 1e-9;

    if (!zeroPassed || !spanPassed) {
      overallPass = false;
    }

    return {
      timestampMinutes: tMin,
      zeroReading,
      loadReading,
      zeroDrift,
      spanDrift,
      zeroPassed,
      spanPassed,
    };
  });

  return {
    timePoints: evaluatedPoints,
    maxZeroDrift: Number(maxZeroDrift.toFixed(8)),
    maxSpanDrift: Number(maxSpanDrift.toFixed(8)),
    allowedZeroDrift,
    mpeMass,
    overallPass,
    summary: overallPass
      ? `Stability test passed. Max zero drift (${maxZeroDrift}) <= 1e, span drift (${maxSpanDrift}) <= MPE.`
      : 'Stability test failed. Drift exceeded permissible limits.',
  };
}

/**
 * 6. Time-Dependence (Creep & Zero Return) Test Calculation
 * Creep under load (0, 5, 15, 30 min) and zero return after complete unloading.
 * Limits (OIML R-76 3.9.4):
 * - Delta (30m - 0m) <= 0.5 * |MPE| (or 1.0 MPE)
 * - Delta (30m - 15m) <= 0.2 * |MPE|
 * - Zero return after 30m unload <= 0.5e
 * 
 * @param {Object} data - { creepReadings: [{ minute, indication }], zeroReturn: { appliedLoad, indicationAfterUnload } }
 * @param {Object} instrument
 * @param {boolean} [isInService=false]
 */
function calculateTimeDependence(data, instrument, isInService = false) {
  const creepReadings = data?.creepReadings || [];
  const zeroReturn = data?.zeroReturn || { appliedLoad: 0, indicationAfterUnload: 0 };
  const e = Number(instrument?.verificationInterval) || 0.001;
  const accuracyClass = instrument?.accuracyClass || 'CLASS_III';
  const testLoad = Number(data?.testLoad || instrument?.maxCapacity || 0);

  if (!creepReadings.length) {
    return {
      creepAnalysis: null,
      zeroReturnAnalysis: null,
      overallPass: false,
      summary: 'No creep readings provided for time-dependence test.',
    };
  }

  const loadInE = testLoad / e;
  const mpeE = getMPE(accuracyClass, loadInE, isInService);
  const mpeMass = Number((mpeE * e).toFixed(8));

  // Extract readings at key times
  const read0 = Number(creepReadings.find(r => Number(r.minute) === 0)?.indication ?? creepReadings[0]?.indication ?? 0);
  const read15 = Number(creepReadings.find(r => Number(r.minute) === 15)?.indication ?? creepReadings[Math.floor(creepReadings.length / 2)]?.indication ?? read0);
  const read30 = Number(creepReadings.find(r => Number(r.minute) === 30)?.indication ?? creepReadings[creepReadings.length - 1]?.indication ?? read0);

  const delta30to0 = Number(Math.abs(read30 - read0).toFixed(8));
  const delta30to15 = Number(Math.abs(read30 - read15).toFixed(8));

  const allowedDelta30 = Number((0.5 * mpeMass).toFixed(8)); // 0.5 MPE
  const allowedDelta15to30 = Number((0.2 * mpeMass).toFixed(8)); // 0.2 MPE

  const creep30Passed = delta30to0 <= allowedDelta30 + 1e-9;
  const creep15Passed = delta30to15 <= allowedDelta15to30 + 1e-9;

  // Zero return analysis
  const zeroIndicationAfter = Number(zeroReturn.indicationAfterUnload ?? 0);
  const zeroReturnError = Number(Math.abs(zeroIndicationAfter).toFixed(8));
  const allowedZeroReturn = Number((0.5 * e).toFixed(8)); // 0.5e

  const zeroReturnPassed = zeroReturnError <= allowedZeroReturn + 1e-9;

  const overallPass = creep30Passed && creep15Passed && zeroReturnPassed;

  return {
    creepAnalysis: {
      reading0m: read0,
      reading15m: read15,
      reading30m: read30,
      delta30to0,
      allowedDelta30,
      creep30Passed,
      delta30to15,
      allowedDelta15to30,
      creep15Passed,
      mpeMass,
    },
    zeroReturnAnalysis: {
      zeroIndicationAfter,
      zeroReturnError,
      allowedZeroReturn,
      zeroReturnPassed,
    },
    overallPass,
    summary: overallPass
      ? 'Time dependence test compliant. Creep and zero return errors within OIML R-76 limits.'
      : 'Time dependence test failed. Creep or zero return exceeded permissible thresholds.',
  };
}

/**
 * Dispatcher to evaluate any test result based on testType
 * 
 * @param {string} testType - 'WEIGHING_PERFORMANCE' | 'REPEATABILITY' | 'ECCENTRICITY' | 'TEMPERATURE' | 'STABILITY' | 'TIME_DEPENDENCE'
 * @param {Object} data - Raw test data
 * @param {Object} instrument - Instrument metadata
 * @param {boolean} [isInService=false]
 * @returns {Object} { testType, status: 'COMPLETED', result: 'PASS'|'FAIL', calculations, data }
 */
function evaluateTestResult(testType, data, instrument, isInService = false) {
  let calculations = {};

  switch (testType) {
    case 'WEIGHING_PERFORMANCE':
      calculations = calculateWeighingPerformance(data, instrument, isInService);
      break;
    case 'REPEATABILITY':
      calculations = calculateRepeatability(data, instrument, isInService);
      break;
    case 'ECCENTRICITY':
      calculations = calculateEccentricity(data, instrument, isInService);
      break;
    case 'TEMPERATURE':
      calculations = calculateTemperatureEffect(data, instrument, isInService);
      break;
    case 'STABILITY':
      calculations = calculateStability(data, instrument, isInService);
      break;
    case 'TIME_DEPENDENCE':
      calculations = calculateTimeDependence(data, instrument, isInService);
      break;
    default:
      throw new Error(`Unsupported test type: ${testType}`);
  }

  const result = calculations.overallPass ? 'PASS' : 'FAIL';

  return {
    testType,
    status: 'COMPLETED',
    result,
    calculations,
    data,
  };
}

module.exports = {
  MPE_TABLE,
  getMPE,
  calculateIndicationAndError,
  calculateWeighingPerformance,
  calculateRepeatability,
  calculateEccentricity,
  calculateTemperatureEffect,
  calculateStability,
  calculateTimeDependence,
  evaluateTestResult,
};
