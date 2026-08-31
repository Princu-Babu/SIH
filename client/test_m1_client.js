/**
 * Verification script for client/src/utils/metrology.js and client/src/utils/uncertainty.js
 */

import assert from 'assert';
import {
  ACCURACY_CLASSES,
  MPE_TIERS,
  getMPEFactor,
  calculateTareCapacities,
  calculateMultiIntervalMPE,
  calculateMpe,
  calculateContinuousIndication,
  calculateCorrectedError,
  generateBoundaryLoadPoints,
  validateHysteresis,
  roundTo,
} from './src/utils/metrology.js';

import {
  TEMPERATURE_COEFFICIENT_TK,
  computeRepeatabilityUncertainty,
  computeResolutionUncertainty,
  computeStandardWeightsUncertainty,
  computeEccentricityUncertainty,
  computeTemperatureUncertainty,
  computeExpandedUncertainty,
  calculateUncertaintyBudget,
  computeCalibrationUncertaintyCurve,
} from './src/utils/uncertainty.js';

console.log('=== RUNNING CLIENT-SIDE METROLOGY & UNCERTAINTY TEST SUITE ===\n');

// 1. Multi-Interval
const multiRanges = [
  { max: 6, e: 0.001, d: 0.001, min: 0.02 },
  { max: 15, e: 0.002, d: 0.002, min: 0.04 },
];

const r1 = calculateMultiIntervalMPE(4.0, 'CLASS_III', multiRanges, false);
assert.strictEqual(r1.currentRangeIndex, 0);
assert.strictEqual(r1.currentE, 0.001);
assert.strictEqual(r1.mpe, 0.0015);
console.log('✓ Client Multi-Interval Range 1 check passed');

const r2 = calculateMultiIntervalMPE(8.0, 'CLASS_III', multiRanges, false);
assert.strictEqual(r2.currentRangeIndex, 1);
assert.strictEqual(r2.currentE, 0.002);
assert.strictEqual(r2.mpe, 0.003);
console.log('✓ Client Multi-Interval Range 2 check passed');

// 2. Tare Capacity & Adjustments
const tareSub = calculateTareCapacities(150, { value: 25, type: 'SUBTRACTIVE' });
assert.strictEqual(tareSub.maxNet, 125);
assert.strictEqual(tareSub.maxGross, 150);
console.log('✓ Client Subtractive tare capacity check passed');

const tareAdd = calculateTareCapacities(150, { value: 25, type: 'ADDITIVE' });
assert.strictEqual(tareAdd.maxNet, 150);
assert.strictEqual(tareAdd.maxGross, 175);
console.log('✓ Client Additive tare capacity check passed');

// 3. Boundary Load Generator
const boundaryPoints = generateBoundaryLoadPoints({
  accuracyClass: 'CLASS_III',
  maxCapacity: 60,
  verificationInterval: 0.02,
  minCapacity: 0.4,
});
assert(boundaryPoints.length >= 5);
assert(boundaryPoints.some(p => p.stepType === 'STEP_500E' && p.nominalLoad === 10)); // 500 * 0.02 = 10
assert(boundaryPoints.some(p => p.stepType === 'STEP_2000E' && p.nominalLoad === 40)); // 2000 * 0.02 = 40
console.log('✓ Client Boundary step points check passed');

// 4. Uncertainty Budget
const budget = computeExpandedUncertainty(0.001, 0.005, 50, 'CLASS_III', {
  eccError: 0.002,
  eccLoad: 20,
  tempVariation: 1.5,
  coverageFactor: 2,
});
assert(budget.expandedUncertainty > 0);
assert(budget.standardUncertainty > 0);
assert.strictEqual(budget.coverageFactor, 2);
assert(budget.components.resolution > 0);
console.log('✓ Client ISO GUM Expanded Uncertainty budget check passed');

// 5. Calibration Uncertainty Curve
const curve = computeCalibrationUncertaintyCurve([10, 20, 30, 40, 50], { maxCapacity: 50, verificationInterval: 0.01 });
assert.strictEqual(curve.length, 5);
assert(curve.every(p => p.expandedUncertainty > 0));
console.log('✓ Client Calibration uncertainty curve check passed');

console.log('\n=== ALL CLIENT-SIDE TESTS PASSED PERFECTLY! ===\n');
