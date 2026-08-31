import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiGrid,
  FiFileText,
  FiShield,
  FiUsers,
  FiSettings,
  FiCheckSquare,
  FiSliders,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { isAdmin, isInspector } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: t('nav.dashboard', 'Dashboard'),
      icon: FiGrid,
      show: true,
    },
    {
      to: '/instruments',
      label: t('nav.instruments', 'Instruments'),
      icon: FiSliders,
      show: true,
    },
    {
      to: '/tests',
      label: t('nav.testSessions', 'Test Sessions'),
      icon: FiCheckSquare,
      show: true,
    },
    {
      to: '/reports',
      label: t('nav.reports', 'Reports'),
      icon: FiFileText,
      show: true,
    },
    {
      to: '/audit',
      label: t('nav.auditLog', 'Audit Trail'),
      icon: FiShield,
      show: isAdmin || isInspector,
    },
    {
      to: '/users',
      label: t('nav.userManagement', 'User Management'),
      icon: FiUsers,
      show: isAdmin,
    },
    {
      to: '/settings',
      label: t('nav.settings', 'Settings'),
      icon: FiSettings,
      show: isAdmin,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-auto lg:h-[calc(100vh-53px)]`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1e3a5f]">NAWI-ReportPro</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Department Badge / Info Area */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t('common.legalMetrology', 'Department of Legal Metrology')}
          </div>
          <div className="text-xs font-bold text-[#1e3a5f] mt-0.5">
            OIML R-76 Verification System
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-l-4 border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span className="font-semibold">v1.0.4-L OIML</span>
            <a href="https://legalmetrology.gov.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-700 hover:underline">Gov.in Portal ↗</a>
          </div>
        </div>
      </aside>
    </>
  );
}
