import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FiSave,
  FiArrowLeft,
  FiCheckCircle,
  FiInfo,
  FiLayers,
} from 'react-icons/fi';

import apiClient from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import {
  calculateMpe,
  calculateContinuousIndication,
  calculateCorrectedError,
  roundTo,
} from '../../utils/metrology';

export default function TestDataEntryPage() {
  const { t } = useTranslation();
  const { id: sessionId, testType } = useParams();
  const navigate = useNavigate();

  // Normalize testType string
  const normalizedTestType = (testType || 'WEIGHING_PERFORMANCE').toUpperCase();

  // Fetch session and instrument info
  const { data: session, isLoading } = useQuery({
    queryKey: ['test-session', sessionId],
    queryFn: async () => {
      const res = await apiClient.get(`/tests/${sessionId}`);
      const raw = res.data?.data || res.data;
      return {
        ...raw,
        certificateNumber: raw.certificateNo || raw.certificateNumber,
        instrument: raw.instrument ? {
          ...raw.instrument,
          verificationScaleInterval_e: raw.instrument.verificationInterval ?? raw.instrument.verificationScaleInterval_e,
          actualScaleInterval_d: raw.instrument.actualInterval ?? raw.instrument.actualScaleInterval_d,
        } : null,
      };
    },
  });

  const instrument = session?.instrument || {
    accuracyClass: 'CLASS_III',
    maxCapacity: 150,
    minCapacity: 1,
    verificationScaleInterval_e: 0.05,
    unit: 'kg',
    verificationType: 'INITIAL',
  };

  const isInitial = instrument.verificationType !== 'IN_SERVICE';

  // -------------------------------------------------------------
  // STATE FOR TEST MODULES
  // -------------------------------------------------------------

  // 1. Weighing Performance state (6 standard load points: 0, 20%, 40%, 60%, 80%, 100% of Max)
  const [weighingPoints, setWeighingPoints] = useState([]);

  // 2. Repeatability state (50% Max and 100% Max with 6 readings each)
  const [repeatabilityHalf, setRepeatabilityHalf] = useState([
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
  ]);
  const [repeatabilityFull, setRepeatabilityFull] = useState([
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
    { reading: '', deltaL: 0 },
  ]);

  // 3. Eccentricity state (5 positions: Center, Top-Left, Top-Right, Bottom-Right, Bottom-Left)
  const [eccentricityPoints, setEccentricityPoints] = useState([
    { position: 'Center (Pos 1)', reading: '', deltaL: 0 },
    { position: 'Top-Left / Front-Left (Pos 2)', reading: '', deltaL: 0 },
    { position: 'Top-Right / Front-Right (Pos 3)', reading: '', deltaL: 0 },
    { position: 'Bottom-Right / Back-Right (Pos 4)', reading: '', deltaL: 0 },
    { position: 'Bottom-Left / Back-Left (Pos 5)', reading: '', deltaL: 0 },
  ]);

  // 4. Temperature state (3 temperatures: Reference 20°C, Upper 40°C, Lower 10°C)
  const [temperaturePoints, setTemperaturePoints] = useState([
    { temp: 20, zeroReading: '', spanReading: '' },
    { temp: 40, zeroReading: '', spanReading: '' },
    { temp: 10, zeroReading: '', spanReading: '' },
  ]);

  // 5. Stability & Warm-up state (0, 0.5, 1, 2, 4, 8 hours)
  const [stabilityPoints, setStabilityPoints] = useState([
    { timeHrs: 0, reading: '' },
    { timeHrs: 0.5, reading: '' },
    { timeHrs: 1.0, reading: '' },
    { timeHrs: 2.0, reading: '' },
    { timeHrs: 4.0, reading: '' },
    { timeHrs: 8.0, reading: '' },
  ]);

  // 6. Time Dependence (Creep at 0, 5, 10, 15, 20, 25, 30 min + Zero return)
  const [creepPoints, setCreepPoints] = useState([
    { min: 0, reading: '' },
    { min: 5, reading: '' },
    { min: 10, reading: '' },
    { min: 15, reading: '' },
    { min: 20, reading: '' },
    { min: 25, reading: '' },
    { min: 30, reading: '' },
  ]);
  const [zeroReturnReading, setZeroReturnReading] = useState('');

  // Pre-fill initial points when instrument is loaded
  useEffect(() => {
    if (instrument && instrument.maxCapacity) {
      const max = Number(instrument.maxCapacity);
      const points = [
        { percent: 0, load: 0, incReading: 0, decReading: 0 },
        { percent: 20, load: roundTo(max * 0.2, 4), incReading: roundTo(max * 0.2, 4), decReading: roundTo(max * 0.2, 4) },
        { percent: 40, load: roundTo(max * 0.4, 4), incReading: roundTo(max * 0.4, 4), decReading: roundTo(max * 0.4, 4) },
        { percent: 60, load: roundTo(max * 0.6, 4), incReading: roundTo(max * 0.6, 4), decReading: roundTo(max * 0.6, 4) },
        { percent: 80, load: roundTo(max * 0.8, 4), incReading: roundTo(max * 0.8, 4), decReading: roundTo(max * 0.8, 4) },
        { percent: 100, load: max, incReading: max, decReading: max },
      ];
      setWeighingPoints(points);

      // Pre-fill default test values for demo convenience
      const halfLoad = roundTo(max * 0.5, 4);
      setRepeatabilityHalf((prev) => prev.map((p) => ({ ...p, reading: p.reading || halfLoad })));
      setRepeatabilityFull((prev) => prev.map((p) => ({ ...p, reading: p.reading || max })));

      const eccLoad = roundTo(max / 3, 4);
      setEccentricityPoints((prev) => prev.map((p) => ({ ...p, reading: p.reading || eccLoad })));
      setTemperaturePoints([
        { temp: 20, zeroReading: 0, spanReading: max },
        { temp: 40, zeroReading: 0.0001, spanReading: max },
        { temp: 10, zeroReading: -0.0001, spanReading: max },
      ]);
      setStabilityPoints((prev) => prev.map((p) => ({ ...p, reading: p.reading || max })));
      setCreepPoints((prev) => prev.map((p) => ({ ...p, reading: p.reading || max })));
      setZeroReturnReading(0);
    }
  }, [instrument]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ isComplete }) => {
      let payloadData = {};
      if (normalizedTestType === 'WEIGHING_PERFORMANCE' || normalizedTestType === 'WEIGHING') {
        payloadData = {
          points: weighingPoints.flatMap((pt) => [
            { appliedLoad: Number(pt.load), indicatedValue: Number(pt.incReading), isIncreasing: true },
            { appliedLoad: Number(pt.load), indicatedValue: Number(pt.decReading), isIncreasing: false },
          ]),
        };
      } else if (normalizedTestType === 'REPEATABILITY') {
        payloadData = {
          series: [
            { load: roundTo(Number(instrument.maxCapacity) * 0.5, 4), readings: repeatabilityHalf.map((p) => Number(p.reading) || 0) },
            { load: Number(instrument.maxCapacity), readings: repeatabilityFull.map((p) => Number(p.reading) || 0) },
          ],
        };
      } else if (normalizedTestType === 'ECCENTRICITY') {
        const eccLoad = roundTo(Number(instrument.maxCapacity) / 3, 4);
        payloadData = {
          positions: eccentricityPoints.map((pt, idx) => ({
            position: idx === 0 ? 'CENTER' : `POS_${idx + 1}`,
            appliedLoad: eccLoad,
            indicatedValue: Number(pt.reading) || eccLoad,
          })),
        };
      } else if (normalizedTestType === 'TEMPERATURE' || normalizedTestType === 'TEMPERATURE_EFFECTS') {
        payloadData = {
          temperaturePoints: temperaturePoints.map((pt) => ({
            temperature: Number(pt.temp),
            zeroIndication: Number(pt.zeroReading) || 0,
            spanLoad: Number(instrument.maxCapacity),
            spanIndication: Number(pt.spanReading) || Number(instrument.maxCapacity),
          })),
        };
      } else if (normalizedTestType === 'STABILITY') {
        payloadData = {
          timePoints: stabilityPoints.map((pt) => ({
            timestampMinutes: Number(pt.timeHrs) * 60,
            zeroReading: 0,
            loadReading: Number(pt.reading) || Number(instrument.maxCapacity),
            appliedLoad: Number(instrument.maxCapacity),
          })),
        };
      } else if (normalizedTestType === 'TIME_DEPENDENCE') {
        payloadData = {
          testLoad: Number(instrument.maxCapacity),
          creepReadings: creepPoints.map((pt) => ({
            minute: Number(pt.min),
            indication: Number(pt.reading) || Number(instrument.maxCapacity),
          })),
          zeroReturn: {
            appliedLoad: Number(instrument.maxCapacity),
            indicationAfterUnload: Number(zeroReturnReading) || 0,
          },
        };
      }

      const payload = {
        testType: normalizedTestType === 'WEIGHING' ? 'WEIGHING_PERFORMANCE' : normalizedTestType === 'TEMPERATURE_EFFECTS' ? 'TEMPERATURE' : normalizedTestType,
        data: payloadData,
      };

      const res = await apiClient.post(`/tests/${sessionId}/results`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('tests.testSaved', 'Test module data evaluated and saved successfully.'));
      navigate(`/tests/${sessionId}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Error saving test data';
      toast.error(msg);
    },
  });

  // -------------------------------------------------------------
  // REAL-TIME COMPUTATIONS FOR EACH TEST TYPE
  // -------------------------------------------------------------

  // 1. Weighing computations
  const weighingCalculations = useMemo(() => {
    return weighingPoints.map((pt) => {
      const mpe = calculateMpe(pt.load, instrument.verificationScaleInterval_e, instrument.accuracyClass, isInitial);
      const incError = roundTo(Number(pt.incReading) - Number(pt.load), 5);
      const decError = roundTo(Number(pt.decReading) - Number(pt.load), 5);
      const incPass = Math.abs(incError) <= mpe;
      const decPass = Math.abs(decError) <= mpe;
      return {
        ...pt,
        mpe,
        incError,
        decError,
        isPass: incPass && decPass,
      };
    });
  }, [weighingPoints, instrument, isInitial]);

  // 2. Repeatability computations
  const repeatabilityCalculations = useMemo(() => {
    const halfLoad = roundTo(instrument.maxCapacity * 0.5, 4);
    const fullLoad = Number(instrument.maxCapacity);
    const mpeHalf = calculateMpe(halfLoad, instrument.verificationScaleInterval_e, instrument.accuracyClass, isInitial);
    const mpeFull = calculateMpe(fullLoad, instrument.verificationScaleInterval_e, instrument.accuracyClass, isInitial);

    const halfReadings = repeatabilityHalf.map((p) => Number(p.reading) || 0).filter((v) => v > 0);
    const fullReadings = repeatabilityFull.map((p) => Number(p.reading) || 0).filter((v) => v > 0);

    const halfRange = halfReadings.length > 0 ? roundTo(Math.max(...halfReadings) - Math.min(...halfReadings), 5) : 0;
    const fullRange = fullReadings.length > 0 ? roundTo(Math.max(...fullReadings) - Math.min(...fullReadings), 5) : 0;

    return {
      halfLoad,
      fullLoad,
      mpeHalf,
      mpeFull,
      halfRange,
      fullRange,
      halfPass: halfRange <= mpeHalf,
      fullPass: fullRange <= mpeFull,
    };
  }, [repeatabilityHalf, repeatabilityFull, instrument, isInitial]);

  // 3. Eccentricity computations
  const eccentricityCalculations = useMemo(() => {
    const testLoad = roundTo(instrument.maxCapacity / 3, 4);
    const mpe = calculateMpe(testLoad, instrument.verificationScaleInterval_e, instrument.accuracyClass, isInitial);
    const centerReading = Number(eccentricityPoints[0]?.reading) || testLoad;

    const evaluated = eccentricityPoints.map((pt) => {
      const read = Number(pt.reading) || 0;
      const diffFromCenter = roundTo(read - centerReading, 5);
      const isPass = Math.abs(diffFromCenter) <= mpe;
      return { ...pt, diffFromCenter, mpe, isPass };
    });

    const overallPass = evaluated.every((p) => p.isPass);
    return { testLoad, mpe, evaluated, overallPass };
  }, [eccentricityPoints, instrument, isInitial]);

  // 4. Temperature computations
  const temperatureCalculations = useMemo(() => {
    const max = Number(instrument.maxCapacity);
    const mpe = calculateMpe(max, instrument.verificationScaleInterval_e, instrument.accuracyClass, isInitial);
    const evaluated = temperaturePoints.map((pt) => {
      const spanErr = roundTo(Number(pt.spanReading) - max, 5);
      const zeroErr = roundTo(Number(pt.zeroReading), 5);
      const isPass = Math.abs(spanErr) <= mpe && Math.abs(zeroErr) <= Number(instrument.verificationScaleInterval_e);
      return { ...pt, spanErr, zeroErr, mpe, isPass };
    });
    const overallPass = evaluated.every((p) => p.isPass);
    return { evaluated, overallPass };
  }, [temperaturePoints, instrument, isInitial]);

  // 5. Stability computations
  const stabilityCalculations = useMemo(() => {
    const max = Number(instrument.maxCapacity);
    const mpe = calculateMpe(max, instrument.verificationScaleInterval_e, instrument.accuracyClass, isInitial);
    const baseReading = Number(stabilityPoints[0]?.reading) || max;

    const evaluated = stabilityPoints.map((pt) => {
      const read = Number(pt.reading) || 0;
      const drift = roundTo(read - baseReading, 5);
      const isPass = Math.abs(drift) <= mpe;
      return { ...pt, drift, mpe, isPass };
    });
    const overallPass = evaluated.every((p) => p.isPass);
    return { evaluated, overallPass };
  }, [stabilityPoints, instrument, isInitial]);

  // 6. Time Dependence (Creep) computations
  const creepCalculations = useMemo(() => {
    const max = Number(instrument.maxCapacity);
    const mpe = calculateMpe(max, instrument.verificationScaleInterval_e, instrument.accuracyClass, isInitial);
    const read15 = Number(creepPoints.find((p) => p.min === 15)?.reading) || max;
    const read30 = Number(creepPoints.find((p) => p.min === 30)?.reading) || max;
    const creepDelta = roundTo(Math.abs(read30 - read15), 5);
    const creepLimit = roundTo(0.2 * mpe, 5);
    const creepPass = creepDelta <= creepLimit;

    const zeroReturnErr = roundTo(Math.abs(Number(zeroReturnReading)), 5);
    const zeroLimit = roundTo(0.5 * Number(instrument.verificationScaleInterval_e), 5);
    const zeroPass = zeroReturnErr <= zeroLimit;

    return {
      creepDelta,
      creepLimit,
      creepPass,
      zeroReturnErr,
      zeroLimit,
      zeroPass,
      overallPass: creepPass && zeroPass,
    };
  }, [creepPoints, zeroReturnReading, instrument, isInitial]);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12">
        <LoadingSpinner message="Loading verification parameters..." />
      </div>
    );
  }

  // Titles mapping
  const titleMap = {
    WEIGHING_PERFORMANCE: t('testTypes.weighingPerformance', 'Weighing Performance Test'),
    WEIGHING: t('testTypes.weighingPerformance', 'Weighing Performance Test'),
    REPEATABILITY: t('testTypes.repeatability', 'Repeatability Test'),
    ECCENTRICITY: t('testTypes.eccentricity', 'Eccentricity (Off-Center) Test'),
    TEMPERATURE: t('testTypes.temperature', 'Temperature Effects Test'),
    TEMPERATURE_EFFECTS: t('testTypes.temperature', 'Temperature Effects Test'),
    STABILITY: t('testTypes.stability', 'Stability & Warm-up Test'),
    TIME_DEPENDENCE: t('testTypes.timeDependence', 'Time Dependence (Creep) Test'),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={titleMap[normalizedTestType] || 'Test Data Entry'}
        subtitle={`Session: ${session?.certificateNumber} | Instrument: ${instrument.model} (${instrument.accuracyClass}, Max: ${instrument.maxCapacity} ${instrument.unit})`}
        actions={
          <button
            type="button"
            onClick={() => navigate(`/tests/${sessionId}`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Session</span>
          </button>
        }
      />

      {/* Metrological Reference Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 text-primary-700 rounded">
            <FiLayers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">
              {instrument.model} (S/N: {instrument.serialNumber || 'N/A'})
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Accuracy: {instrument.accuracyClass} | Max: {instrument.maxCapacity} {instrument.unit} | e: {instrument.verificationScaleInterval_e ?? instrument.verificationInterval} {instrument.unit}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Verification Mode</span>
            <span className="font-bold text-slate-800">
              {isInitial ? 'Initial (1x MPE)' : 'In-Service (2x MPE)'}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. WEIGHING PERFORMANCE FORM */}
      {/* ------------------------------------------------------------- */}
      {(normalizedTestType === 'WEIGHING_PERFORMANCE' || normalizedTestType === 'WEIGHING') && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Increasing & Decreasing Load Verification Table
              </h2>
              <p className="text-xs text-slate-500">
                OIML R-76 §A.4.4. Verify errors across range within Maximum Permissible Error (MPE) envelope.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Load Point (%)</th>
                  <th className="px-3 py-2.5">Applied Load (L) [{instrument.unit}]</th>
                  <th className="px-3 py-2.5">Indicated Inc. (I_inc)</th>
                  <th className="px-3 py-2.5">Error Inc. (E_inc)</th>
                  <th className="px-3 py-2.5">Indicated Dec. (I_dec)</th>
                  <th className="px-3 py-2.5">Error Dec. (E_dec)</th>
                  <th className="px-3 py-2.5">MPE (±)</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {weighingCalculations.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-sans font-semibold text-slate-800">
                      {row.percent}% Max
                    </td>
                    <td className="px-3 py-2.5 font-bold">{row.load}</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="any"
                        value={row.incReading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWeighingPoints((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, incReading: val } : p))
                          );
                        }}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 font-bold"
                      />
                    </td>
                    <td
                      className={`px-3 py-2.5 font-bold ${
                        Math.abs(row.incError) <= row.mpe ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {row.incError > 0 ? `+${row.incError}` : row.incError}
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="any"
                        value={row.decReading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWeighingPoints((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, decReading: val } : p))
                          );
                        }}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 font-bold"
                      />
                    </td>
                    <td
                      className={`px-3 py-2.5 font-bold ${
                        Math.abs(row.decError) <= row.mpe ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {row.decError > 0 ? `+${row.decError}` : row.decError}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">±{row.mpe}</td>
                    <td className="px-3 py-2.5 text-center font-sans">
                      <StatusBadge status={row.isPass ? 'PASS' : 'FAIL'} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. REPEATABILITY FORM */}
      {/* ------------------------------------------------------------- */}
      {normalizedTestType === 'REPEATABILITY' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Repeatability Verification (OIML R-76 §A.4.10)
            </h2>
            <p className="text-xs text-slate-500">
              Conduct at least 6 successive loadings at 50% and 100% of Max capacity. Maximum difference ΔP must not exceed |MPE|.
            </p>
          </div>

          {/* 50% Max Load Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">
                Series 1: 50% Max Load ({repeatabilityCalculations.halfLoad} {instrument.unit}) — MPE: ±{repeatabilityCalculations.mpeHalf}
              </h3>
              <StatusBadge status={repeatabilityCalculations.halfPass ? 'PASS' : 'FAIL'} size="xs" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {repeatabilityHalf.map((item, idx) => (
                <div key={idx}>
                  <label className="text-[10px] text-slate-500 block">Run #{idx + 1}</label>
                  <input
                    type="number"
                    step="any"
                    value={item.reading}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRepeatabilityHalf((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, reading: val } : p))
                      );
                    }}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="text-xs flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-600">
                Max Difference (ΔP): <strong className="font-mono">{repeatabilityCalculations.halfRange} {instrument.unit}</strong>
              </span>
              <span className="text-slate-500">Tolerance Limit: ≤ {repeatabilityCalculations.mpeHalf} {instrument.unit}</span>
            </div>
          </div>

          {/* 100% Max Load Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">
                Series 2: 100% Max Load ({repeatabilityCalculations.fullLoad} {instrument.unit}) — MPE: ±{repeatabilityCalculations.mpeFull}
              </h3>
              <StatusBadge status={repeatabilityCalculations.fullPass ? 'PASS' : 'FAIL'} size="xs" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {repeatabilityFull.map((item, idx) => (
                <div key={idx}>
                  <label className="text-[10px] text-slate-500 block">Run #{idx + 1}</label>
                  <input
                    type="number"
                    step="any"
                    value={item.reading}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRepeatabilityFull((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, reading: val } : p))
                      );
                    }}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="text-xs flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-600">
                Max Difference (ΔP): <strong className="font-mono">{repeatabilityCalculations.fullRange} {instrument.unit}</strong>
              </span>
              <span className="text-slate-500">Tolerance Limit: ≤ {repeatabilityCalculations.mpeFull} {instrument.unit}</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ECCENTRICITY FORM */}
      {/* ------------------------------------------------------------- */}
      {normalizedTestType === 'ECCENTRICITY' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Eccentricity (Off-Center Loading) Verification (OIML R-76 §A.4.7)
              </h2>
              <p className="text-xs text-slate-500">
                Applied Load: 1/3 Max = {eccentricityCalculations.testLoad} {instrument.unit} | MPE: ±{eccentricityCalculations.mpe} {instrument.unit}
              </p>
            </div>
            <StatusBadge status={eccentricityCalculations.overallPass ? 'PASS' : 'FAIL'} size="sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Platform Diagram Placeholder */}
            <div className="border border-slate-200 bg-slate-50 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                Platform Loading Diagram (5 Positions)
              </span>
              <div className="relative w-48 h-48 bg-white border-2 border-slate-300 rounded-lg shadow-inner flex items-center justify-center">
                <span className="absolute top-2 left-2 text-[10px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                  Pos 2 (TL)
                </span>
                <span className="absolute top-2 right-2 text-[10px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                  Pos 3 (TR)
                </span>
                <span className="text-xs font-bold text-white bg-primary-600 px-2.5 py-1 rounded-full shadow-sm">
                  Pos 1 (Center)
                </span>
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                  Pos 5 (BL)
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                  Pos 4 (BR)
                </span>
              </div>
            </div>

            {/* Position Inputs Table */}
            <div className="space-y-3">
              {eccentricityCalculations.evaluated.map((pt, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{pt.position}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Diff from Center: {pt.diffFromCenter > 0 ? `+${pt.diffFromCenter}` : pt.diffFromCenter} {instrument.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="any"
                      value={pt.reading}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEccentricityPoints((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, reading: val } : p))
                        );
                      }}
                      className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                    <StatusBadge status={pt.isPass ? 'PASS' : 'FAIL'} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. TEMPERATURE FORM */}
      {/* ------------------------------------------------------------- */}
      {(normalizedTestType === 'TEMPERATURE' || normalizedTestType === 'TEMPERATURE_EFFECTS') && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Temperature Effects & Zero Drift Verification (OIML R-76 §A.5.3)
              </h2>
              <p className="text-xs text-slate-500">
                Tested across operating temperatures. Zero drift must not exceed 1e per 5°C change.
              </p>
            </div>
            <StatusBadge status={temperatureCalculations.overallPass ? 'PASS' : 'FAIL'} size="sm" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Temperature (°C)</th>
                  <th className="px-3 py-2.5">Zero Reading</th>
                  <th className="px-3 py-2.5">Zero Error</th>
                  <th className="px-3 py-2.5">Span Reading (Max)</th>
                  <th className="px-3 py-2.5">Span Error</th>
                  <th className="px-3 py-2.5">MPE (±)</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {temperatureCalculations.evaluated.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold font-sans">{row.temp}°C</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="any"
                        value={row.zeroReading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTemperaturePoints((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, zeroReading: val } : p))
                          );
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                      />
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-700">{row.zeroErr}</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="any"
                        value={row.spanReading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTemperaturePoints((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, spanReading: val } : p))
                          );
                        }}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                      />
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-700">{row.spanErr}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">±{row.mpe}</td>
                    <td className="px-3 py-2.5 text-center font-sans">
                      <StatusBadge status={row.isPass ? 'PASS' : 'FAIL'} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. STABILITY & WARM-UP FORM */}
      {/* ------------------------------------------------------------- */}
      {normalizedTestType === 'STABILITY' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Stability & Warm-up Verification (OIML R-76 §A.4.11)
              </h2>
              <p className="text-xs text-slate-500">
                Span stability under sustained continuous load over an 8-hour period.
              </p>
            </div>
            <StatusBadge status={stabilityCalculations.overallPass ? 'PASS' : 'FAIL'} size="sm" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Time Elapsed (Hours)</th>
                  <th className="px-3 py-2.5">Observed Reading [{instrument.unit}]</th>
                  <th className="px-3 py-2.5">Drift from Initial</th>
                  <th className="px-3 py-2.5">MPE (±)</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stabilityCalculations.evaluated.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold font-sans">{row.timeHrs} hrs</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="any"
                        value={row.reading}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStabilityPoints((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, reading: val } : p))
                          );
                        }}
                        className="w-28 px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                      />
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-700">{row.drift}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">±{row.mpe}</td>
                    <td className="px-3 py-2.5 text-center font-sans">
                      <StatusBadge status={row.isPass ? 'PASS' : 'FAIL'} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. TIME DEPENDENCE (CREEP) FORM */}
      {/* ------------------------------------------------------------- */}
      {normalizedTestType === 'TIME_DEPENDENCE' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Time Dependence (Creep & Zero Return) Verification (OIML R-76 §A.4.8)
              </h2>
              <p className="text-xs text-slate-500">
                Evaluate creep under Max load for 30 min and zero return reading within 0.5e after load removal.
              </p>
            </div>
            <StatusBadge status={creepCalculations.overallPass ? 'PASS' : 'FAIL'} size="sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creep Table */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Creep Test (Max Load)</h3>
                <StatusBadge status={creepCalculations.creepPass ? 'PASS' : 'FAIL'} size="xs" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {creepPoints.map((item, idx) => (
                  <div key={idx}>
                    <label className="text-[10px] text-slate-500 block">{item.min} min</label>
                    <input
                      type="number"
                      step="any"
                      value={item.reading}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreepPoints((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, reading: val } : p))
                        );
                      }}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="text-xs pt-2 border-t border-slate-200 text-slate-600">
                Δ(15m to 30m): <strong className="font-mono">{creepCalculations.creepDelta}</strong> | Tolerance Limit: ≤ {creepCalculations.creepLimit} {instrument.unit} (0.2|MPE|)
              </div>
            </div>

            {/* Zero Return Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900">Zero Return Error</h3>
                  <StatusBadge status={creepCalculations.zeroPass ? 'PASS' : 'FAIL'} size="xs" />
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Reading observed immediately after full load removal.
                </p>

                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Zero Return Indication [{instrument.unit}]
                </label>
                <input
                  type="number"
                  step="any"
                  value={zeroReturnReading}
                  onChange={(e) => setZeroReturnReading(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div className="text-xs pt-2 border-t border-slate-200 text-slate-600">
                Zero Error: <strong className="font-mono">{creepCalculations.zeroReturnErr}</strong> | Limit: ≤ {creepCalculations.zeroLimit} {instrument.unit} (0.5e)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save & Complete Action Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <FiInfo className="w-4 h-4 text-primary-600" />
          <span>Real-time mathematical validation active per OIML R-76 rules.</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => saveMutation.mutate({ isComplete: false })}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>{t('common.save', 'Save Progress')}</span>
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate({ isComplete: true })}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <FiCheckCircle className="w-3.5 h-3.5" />
            <span>{t('common.saveAndComplete', 'Save & Complete Module')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
