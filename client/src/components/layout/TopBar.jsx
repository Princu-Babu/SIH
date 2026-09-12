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
  FiSun,
  FiMoon,
  FiCheck,
  FiInfo,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import StateEmblem from '../common/StateEmblem';

export default function TopBar({ onToggleSidebar }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing, lastSyncTime, triggerSync } = useOfflineSync();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [syncDropdownOpen, setSyncDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // GIGW 3.0 Accessibility States
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('gigw_font_size') || 'base';
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('gigw_high_contrast') === 'true';
  });

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'warning',
      title: 'Verification Renewal Due',
      titleHi: 'सत्यापन नवीनीकरण देय',
      message: 'Weighbridge #WB-DEL-042 verification expires in 7 days.',
      messageHi: 'वेब्रिज #WB-DEL-042 का सत्यापन 7 दिनों में समाप्त हो रहा है।',
      time: '10m ago',
      unread: true,
    },
    {
      id: 'notif-2',
      type: 'success',
      title: 'Resilient Cloud Sync',
      titleHi: 'क्लाउड सिंक पूर्ण',
      message: 'All local mandi test sessions auto-committed to PostgreSQL.',
      messageHi: 'सभी स्थानीय मंडी परीक्षण सत्र पोस्टग्रेएसक्यूएल में सिंक हो गए।',
      time: '45m ago',
      unread: true,
    },
    {
      id: 'notif-3',
      type: 'info',
      title: 'OIML R-76 Tolerance Check',
      titleHi: 'OIML R-76 सहिष्णुता सूचना',
      message: 'Test Session TS-2026-089 hysteresis recorded within allowable 0.5e MPE.',
      messageHi: 'परीक्षण सत्र TS-2026-089 हिस्टैरिसीस स्वीकार्य 0.5e एमईपी के भीतर है।',
      time: '2h ago',
      unread: true,
    },
  ]);

  const userDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const syncDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

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
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply Font Size Adjustment (A- | A | A+)
  useEffect(() => {
    const sizeMap = {
      sm: '14.4px', // 90%
      base: '16px',  // 100%
      lg: '18.4px', // 115%
    };
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px';
    localStorage.setItem('gigw_font_size', fontSize);
  }, [fontSize]);

  // Apply High Contrast Theme
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('gigw_high_contrast', String(highContrast));
  }, [highContrast]);

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

  const toggleLanguageQuick = () => {
    const target = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(target);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

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
      {/* ========================================================================= */}
      {/* 1. GIGW 3.0 ACCESSIBILITY & NATIONAL UTILITY TOP STRIP                    */}
      {/* ========================================================================= */}
      <div className="bg-[#1e293b] text-slate-200 text-[11px] px-4 lg:px-6 py-1 flex items-center justify-between border-b border-slate-700 select-none">
        {/* Left: National Identity Header */}
        <div className="flex items-center gap-2">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:inline-block focus:bg-amber-400 focus:text-slate-900 focus:px-2 focus:py-0.5 focus:rounded focus:font-bold focus:z-50"
          >
            Skip to Main Content / मुख्य सामग्री
          </a>
          <span className="font-semibold text-white tracking-wide">
            भारत सरकार
          </span>
          <span className="text-slate-500">|</span>
          <span className="font-medium text-slate-300 hidden sm:inline uppercase tracking-wider text-[10px]">
            Government of India
          </span>
        </div>

        {/* Right: GIGW Accessibility Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Font Size Adjusters: A- | A | A+ */}
          <div className="flex items-center gap-0.5 bg-slate-800 rounded p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              title="Decrease Font Size (A-)"
              aria-label="Decrease Font Size"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                fontSize === 'sm'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('base')}
              title="Normal Font Size (A)"
              aria-label="Standard Font Size"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                fontSize === 'base'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              title="Increase Font Size (A+)"
              aria-label="Increase Font Size"
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                fontSize === 'lg'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              A+
            </button>
          </div>

          <span className="text-slate-600 hidden xs:inline">|</span>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            title="Toggle High Contrast Mode"
            aria-label="Toggle High Contrast Mode"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
              highContrast
                ? 'bg-yellow-400 text-black border-yellow-500 font-bold'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {highContrast ? <FiSun className="w-3 h-3 text-black" /> : <FiMoon className="w-3 h-3 text-amber-300" />}
            <span className="hidden sm:inline">{highContrast ? 'Standard' : 'High Contrast'}</span>
          </button>

          <span className="text-slate-600 hidden xs:inline">|</span>

          {/* Instant Bilingual Quick Toggle (English / हिन्दी) */}
          <button
            type="button"
            onClick={toggleLanguageQuick}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700 transition-colors"
            title="Instant toggle language: English / हिन्दी"
          >
            {i18n.language === 'hi' ? 'English' : 'हिन्दी'}
          </button>
        </div>
      </div>

      {/* Saffron Tricolor Accent Strip */}
      <div className="flex h-1 w-full">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN BRANDING & APP HEADER                                             */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
        {/* Left Side: Mobile Menu Button + Official State Emblem + Ministry Bilingual Banner */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Official State Emblem of India (Ashoka Lion Capital with Satyameva Jayate) */}
          <StateEmblem size="sm" color="#1e3a5f" className="hidden xs:inline-flex" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold text-[#1e3a5f] tracking-tight">
                NAWI-ReportPro
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#1e3a5f] rounded border border-slate-300">
                OIML R-76
              </span>
            </div>

            {/* Official Ministry Bilingual Hierarchy Banner */}
            <div className="text-slate-600 leading-tight mt-0.5">
              <p className="text-[11px] font-semibold text-slate-800 hidden md:block">
                उपभोक्ता मामले, खाद्य और सार्वजनिक वितरण मंत्रालय • Ministry of Consumer Affairs, Food & Public Distribution
              </p>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                विधिक मापविज्ञान प्रभाग • Legal Metrology Division
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Connectivity & Sync + Language Selector + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                    <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </>
              ) : pendingCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="hidden sm:inline">Sync Queue</span>
                  <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
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

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
              aria-label="Language selector"
            >
              <FiGlobe className="w-3.5 h-3.5 text-[#1e3a5f]" />
              <span className="hidden sm:inline">{currentLang.label}</span>
              <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
              <FiChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
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

          {/* ========================================================================= */}
          {/* 3. INTERACTIVE NOTIFICATION BELL & POPOVER PANEL                          */}
          {/* ========================================================================= */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              type="button"
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
              title={t('nav.notifications', 'Notifications')}
              aria-label={`Notifications (${unreadNotifCount} unread)`}
              aria-expanded={notifDropdownOpen}
            >
              <FiBell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9933] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF9933] border border-white" />
                </span>
              )}
            </button>

            {/* Interactive Notification Popover List */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FiBell className="w-3.5 h-3.5 text-[#1e3a5f]" />
                    <span className="text-xs font-bold text-slate-800">
                      {t('nav.notifications', 'Notifications')}
                    </span>
                    {unreadNotifCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                        {unreadNotifCount} New
                      </span>
                    )}
                  </div>
                  {unreadNotifCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-primary-700 hover:text-primary-900 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => toggleNotificationRead(notif.id)}
                        className={`p-3 text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                          notif.unread ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50 opacity-80'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {notif.type === 'warning' && (
                            <FiAlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          {notif.type === 'success' && (
                            <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                          {notif.type === 'info' && (
                            <FiInfo className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 text-[11px]">
                              {i18n.language === 'hi' ? notif.titleHi : notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {i18n.language === 'hi' ? notif.messageHi : notif.message}
                          </p>
                        </div>
                        {notif.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933] shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 font-medium">
                    National Metrology Event Stream • Legal Metrology Act, 2009
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 text-left rounded-md hover:bg-slate-50 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded bg-[#1e3a5f] text-white font-bold text-xs flex items-center justify-center shadow-sm">
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
