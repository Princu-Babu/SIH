/**
 * OIML R-76 Metrological Calculation Engine for Frontend
 * Compliant with OIML R 76-1:2006 (E)
 */

export const ACCURACY_CLASSES = {
  CLASS_I: {
    label: 'Class I (Special Accuracy / Special)',
    short: 'Class I',
    zone1: 50000,
    zone2: 200000,
  },
  CLASS_II: {
    label: 'Class II (High Accuracy / High)',
    short: 'Class II',
    zone1: 5000,
    zone2: 20000,
  },
  CLASS_III: {
    label: 'Class III (Medium Accuracy / Medium)',
    short: 'Class III',
    zone1: 500,
    zone2: 2000,
  },
  CLASS_IIII: {
    label: 'Class IIII (Ordinary Accuracy / Ordinary)',
    short: 'Class IIII',
    zone1: 50,
    zone2: 200,
  },
};

/**
 * Calculate Maximum Permissible Error (MPE) for a given load and instrument class
 * @param {number} load - Test load in same units as e
 * @param {number} e - Verification scale interval
 * @param {string} accuracyClass - 'CLASS_I' | 'CLASS_II' | 'CLASS_III' | 'CLASS_IIII'
 * @param {boolean} isInitialVerification - true for initial, false for in-service (2x)
 * @returns {number} MPE in scale interval units / mass units
 */
export function calculateMpe(load, e, accuracyClass = 'CLASS_III', isInitialVerification = true) {
  if (!e || e <= 0 || load === undefined || load === null) return 0;

  const m = Math.abs(Number(load)) / Number(e);
  let factor = 1.5;

  const limits = ACCURACY_CLASSES[accuracyClass] || ACCURACY_CLASSES.CLASS_III;

  if (m <= limits.zone1) {
    factor = 0.5;
  } else if (m <= limits.zone2) {
    factor = 1.0;
  } else {
    factor = 1.5;
  }

  const baseMpe = factor * Number(e);
  const multiplier = isInitialVerification ? 1.0 : 2.0;

  return roundTo(baseMpe * multiplier, 6);
}

/**
 * Calculate continuous indication P per OIML R-76 §A.4.4.3
 * P = I + 0.5e - ΔL
 */
export function calculateContinuousIndication(indicatedValue, e, deltaL = 0) {
  const I = Number(indicatedValue) || 0;
  const scaleE = Number(e) || 0;
  const dL = Number(deltaL) || 0;
  return roundTo(I + 0.5 * scaleE - dL, 6);
}

/**
 * Calculate error E and corrected error Ec
 * E = P - L
 * Ec = E - E0
 */
export function calculateCorrectedError(continuousIndication, nominalLoad, zeroErrorE0 = 0) {
  const P = Number(continuousIndication) || 0;
  const L = Number(nominalLoad) || 0;
  const E0 = Number(zeroErrorE0) || 0;

  const E = roundTo(P - L, 6);
  const Ec = roundTo(E - E0, 6);

  return { E, Ec };
}

/**
 * Format float numbers nicely to fixed decimal places or trimmed string
 */
export function roundTo(val, decimals = 4) {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((Number(val) + Number.EPSILON) * factor) / factor;
}

export function formatNumber(val, decimals = 2) {
  if (val === undefined || val === null || isNaN(val)) return '-';
  return Number(val).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
