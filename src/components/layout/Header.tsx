import React, { useState } from 'react';
import {
  Zap,
  Moon,
  Sun,
  Laptop,
  Bell,
  Search,
  Globe2,
  ChevronDown,
  Building,
  Check,
  User,
} from 'lucide-react';
import { Household } from '../../types/household';
import { UserAccount } from '../../types/account';
import { useI18n } from '../../i18n/I18nContext';
import { LanguageCode } from '../../i18n/types';

interface HeaderProps {
  household: Household | null;
  households: Household[];
  activeHouseholdId: string;
  onSelectHousehold: (id: string) => void;
  onOpenInstallationModal: () => void;
  themeMode: 'dark' | 'light' | 'auto';
  onSetThemeMode: (mode: 'dark' | 'light' | 'auto') => void;
  pendingAlertsCount: number;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenGoogleTranslate: () => void;
  userAccount?: UserAccount | null;
  onOpenAccountModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  household,
  households,
  activeHouseholdId,
  onSelectHousehold,
  onOpenInstallationModal,
  themeMode,
  onSetThemeMode,
  pendingAlertsCount,
  currentView,
  onNavigate,
  onOpenSearch,
  onOpenNotifications,
  onOpenGoogleTranslate,
  userAccount,
  onOpenAccountModal,
}) => {
  const { t, language, setLanguage, supportedLanguages, currentLanguageMeta } = useI18n();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isInstallMenuOpen, setIsInstallMenuOpen] = useState(false);

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'dashboard':
        return t('navDashboard');
      case 'invoices':
        return t('navInvoices');
      case 'appliances':
        return t('navAppliances');
      case 'atlas':
        return t('navAtlas');
      case 'simulator':
        return t('navSimulator');
      case 'diagnostics':
        return t('navDiagnostics');
      case 'savings':
        return t('navSavings');
      case 'tariffs':
        return t('navTariffs');
      case 'tools':
        return t('navTools');
      case 'reports':
        return t('navReports');
      case 'settings':
        return t('navSettings');
      default:
        return 'VATIO';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md transition-colors">
      {/* Zone 1: Contextual Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left shrink-0 group focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center bg-slate-950 border border-emerald-500/40 shadow-xs shrink-0">
            <img src="/vatio-logo.png" alt="VATIO Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base hidden sm:inline">
            VATIO
          </span>
        </button>

        <span className="text-slate-300 dark:text-white/20 select-none">/</span>

        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {getViewTitle(currentView)}
        </span>

        {/* Installation selector badge */}
        {household && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsInstallMenuOpen(!isInstallMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-[#19273B] text-slate-700 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-[#35D39A]" />
              <span className="truncate max-w-[140px]">{household.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isInstallMenuOpen && (
              <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('switchInstallation')}
                </div>
                {households.map(hh => (
                  <button
                    key={hh.id}
                    onClick={() => {
                      onSelectHousehold(hh.id);
                      setIsInstallMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#19273B] text-left"
                  >
                    <span className="truncate">{hh.name}</span>
                    {hh.id === activeHouseholdId && (
                      <Check className="w-3.5 h-3.5 text-[#35D39A]" />
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-white/10 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsInstallMenuOpen(false);
                      onOpenInstallationModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#35D39A] font-medium hover:bg-slate-100 dark:hover:bg-[#19273B]"
                  >
                    + {t('addInstallation')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 2: Global Search Trigger Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-100 dark:bg-[#141F32] hover:bg-slate-200/70 dark:hover:bg-[#19273B] text-slate-500 dark:text-[#A7B6CA] rounded-lg border border-slate-200 dark:border-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>{t('searchPlaceholder')}</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#0B1220] border border-slate-300 dark:border-white/10 text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Actions (Search, Translate, Notifications, Language, Theme) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          aria-label={t('search')}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141F32] transition"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Google Translate external tool */}
        <button
          onClick={onOpenGoogleTranslate}
          aria-label={t('googleTranslate')}
          title={t('googleTranslate')}
          className="p-2 rounded-lg text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141F32] transition"
        >
          <Globe2 className="w-4 h-4" />
        </button>

        {/* Notifications button with badge */}
        <button
          onClick={onOpenNotifications}
          aria-label={t('notifications')}
          className="relative p-2 rounded-lg text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141F32] transition"
        >
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F07676] ring-2 ring-white dark:ring-[#0B1220]" />
          )}
        </button>

        {/* Language selector dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsLangMenuOpen(!isLangMenuOpen);
              setIsThemeMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141F32] transition"
          >
            <span>{currentLanguageMeta.flag}</span>
            <span className="hidden sm:inline">{currentLanguageMeta.code.toUpperCase()}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 max-h-72 overflow-y-auto bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {supportedLanguages.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                    language === l.code
                      ? 'bg-[#35D39A]/15 text-[#35D39A] font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#19273B]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.nativeName}</span>
                  </span>
                  {language === l.code && <Check className="w-3.5 h-3.5 text-[#35D39A]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3-State Theme toggle (Dark / Light / Auto) */}
        <div className="relative">
          <button
            onClick={() => {
              setIsThemeMenuOpen(!isThemeMenuOpen);
              setIsLangMenuOpen(false);
            }}
            aria-label="Seleccionar tema"
            className="p-2 rounded-lg text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141F32] transition"
          >
            {themeMode === 'dark' ? (
              <Moon className="w-4 h-4 text-[#35D39A]" />
            ) : themeMode === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  onSetThemeMode('dark');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left ${
                  themeMode === 'dark'
                    ? 'text-[#35D39A] font-semibold bg-[#35D39A]/10'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#19273B]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t('themeDark')}</span>
              </button>
              <button
                onClick={() => {
                  onSetThemeMode('light');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left ${
                  themeMode === 'light'
                    ? 'text-amber-500 font-semibold bg-amber-500/10'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#19273B]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t('themeLight')}</span>
              </button>
              <button
                onClick={() => {
                  onSetThemeMode('auto');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left ${
                  themeMode === 'auto'
                    ? 'text-cyan-400 font-semibold bg-cyan-400/10'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#19273B]'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{t('themeAuto')}</span>
              </button>
            </div>
          )}
        </div>

        {/* User Account & Google Tools Hub Button */}
        <button
          type="button"
          onClick={onOpenAccountModal}
          className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#141F32] hover:bg-slate-200 dark:hover:bg-[#19273B] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition shadow-xs"
          title={userAccount ? `Cuenta de ${userAccount.name}` : 'Crear Cuenta'}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[11px] shrink-0 shadow-xs">
            {userAccount ? userAccount.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="hidden md:flex flex-col text-left leading-tight">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
              {userAccount ? userAccount.name : 'Crear Cuenta'}
            </span>
            <span className="text-[9px] text-emerald-500 font-medium">
              {userAccount?.google.connected ? '● Google' : 'Local'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
