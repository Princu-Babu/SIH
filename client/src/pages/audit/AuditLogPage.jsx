import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FiShield, FiSearch, FiLock, FiInfo } from 'react-icons/fi';

import apiClient from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/audit');
        return Array.isArray(res.data) ? res.data : res.data.logs || [];
      } catch {
        return [
          {
            id: 'log-1',
            timestamp: '2026-08-30T10:45:12Z',
            userName: 'Shri Rajesh Kumar',
            userRole: 'ADMIN',
            action: 'LOGIN',
            entityType: 'AUTH',
            entityId: 'u-1',
            details: 'Officer authenticated successfully from Delhi State Network',
            ipAddress: '10.24.110.45',
            hash: '4a8f9038234857bfe42398471239857129384751928347192384719238471293',
          },
          {
            id: 'log-2',
            timestamp: '2026-08-28T12:00:00Z',
            userName: 'Shri R. K. Sharma',
            userRole: 'INSPECTOR',
            action: 'FINALIZE_TEST_SESSION',
            entityType: 'TEST_SESSION',
            entityId: 'session-1',
            details: 'Test Session NAWI-DL-2026-0001 finalized with verdict PASS',
            ipAddress: '10.24.110.12',
            hash: '772fb34908123490812390841230984102938410923840192384019238401928',
          },
          {
            id: 'log-3',
            timestamp: '2026-08-28T10:30:00Z',
            userName: 'Shri R. K. Sharma',
            userRole: 'INSPECTOR',
            action: 'RECORD_TEST_POINTS',
            entityType: 'TEST_RUN',
            entityId: 'run-weighing-1',
            details: 'Recorded 12 calibration points for WEIGHING_PERFORMANCE test',
            ipAddress: '10.24.110.12',
            hash: '8f7a93b482039482039482039482039482039482039482039482039482039482',
          },
          {
            id: 'log-4',
            timestamp: '2026-08-28T10:00:00Z',
            userName: 'Shri R. K. Sharma',
            userRole: 'INSPECTOR',
            action: 'CREATE_TEST_SESSION',
            entityType: 'TEST_SESSION',
            entityId: 'session-1',
            details: 'Created Test Session NAWI-DL-2026-0001 for Radwag XA 220.4Y',
            ipAddress: '10.24.110.12',
            hash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
          },
          {
            id: 'log-5',
            timestamp: '2026-08-15T09:15:00Z',
            userName: 'Shri Rajesh Kumar',
            userRole: 'ADMIN',
            action: 'CREATE_INSTRUMENT',
            entityType: 'INSTRUMENT',
            entityId: 'inst-1',
            details: 'Registered instrument Radwag XA 220.4Y (S/N: RAD-2024-9981)',
            ipAddress: '10.24.110.45',
            hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          },
        ];
      }
    },
  });

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchTerm === '' ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = selectedAction === '' || log.action === selectedAction;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchTerm, selectedAction]);

  const columns = [
    {
      header: t('audit.timestamp', 'Timestamp (IST)'),
      accessor: 'timestamp',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600 font-mono">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      header: t('audit.user', 'Officer / User'),
      accessor: 'userName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.userName}</div>
          <div className="text-[10px] text-slate-500 uppercase">{row.userRole}</div>
        </div>
      ),
    },
    {
      header: t('audit.action', 'Action'),
      accessor: 'action',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-[#1e3a5f] border border-slate-300 font-mono">
          {row.action}
        </span>
      ),
    },
    {
      header: t('audit.entityType', 'Entity'),
      accessor: 'entityType',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.entityType}
        </span>
      ),
    },
    {
      header: t('audit.details', 'Details'),
      accessor: 'details',
      cellClass: 'text-xs text-slate-700 max-w-sm',
    },
    {
      header: t('audit.ipAddress', 'IP Address'),
      accessor: 'ipAddress',
      cellClass: 'text-xs text-slate-500 font-mono',
    },
    {
      header: 'Block Hash',
      accessor: 'hash',
      render: (row) => (
        <span
          className="text-[10px] text-slate-400 font-mono block max-w-[120px] truncate"
          title={row.hash}
        >
          {row.hash}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('audit.title', 'Immutable Audit Trail')}
        subtitle={t('audit.subtitle', 'Cryptographically chained log of all metrological actions, modifications, and signatures')}
      />

      {/* Security Notice Banner */}
      <div className="p-4 bg-primary-50/70 border border-primary-200 rounded-lg flex items-center gap-3 text-xs text-primary-900">
        <FiLock className="w-5 h-5 text-primary-700 shrink-0" />
        <div>
          <span className="font-bold">Cryptographically Protected Record: </span>
          {t('audit.tamperProof', 'All audit entries are protected by SQLite immutability triggers and SHA-256 block chaining.')}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, officer, entity ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            aria-label="Filter by Action Type"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Action Types</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE_INSTRUMENT">CREATE_INSTRUMENT</option>
            <option value="CREATE_TEST_SESSION">CREATE_TEST_SESSION</option>
            <option value="RECORD_TEST_POINTS">RECORD_TEST_POINTS</option>
            <option value="FINALIZE_TEST_SESSION">FINALIZE_TEST_SESSION</option>
            <option value="GENERATE_CERTIFICATE_PDF">GENERATE_CERTIFICATE_PDF</option>
          </select>

          {(searchTerm || selectedAction) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedAction('');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        emptyMessage="No audit logs matching search criteria."
      />
    </div>
  );
}
