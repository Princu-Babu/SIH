import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiFileText,
  FiCpu,
  FiCalendar,
  FiThermometer,
  FiDroplet,
  FiCheckSquare,
  FiLock,
} from 'react-icons/fi';

import apiClient from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

export default function TestSessionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isInspector } = useAuth();

  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  // Fetch test session details
  const { data: session, isLoading } = useQuery({
    queryKey: ['test-session', id],
    queryFn: async () => {
      const res = await apiClient.get(`/tests/${id}`);
      const raw = res.data?.data || res.data;
      return {
        ...raw,
        certificateNumber: raw.certificateNo || raw.certificateNumber,
        ambientTemp: raw.temperature ?? raw.ambientTemp,
        relativeHumidity: raw.humidity ?? raw.relativeHumidity,
        testDate: raw.startedAt || raw.createdAt || raw.testDate,
        overallVerdict: raw.overallResult || raw.overallVerdict,
        inspector: raw.conductedBy || raw.inspector,
        testRuns: raw.testResults?.map((r) => ({
          testType: r.testType,
          verdict: r.result || r.verdict || 'PENDING',
          pointsCount: Array.isArray(r.data?.points) ? r.data.points.length : Array.isArray(r.data) ? r.data.length : (r.data ? 1 : 0),
          data: r.data,
          calculations: r.calculations,
        })) || raw.testRuns || [],
      };
    },
  });

  // Finalize Session Mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/tests/${id}/finalize`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('tests.testFinalized', 'Test session finalized successfully.'));
      queryClient.invalidateQueries(['test-session', id]);
      setIsFinalizeModalOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to finalize session';
      toast.error(msg);
      setIsFinalizeModalOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12">
        <LoadingSpinner message="Loading test session details..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-600">
        Test session not found.
      </div>
    );
  }

  const testDefinitions = [
    {
      type: 'WEIGHING_PERFORMANCE',
      title: t('testTypes.weighingPerformance', 'Weighing Performance Test'),
      desc: t('testTypes.weighingDesc', 'Evaluate error across full range (increasing/decreasing loads) per OIML R-76 §A.4.4'),
      rule: 'Ec = (I + 0.5e - ΔL) - L - E0 ≤ |MPE|',
    },
    {
      type: 'REPEATABILITY',
      title: t('testTypes.repeatability', 'Repeatability Test'),
      desc: t('testTypes.repeatabilityDesc', 'Verify consistency over multiple loadings at 50% and 100% Max per OIML R-76 §A.4.10'),
      rule: 'ΔP = Pmax - Pmin ≤ |MPE|',
    },
    {
      type: 'ECCENTRICITY',
      title: t('testTypes.eccentricity', 'Eccentricity (Off-Center) Test'),
      desc: t('testTypes.eccentricityDesc', 'Test 5 off-center loading points at 1/3 Max per OIML R-76 §A.4.7'),
      rule: 'Epos - Ecenter ≤ |MPE|',
    },
    {
      type: 'TEMPERATURE',
      title: t('testTypes.temperature', 'Temperature Effects Test'),
      desc: t('testTypes.temperatureDesc', 'Verify temperature compensation stability across operating span per OIML R-76 §A.5.3'),
      rule: 'Zero drift ≤ 1e / 5°C',
    },
    {
      type: 'STABILITY',
      title: t('testTypes.stability', 'Stability & Warm-up Test'),
      desc: t('testTypes.stabilityDesc', 'Assess zero and span stability over time under constant load per OIML R-76 §A.4.11'),
      rule: 'Drift ≤ |MPE| over time',
    },
    {
      type: 'TIME_DEPENDENCE',
      title: t('testTypes.timeDependence', 'Time Dependence (Creep) Test'),
      desc: t('testTypes.timeDependenceDesc', 'Evaluate creep over 30 min and zero return after removal per OIML R-76 §A.4.8'),
      rule: 'Δ(15-30m) ≤ 0.2|MPE|, Zero return ≤ 0.5e',
    },
  ];

  // Helper to lookup test run state
  const getRunState = (testType) => {
    const run = session.testRuns?.find((r) => r.testType === testType);
    return {
      verdict: run?.verdict || 'PENDING',
      pointsCount: run?.pointsCount || (run?.testPoints?.length || 0),
    };
  };

  const isCompleted = session.status === 'COMPLETED' || session.status === 'APPROVED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('tests.detailTitle', 'Test Session')} : ${session.certificateNumber}`}
        subtitle={`Instrument: ${session.instrument?.model || 'NAWI'} (S/N: ${session.instrument?.serialNumber || 'N/A'})`}
        actions={
          <div className="flex items-center gap-2">
            {isCompleted && (
              <button
                type="button"
                onClick={() => navigate(`/reports/${session.id}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1e3a5f] rounded shadow-sm hover:bg-[#1e2d4a] transition-colors"
              >
                <FiFileText className="w-3.5 h-3.5" />
                <span>{t('tests.generateCert', 'View Reports & PDF')}</span>
              </button>
            )}

            {!isCompleted && isInspector && (
              <button
                type="button"
                onClick={() => setIsFinalizeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-green-700 rounded shadow-sm hover:bg-green-800 transition-colors"
              >
                <FiCheckSquare className="w-3.5 h-3.5" />
                <span>{t('tests.finalizeSession', 'Finalize Test Session')}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Header Info Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-50 text-primary-700 rounded-lg">
              <FiCheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-[#1e3a5f] font-mono">
                  {session.certificateNumber}
                </span>
                <StatusBadge status={session.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Conducted by: <span className="font-semibold text-slate-800">{session.inspector?.name || 'Officer'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Overall Verdict</span>
              <StatusBadge status={session.overallVerdict} size="md" />
            </div>
          </div>
        </div>

        {/* Environmental & Instrument Info Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <span className="text-slate-500 block flex items-center gap-1">
              <FiThermometer className="text-primary-600" /> Ambient Temp
            </span>
            <span className="text-sm font-bold text-slate-800">{session.ambientTemp} °C</span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <span className="text-slate-500 block flex items-center gap-1">
              <FiDroplet className="text-primary-600" /> Relative Humidity
            </span>
            <span className="text-sm font-bold text-slate-800">{session.relativeHumidity} %</span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <span className="text-slate-500 block">Atmospheric Pressure</span>
            <span className="text-sm font-bold text-slate-800">{session.atmosphericPressure} hPa</span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <span className="text-slate-500 block flex items-center gap-1">
              <FiCalendar className="text-primary-600" /> Test Date
            </span>
            <span className="text-sm font-bold text-slate-800">
              {session.testDate ? new Date(session.testDate).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>

        {session.remarks && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Remarks:</span> {session.remarks}
          </div>
        )}
      </div>

      {/* Test Progress 6-Card Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {t('tests.testProgress', 'OIML R-76 Test Verification Modules')}
          </h2>
          <span className="text-xs text-slate-500">
            Click any module below to record or inspect calibration points
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testDefinitions.map((test, index) => {
            const state = getRunState(test.type);

            return (
              <div
                key={test.type}
                onClick={() => navigate(`/tests/${session.id}/${test.type}`)}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-primary-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                      Module {index + 1}
                    </span>
                    <StatusBadge status={state.verdict} size="xs" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{test.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {state.pointsCount > 0
                      ? `${state.pointsCount} ${t('tests.pointsRecorded', 'points recorded')}`
                      : 'Pending data'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary-700">
                    <span>Enter Data</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isFinalizeModalOpen}
        title={t('tests.finalizeSession', 'Finalize Test Session')}
        message={t(
          'tests.finalizeConfirm',
          'Are you sure you want to finalize this test session? Once finalized, results cannot be altered and the official certificate hash will be generated.'
        )}
        confirmText="Finalize & Sign"
        cancelText={t('common.cancel', 'Cancel')}
        isLoading={finalizeMutation.isPending}
        onConfirm={() => finalizeMutation.mutate()}
        onCancel={() => setIsFinalizeModalOpen(false)}
      />
    </div>
  );
}
