import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  FiCpu,
  FiClock,
  FiCheckCircle,
  FiAlertOctagon,
  FiPlus,
  FiFileText,
  FiArrowRight,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import apiClient from '../hooks/useApi';
import PageHeader from '../components/shared/PageHeader';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';

// Short, officer-legible names for the OIML R-76 test modules.
const MODULE_LABELS = {
  WEIGHING_PERFORMANCE: 'Weighing Performance',
  REPEATABILITY: 'Repeatability',
  ECCENTRICITY: 'Eccentricity',
  DISCRIMINATION: 'Discrimination',
  TARE: 'Tare Device',
  ZERO_SETTING: 'Zero-Setting',
  WARM_UP: 'Warm-Up Time',
  TILTING: 'Tilting',
};

const formatModuleName = (value) =>
  String(value || 'Unspecified')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/**
 * Never render a placeholder figure that could be mistaken for a real one.
 * Until the API answers, a KPI shows an em dash rather than an invented number.
 */
const metric = (loading, value) => (loading ? '—' : value ?? 0);

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch Dashboard KPIs
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      const stats = res.data?.stats || res.data?.data || res.data;
      return {
        totalInstruments: stats.totalInstruments ?? 0,
        pendingTests: stats.inProgressTests ?? stats.pendingTests ?? 0,
        completedTests: stats.completedTests ?? 0,
        failedTests: stats.failedTests ?? 0,
        complianceRate: stats.passRate ?? stats.complianceRate ?? 0,
        testsByModule: Array.isArray(stats.testsByModule) ? stats.testsByModule : [],
      };
    },
  });

  // Fetch Recent Test Sessions
  const { data: recentSessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/recent');
      // `recentSessions` is the key this API actually returns; the other shapes
      // are tolerated for older/proxied deployments.
      const raw =
        res.data?.recentSessions ||
        res.data?.data?.recentSessions ||
        res.data?.data ||
        res.data?.sessions ||
        (Array.isArray(res.data) ? res.data : []);
      return (Array.isArray(raw) ? raw : []).map((s) => ({
        ...s,
        certificateNumber: s.certificateNo || s.certificateNumber,
        testDate: s.startedAt || s.createdAt || s.testDate,
        overallVerdict: s.overallResult || s.overallVerdict || 'PENDING',
        inspector: s.conductedBy || s.inspector,
      }));
    },
  });

  // Month-by-month compliance, aggregated server-side over a real 6-month
  // window rather than inferred from whatever sessions happen to be recent.
  const { data: trendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/trends?months=6');
      return {
        trends: Array.isArray(res.data?.trends) ? res.data.trends : [],
        totals: res.data?.totals || null,
        months: res.data?.months ?? 6,
      };
    },
  });

  const monthlyData = trendsData?.trends ?? [];
  const avgPassRate = trendsData?.totals?.passRate;

  // Genuine OIML R-76 module execution counts.
  const testDistributionData = useMemo(() => {
    const palette = ['#2563eb', '#0d9488', '#FF9933', '#138808', '#7c3aed', '#dc2626'];
    return (statsData?.testsByModule ?? [])
      .filter((m) => (m.count || 0) > 0)
      .map((m, i) => ({
        name: MODULE_LABELS[m.testType] || formatModuleName(m.testType),
        value: m.count,
        color: palette[i % palette.length],
      }));
  }, [statsData]);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <PageHeader
        title={t('dashboard.title', 'Executive Dashboard')}
        subtitle={t('dashboard.subtitle', 'Overview of metrological testing operations and compliance metrics')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/instruments/new')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>{t('dashboard.registerInstrument', 'Register Instrument')}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/tests/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-primary-600 rounded shadow-sm hover:bg-primary-700 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>{t('dashboard.newTestSession', 'New Test Session')}</span>
            </button>
          </div>
        }
      />

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalInstruments', 'Total Instruments')}
          value={metric(isStatsLoading, statsData?.totalInstruments)}
          icon={FiCpu}
          color="blue"
          subtitle={`${t('dashboard.activeInstruments', 'Active in Registry')}`}
        />
        <StatCard
          title={t('dashboard.pendingTests', 'Pending Tests')}
          value={metric(isStatsLoading, statsData?.pendingTests)}
          icon={FiClock}
          color="yellow"
          subtitle="Verification In Progress"
        />
        <StatCard
          title={t('dashboard.completedTests', 'Completed Tests')}
          value={metric(isStatsLoading, statsData?.completedTests)}
          icon={FiCheckCircle}
          color="green"
          subtitle={
            isStatsLoading
              ? t('common.loading', 'Loading…')
              : `${statsData?.complianceRate ?? 0}% ${t('dashboard.passRate', 'Pass Rate')}`
          }
        />
        <StatCard
          title={t('dashboard.failedTests', 'Failed Tests')}
          value={metric(isStatsLoading, statsData?.failedTests)}
          icon={FiAlertOctagon}
          color="red"
          subtitle="OIML R-76 Tolerance Exceeded"
        />
      </div>

      {/* 2 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('dashboard.complianceRate', 'Monthly Compliance & Verification Rate')}
              </h2>
              <p className="text-xs text-slate-500">
                Concluded verifications over the last {trendsData?.months ?? 6} months
              </p>
            </div>
            {avgPassRate === null || avgPassRate === undefined ? (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {isTrendsLoading ? 'Loading…' : 'No data'}
              </span>
            ) : (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  avgPassRate >= 90
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : avgPassRate >= 70
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-red-700 bg-red-50 border-red-200'
                }`}
              >
                {avgPassRate}% Avg Pass
              </span>
            )}
          </div>

          <div className="h-64 w-full min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={monthlyData} key={JSON.stringify(monthlyData)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="passed" name="Passed (Compliant)" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name="Failed (Out of Spec)" fill="#dc2626" radius={[3, 3, 0, 0]} />
                <Bar dataKey="inProgress" name="Still In Progress" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tests by Category Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('dashboard.testDistribution', 'Tests Conducted by Category')}
              </h2>
              <p className="text-xs text-slate-500">
                Individual OIML R-76 test modules executed across all sessions
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {testDistributionData.length} {testDistributionData.length === 1 ? 'Module' : 'Modules'}
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center min-h-[256px]">
            {testDistributionData.length === 0 ? (
              <p className="text-xs text-slate-500">
                {isStatsLoading ? 'Loading…' : 'No test modules recorded yet.'}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <PieChart>
                  <Pie
                    data={testDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {testDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} test${value === 1 ? '' : 's'}`, name]}
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table & Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {t('dashboard.recentActivity', 'Recent Test Sessions')}
            </h2>
            <p className="text-xs text-slate-500">Latest Legal Metrology inspections conducted in the field</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/tests')}
            className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            <span>{t('dashboard.viewAll', 'View All')}</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isSessionsLoading ? (
          <div className="p-8">
            <LoadingSpinner message="Loading recent test sessions..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Certificate No</th>
                  <th className="px-4 py-3">Instrument</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verdict</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Conducted By</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSessions?.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-primary-700 text-xs">
                      {session.certificateNumber}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-slate-900">
                        {session.instrument?.model || 'NAWI Standard'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        S/N: {session.instrument?.serialNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={session.status} size="xs" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={session.overallVerdict} size="xs" />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {session.testDate ? new Date(session.testDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                      {session.inspector?.name || 'Officer'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => navigate(`/tests/${session.id}`)}
                        className="text-primary-600 hover:text-primary-800 font-bold px-2 py-1 bg-primary-50 rounded border border-primary-200"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {(!recentSessions || recentSessions.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8">
                      <EmptyState
                        icon={FiCheckCircle}
                        title={t('dashboard.noSessions', 'No test sessions found')}
                        description={t('dashboard.noSessionsDesc', 'No inspection runs recorded yet. Start your first metrological verification test session.')}
                        action={
                          <button
                            type="button"
                            onClick={() => navigate('/tests/new')}
                            className="px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors shadow-sm"
                          >
                            + New Test Session
                          </button>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
