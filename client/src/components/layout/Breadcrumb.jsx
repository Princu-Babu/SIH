import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiChevronRight, FiHome } from 'react-icons/fi';

export default function Breadcrumb() {
  const { t } = useTranslation();
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  const segmentNameMap = {
    dashboard: t('nav.dashboard', 'Dashboard'),
    instruments: t('nav.instruments', 'Instruments'),
    tests: t('nav.testSessions', 'Test Sessions'),
    reports: t('nav.reports', 'Reports'),
    audit: t('nav.auditLog', 'Audit Trail'),
    users: t('nav.userManagement', 'User Management'),
    settings: t('nav.settings', 'Settings'),
    new: t('common.add', 'New'),
    edit: t('common.edit', 'Edit'),
    weighing: 'Weighing Performance',
    repeatability: 'Repeatability',
    eccentricity: 'Eccentricity',
    temperature: 'Temperature',
    stability: 'Stability',
    time_dependence: 'Time Dependence',
    WEIGHING_PERFORMANCE: 'Weighing Performance',
    REPEATABILITY: 'Repeatability',
    ECCENTRICITY: 'Eccentricity',
    TEMPERATURE: 'Temperature',
    STABILITY: 'Stability',
    TIME_DEPENDENCE: 'Time Dependence',
  };

  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-slate-500 hover:text-primary-700 transition-colors"
      >
        <FiHome className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = segmentNameMap[value] || value;

        return (
          <React.Fragment key={to}>
            <FiChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 truncate max-w-[200px]" aria-current="page">
                {displayName}
              </span>
            ) : (
              <Link
                to={to}
                className="text-slate-500 hover:text-primary-700 transition-colors truncate max-w-[150px]"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
