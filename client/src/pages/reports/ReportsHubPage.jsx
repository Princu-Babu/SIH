import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiFileText, FiDownload, FiEye, FiAlertCircle } from 'react-icons/fi';
import apiClient from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/shared/StatusBadge';

export default function ReportsHubPage() {
  const navigate = useNavigate();

  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['completed-sessions-hub'],
    queryFn: async () => {
      const res = await apiClient.get('/tests');
      // Handle different response shapes
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.sessions || [];
      // Filter for COMPLETED sessions only
      return raw.filter(s => s.status === 'COMPLETED');
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Certificates"
        subtitle="Download official OIML R-76 test certificates and technical datasheets for completed verifications"
        actions={
          <button
            type="button"
            onClick={() => navigate('/tests')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 transition-colors"
          >
            <FiEye className="w-3.5 h-3.5" />
            View All Test Sessions
          </button>
        }
      />

      {isLoading && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner message="Loading completed verifications..." />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-lg flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Unable to load reports</p>
            <p className="text-xs mt-0.5">Check your connection and try again.</p>
          </div>
        </div>
      )}

      {sessions && sessions.length === 0 && (
        <div className="bg-white border border-slate-200 p-12 rounded-lg text-center">
          <FiFileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No completed verifications yet</p>
          <p className="text-xs text-slate-400 mt-1">Completed test sessions will appear here with download options.</p>
          <button
            type="button"
            onClick={() => navigate('/tests/new')}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
          >
            + New Test Session
          </button>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map(session => (
            <div key={session.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono font-bold text-primary-700 truncate">
                    {session.certificateNo || session.certificateNumber || session.id?.substring(0, 12) + '...'}
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {session.instrument?.model || session.instrument?.name || 'NAWI Instrument'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    S/N: {session.instrument?.serialNumber || 'N/A'}
                  </p>
                </div>
                <StatusBadge status={session.overallResult || session.overallVerdict || 'COMPLETED'} size="xs" />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div>
                  <span className="text-slate-500">Date</span>
                  <p className="font-medium text-slate-700">
                    {new Date(session.startedAt || session.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Inspector</span>
                  <p className="font-medium text-slate-700 truncate">
                    {session.conductedBy?.name || session.inspector?.name || 'Officer'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => navigate(`/reports/${session.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  Download Certificate (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/reports/${session.id}?type=datasheet`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded transition-colors"
                >
                  <FiFileText className="w-3.5 h-3.5" />
                  Technical Datasheet (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/tests/${session.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <FiEye className="w-3.5 h-3.5" />
                  View Full Test Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
