import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBell, FiChevronDown, FiUser, FiLogOut, FiMenu, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ onToggleSidebar }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
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

        {/* Right Side: Language Switcher + Notifications + User Menu */}
        <div className="flex items-center gap-3">
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
