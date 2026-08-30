import React from 'react';
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch Dashboard KPIs
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dashboard/stats');
        return res.data;
      } catch {
        // Fallback default statistics if API endpoint is still initializing
        return {
          totalInstruments: 24,
          pendingTests: 5,
          completedTests: 42,
          failedTests: 3,
          complianceRate: 93.3,
        };
      }
    },
  });

  // Fetch Recent Test Sessions
  const { data: recentSessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dashboard/recent');
        return Array.isArray(res.data) ? res.data : res.data.sessions || [];
      } catch {
        // Fallback sample records
        return [
          {
            id: 'demo-1',
            certificateNumber: 'NAWI-DL-2026-0001',
            instrument: { model: 'Radwag XA 220.4Y', serialNumber: 'RAD-2024-9981' },
            status: 'COMPLETED',
            overallVerdict: 'PASS',
            testDate: '2026-08-28T10:30:00Z',
            inspector: { name: 'Shri R. K. Sharma' },
          },
          {
            id: 'demo-2',
            certificateNumber: 'NAWI-DL-2026-0002',
            instrument: { model: 'Mettler Toledo ME204', serialNumber: 'MT-IND-4420' },
            status: 'COMPLETED',
            overallVerdict: 'PASS',
            testDate: '2026-08-26T14:15:00Z',
            inspector: { name: 'Dr. Anita Desai' },
          },
          {
            id: 'demo-3',
            certificateNumber: 'NAWI-DL-2026-0003',
            instrument: { model: 'Avery Weigh-Tronix Bridge', serialNumber: 'AW-60T-8812' },
            status: 'IN_PROGRESS',
            overallVerdict: 'PENDING',
            testDate: '2026-08-25T09:00:00Z',
            inspector: { name: 'Shri V. Murugan' },
          },
          {
            id: 'demo-4',
            certificateNumber: 'NAWI-DL-2026-0004',
            instrument: { model: 'Essae DS-215 Platform', serialNumber: 'ES-2023-1190' },
            status: 'COMPLETED',
            overallVerdict: 'FAIL',
            testDate: '2026-08-22T11:45:00Z',
            inspector: { name: 'Dr. Anita Desai' },
          },
        ];
      }
    },
  });

  // Monthly verification chart data
  const monthlyData = [
    { month: 'Mar', passed: 18, failed: 1 },
    { month: 'Apr', passed: 24, failed: 2 },
    { month: 'May', passed: 30, failed: 3 },
    { month: 'Jun', passed: 28, failed: 1 },
    { month: 'Jul', passed: 35, failed: 2 },
    { month: 'Aug', passed: 42, failed: 3 },
  ];

  // Test distribution pie chart data
  const testDistributionData = [
    { name: 'Weighing Perf.', value: 45, color: '#2563eb' },
    { name: 'Repeatability', value: 38, color: '#1d4ed8' },
    { name: 'Eccentricity', value: 34, color: '#FF9933' },
    { name: 'Temperature', value: 20, color: '#138808' },
    { name: 'Stability', value: 22, color: '#60a5fa' },
    { name: 'Time Dependence', value: 18, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
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
          value={statsData?.totalInstruments ?? 24}
          icon={FiCpu}
          color="blue"
          subtitle={`${t('dashboard.activeInstruments', 'Active in Registry')}`}
        />
        <StatCard
          title={t('dashboard.pendingTests', 'Pending Tests')}
          value={statsData?.pendingTests ?? 5}
          icon={FiClock}
          color="yellow"
          subtitle="Verification In Progress"
        />
        <StatCard
          title={t('dashboard.completedTests', 'Completed Tests')}
          value={statsData?.completedTests ?? 42}
          icon={FiCheckCircle}
          color="green"
          subtitle={`${statsData?.complianceRate || 93.3}% ${t('dashboard.passRate', 'Pass Rate')}`}
        />
        <StatCard
          title={t('dashboard.failedTests', 'Failed Tests')}
          value={statsData?.failedTests ?? 3}
          icon={FiAlertOctagon}
          color="red"
          subtitle="OIML R-76 Tolerance Exceeded"
        />
      </div>

      {/* 2 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('dashboard.complianceRate', 'Monthly Compliance & Verification Rate')}
              </h2>
              <p className="text-xs text-slate-500">Passed vs Failed sessions over the last 6 months</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              93.3% Avg Pass
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="passed" name="Passed (Compliant)" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name="Failed (Out of Spec)" fill="#dc2626" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tests by Category Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('dashboard.testDistribution', 'Tests Conducted by Category')}
              </h2>
              <p className="text-xs text-slate-500">Breakdown across 6 standard OIML R-76 modules</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              6 Test Modules
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
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
            <table className="w-full text-left text-sm text-slate-700">
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
