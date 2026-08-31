import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiBell,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiMenu,
  FiGlobe,
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiDatabase,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export default function TopBar({ onToggleSidebar }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing, lastSyncTime, triggerSync } = useOfflineSync();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [syncDropdownOpen, setSyncDropdownOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const syncDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
      if (syncDropdownRef.current && !syncDropdownRef.current.contains(event.target)) {
        setSyncDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', label: 'English (EN)' },
    { code: 'hi', label: 'हिन्दी (HI)' },
    { code: 'ta', label: 'தமிழ் (TA)' },
    { code: 'bn', label: 'বাংলা (BN)' },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setLangDropdownOpen(false);
  };

  const formatLastSync = (isoString) => {
    if (!isoString) return 'Not yet synced';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-white border-b border-slate-200 shadow-sm">
      {/* Saffron Gov Banner Stripe */}
      <div className="h-1 bg-saffron-500 w-full" />

      {/* Main TopBar */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
        {/* Left Side: Mobile Menu Button + Ashoka Chakra + Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Ashoka Chakra SVG */}
          <div className="shrink-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#1e3a5f]"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="50" cy="50" r="44" stroke="#1e3a5f" strokeWidth="4" />
              <circle cx="50" cy="50" r="8" fill="#1e3a5f" />
              {/* 24 Spoke Wheel */}
              {[...Array(24)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + 44 * Math.cos((i * 15 * Math.PI) / 180)}
                  y2={50 + 44 * Math.sin((i * 15 * Math.PI) / 180)}
                  stroke="#1e3a5f"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-[#1e3a5f] tracking-tight">
                NAWI-ReportPro
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded border border-slate-300">
                OIML R-76
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block leading-none mt-0.5">
              {t('common.ministry', 'Ministry of Consumer Affairs, Food & Public Distribution')} | {t('common.govOfIndia', 'Government of India')}
            </p>
          </div>
        </div>

        {/* Right Side: Connectivity Badge + Language Switcher + Notifications + User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Connectivity & Sync Queue Badge */}
          <div className="relative" ref={syncDropdownRef}>
            <button
              type="button"
              onClick={() => setSyncDropdownOpen(!syncDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                isSyncing
                  ? 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse'
                  : !isOnline
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : pendingCount > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Click to view offline queue status & trigger sync"
            >
              {isSyncing ? (
                <>
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span className="hidden xs:inline">Syncing ({pendingCount})</span>
                  <span className="xs:hidden">Sync</span>
                </>
              ) : !isOnline ? (
                <>
                  <FiWifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Offline Mode</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </>
              ) : pendingCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="hidden sm:inline">Sync Queue</span>
                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                    {pendingCount}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="hidden sm:inline">Online</span>
                </>
              )}
              <FiChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Sync Queue Popover */}
            {syncDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl py-3 px-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                  <div className="flex items-center gap-2">
                    <FiDatabase className="w-4 h-4 text-[#1e3a5f]" />
                    <span className="text-xs font-bold text-slate-800">Offline & Sync Status</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isOnline ? 'Connected' : 'Offline'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-3">
                  <div className="flex justify-between items-center">
                    <span>Pending Local Records:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {pendingCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span>Last Cloud Sync:</span>
                    <span className="text-slate-500 font-medium">{formatLastSync(lastSyncTime)}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                    <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      {isOnline
                        ? 'All inspection records are backed by resilient IndexedDB and auto-commit to PostgreSQL.'
                        : 'Operating in rural/mandi offline mode. All test data is preserved locally.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerSync();
                    setSyncDropdownOpen(false);
                  }}
                  disabled={!isOnline || isSyncing}
                  className={`w-full py-1.5 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                    !isOnline || isSyncing
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-[#1e3a5f] hover:bg-[#152843] text-white shadow-sm'
                  }`}
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Pending Records Now'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
            >
              <FiGlobe className="w-4 h-4 text-[#1e3a5f]" />
              <span className="hidden sm:inline">{currentLang.label}</span>
              <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-md shadow-md py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${
                      i18n.language === lang.code ? 'text-primary-700 bg-primary-50 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {i18n.language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Icon */}
          <button
            type="button"
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative"
            title={t('nav.notifications', 'Notifications')}
            aria-label={t('nav.notifications', 'Notifications')}
          >
            <FiBell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-saffron-500 rounded-full" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 text-left rounded-md hover:bg-slate-50 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded bg-[#1e3a5f] text-white font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || 'Officer'}
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  {user?.role || 'OFFICER'}
                </div>
              </div>
              <FiChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-md shadow-md py-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name || 'Officer'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'officer@gov.in'}</p>
                  <p className="text-[10px] text-primary-700 font-semibold mt-0.5">
                    {user?.designation || user?.role || 'Legal Metrology Officer'}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <FiLogOut className="w-3.5 h-3.5" />
                    <span>{t('nav.logout', 'Sign Out')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
