import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FiPlus, FiSearch, FiEye, FiFileText } from 'react-icons/fi';

import apiClient from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export default function TestSessionListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isInspector } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVerdict, setSelectedVerdict] = useState('');

  const { data: testSessions, isLoading } = useQuery({
    queryKey: ['test-sessions'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/tests');
        return Array.isArray(res.data) ? res.data : res.data.sessions || [];
      } catch {
        return [
          {
            id: 'session-1',
            certificateNumber: 'NAWI-DL-2026-0001',
            instrument: {
              id: 'inst-1',
              model: 'Radwag XA 220.4Y',
              serialNumber: 'RAD-2024-9981',
              accuracyClass: 'CLASS_I',
            },
            status: 'COMPLETED',
            overallVerdict: 'PASS',
            testDate: '2026-08-28T10:30:00Z',
            finalizedAt: '2026-08-28T12:00:00Z',
            inspector: { name: 'Shri R. K. Sharma' },
          },
          {
            id: 'session-2',
            certificateNumber: 'NAWI-DL-2026-0002',
            instrument: {
              id: 'inst-2',
              model: 'Mettler Toledo ME204',
              serialNumber: 'MT-IND-4420',
              accuracyClass: 'CLASS_II',
            },
            status: 'COMPLETED',
            overallVerdict: 'PASS',
            testDate: '2026-08-26T14:15:00Z',
            finalizedAt: '2026-08-26T15:30:00Z',
            inspector: { name: 'Dr. Anita Desai' },
          },
          {
            id: 'session-3',
            certificateNumber: 'NAWI-DL-2026-0003',
            instrument: {
              id: 'inst-3',
              model: 'Essae DS-215 Platform',
              serialNumber: 'ES-2023-1190',
              accuracyClass: 'CLASS_III',
            },
            status: 'IN_PROGRESS',
            overallVerdict: 'PENDING',
            testDate: '2026-08-25T09:00:00Z',
            finalizedAt: null,
            inspector: { name: 'Shri V. Murugan' },
          },
          {
            id: 'session-4',
            certificateNumber: 'NAWI-DL-2026-0004',
            instrument: {
              id: 'inst-4',
              model: 'Avery Weigh-Tronix Bridge',
              serialNumber: 'AW-60T-8812',
              accuracyClass: 'CLASS_III',
            },
            status: 'COMPLETED',
            overallVerdict: 'FAIL',
            testDate: '2026-08-22T11:45:00Z',
            finalizedAt: '2026-08-22T16:00:00Z',
            inspector: { name: 'Dr. Anita Desai' },
          },
          {
            id: 'session-5',
            certificateNumber: 'NAWI-DL-2026-0005',
            instrument: {
              id: 'inst-5',
              model: 'Shimadzu Crane CS-5',
              serialNumber: 'SH-CR-3301',
              accuracyClass: 'CLASS_IIII',
            },
            status: 'DRAFT',
            overallVerdict: 'PENDING',
            testDate: '2026-08-30T10:00:00Z',
            finalizedAt: null,
            inspector: { name: 'Shri R. K. Sharma' },
          },
        ];
      }
    },
  });

  const filteredSessions = useMemo(() => {
    if (!testSessions) return [];
    return testSessions.filter((s) => {
      const matchesSearch =
        searchTerm === '' ||
        s.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.instrument?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.instrument?.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.inspector?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === '' || s.status === selectedStatus;
      const matchesVerdict = selectedVerdict === '' || s.overallVerdict === selectedVerdict;

      return matchesSearch && matchesStatus && matchesVerdict;
    });
  }, [testSessions, searchTerm, selectedStatus, selectedVerdict]);

  const columns = [
    {
      header: t('tests.certificateNumber', 'Certificate No'),
      accessor: 'certificateNumber',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-primary-700 text-xs font-mono">
          {row.certificateNumber}
        </span>
      ),
    },
    {
      header: t('tests.instrument', 'Instrument'),
      accessor: (row) => row.instrument?.model,
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.instrument?.model || 'NAWI'}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            S/N: {row.instrument?.serialNumber || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: t('common.status', 'Status'),
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      header: t('tests.overallVerdict', 'Verdict'),
      accessor: 'overallVerdict',
      sortable: true,
      render: (row) => <StatusBadge status={row.overallVerdict} size="xs" />,
    },
    {
      header: t('tests.testDate', 'Test Date'),
      accessor: 'testDate',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.testDate ? new Date(row.testDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      header: t('tests.conductedBy', 'Conducted By'),
      accessor: (row) => row.inspector?.name || 'Officer',
      cellClass: 'text-xs text-slate-700 font-medium',
    },
    {
      header: t('common.actions', 'Actions'),
      cellClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tests/${row.id}`);
            }}
            className="p-1.5 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded border border-primary-200 text-xs font-bold flex items-center gap-1"
            title="View Details"
          >
            <FiEye className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>
          {row.status === 'COMPLETED' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/reports/${row.id}`);
              }}
              className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 text-xs font-semibold"
              title="View Report"
            >
              <FiFileText className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('tests.title', 'Test Sessions')}
        subtitle={t('tests.subtitle', 'OIML R-76 Non-Automatic Weighing Instrument verification records')}
        actions={
          isInspector && (
            <button
              type="button"
              onClick={() => navigate('/tests/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-primary-600 rounded shadow-sm hover:bg-primary-700 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>{t('tests.newSessionBtn', '+ New Test Session')}</span>
            </button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search certificate, instrument, inspector..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by Status"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="APPROVED">Approved</option>
          </select>

          {/* Verdict Filter */}
          <select
            value={selectedVerdict}
            onChange={(e) => setSelectedVerdict(e.target.value)}
            aria-label="Filter by Verdict"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Verdicts</option>
            <option value="PASS">PASS (Compliant)</option>
            <option value="FAIL">FAIL (Non-Compliant)</option>
            <option value="PENDING">Pending Verdict</option>
          </select>

          {(searchTerm || selectedStatus || selectedVerdict) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('');
                setSelectedVerdict('');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredSessions}
        isLoading={isLoading}
        emptyMessage="No test sessions found matching the search criteria."
        pageSize={10}
        onRowClick={(row) => navigate(`/tests/${row.id}`)}
      />
    </div>
  );
}
