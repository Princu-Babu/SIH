import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiSearch,
  FiMapPin,
  FiCalendar,
  FiUserCheck,
  FiLock,
} from 'react-icons/fi';
import apiClient from '../../hooks/useApi';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function PublicVerificationPage() {
  const { t } = useTranslation();
  const { certificateNo: paramCert } = useParams();
  const navigate = useNavigate();

  const [searchCert, setSearchCert] = useState(paramCert || 'NAWI-2026-000001');
  const [activeCert, setActiveCert] = useState(paramCert || 'NAWI-2026-000001');

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-verify', activeCert],
    queryFn: async () => {
      if (!activeCert) return null;
      const res = await apiClient.get(`/reports/verify/${encodeURIComponent(activeCert)}`);
      return res.data;
    },
    enabled: !!activeCert,
    retry: 1,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCert.trim()) {
      setActiveCert(searchCert.trim());
      navigate(`/verify/${encodeURIComponent(searchCert.trim())}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800">
      {/* Official Government Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm">
              ⚖
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Department of Legal Metrology
              </div>
              <div className="text-[11px] text-slate-500">
                Ministry of Consumer Affairs, Food & Public Distribution | Government of India
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              <FiShield className="w-3.5 h-3.5 text-emerald-600" />
              Public Verification Portal
            </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-primary-700 hover:text-primary-900 px-3 py-1.5 rounded border border-primary-300 bg-white hover:bg-slate-50"
            >
              Officer Portal →
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Search / QR Input Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4 text-center">
          <div className="inline-flex p-3 bg-primary-50 text-primary-700 rounded-full">
            <FiShield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              National Non-Automatic Weighing Instrument (NAWI) Registry
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Verify the legal metrological verification certificate, stamping validity, and OIML R-76 compliance status of commercial and industrial scales in India.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchCert}
                onChange={(e) => setSearchCert(e.target.value)}
                placeholder="Enter Certificate No (e.g. NAWI-2026-000001)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm transition-colors shrink-0"
            >
              Verify Certificate
            </button>
          </form>
        </div>

        {/* Verification Result */}
        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-lg p-10 shadow-sm">
            <LoadingSpinner message="Querying National Legal Metrology Database..." />
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm text-center space-y-3">
            <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-full">
              <FiAlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-red-900">Certificate Not Found or Invalid</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              No active legal metrology verification certificate matches <strong>{activeCert}</strong>. The physical instrument stamp may be expired, unverified, or fraudulent.
            </p>
          </div>
        )}

        {data && data.verified && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden space-y-6">
            {/* Status Banner */}
            <div className="bg-emerald-600 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="p-2 bg-white/20 rounded-full">
                  <FiCheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-base font-bold flex items-center gap-2 justify-center sm:justify-start">
                    <span>OFFICIALLY VERIFIED & CERTIFIED</span>
                  </div>
                  <div className="text-xs text-emerald-100">
                    Complies with Legal Metrology Act, 2009 & OIML Recommendation R-76
                  </div>
                </div>
              </div>

              <div className="bg-white text-slate-900 px-3 py-1.5 rounded text-xs font-mono font-bold shadow">
                {data.certificateNo}
              </div>
            </div>

            {/* Certificate Details Grid */}
            <div className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block">Instrument Model & Serial Number</span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {data.instrument?.model || data.instrument?.name}
                  </span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    S/N: {data.instrument?.serialNumber}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block">Accuracy Class & Maximum Capacity</span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {data.instrument?.accuracyClass}
                  </span>
                  <span className="text-slate-600 font-semibold text-[11px]">
                    Max Capacity: {data.instrument?.maxCapacity} {data.instrument?.unit}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
                    <FiUserCheck className="text-slate-400" /> Authorized Verification Officer
                  </span>
                  <span className="text-xs font-bold text-slate-900 block">
                    {data.conductedBy || 'Legal Metrology Officer'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Department of Legal Metrology, Government of India
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
                    <FiMapPin className="text-slate-400" /> Verified Stamping Location
                  </span>
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {data.instrument?.location || 'Authorized Regional Metrology Laboratory'}
                  </span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <FiCalendar className="text-slate-400" /> Date: {new Date(data.verifiedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Cryptographic Digital Seal & Immutability */}
              <div className="p-4 bg-primary-50/50 border border-primary-200 rounded-lg flex items-start gap-3 text-xs text-primary-950">
                <FiLock className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Cryptographically Anchored Legal Seal (SHA-256)</div>
                  <p className="text-slate-600 text-[11px]">
                    This certificate is cryptographically recorded on the national immutable metrology registry. Any physical re-calibration or alteration without re-verification invalidates this legal certificate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p className="font-semibold text-slate-700">
          Ministry of Consumer Affairs, Food & Public Distribution | Government of India
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          National Legal Metrology Portal | OIML Recommendation R-76 Certified
        </p>
      </footer>
    </div>
  );
}
