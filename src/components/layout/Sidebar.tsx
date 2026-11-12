import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Tv,
  Compass,
  FlaskConical,
  Activity,
  PiggyBank,
  FileSpreadsheet,
  Calculator,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Household } from '../../types/household';
import { UserAccount } from '../../types/account';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  pendingAlertsCount: number;
  household: Household | null;
  onOpenInstallationModal: () => void;
  userAccount?: UserAccount | null;
  onOpenAccountModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  pendingAlertsCount,
  household,
  onOpenInstallationModal,
  userAccount,
  onOpenAccountModal,
}) => {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const controlGroup = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'invoices', label: t('navInvoices'), icon: Receipt },
    { id: 'appliances', label: t('navAppliances'), icon: Tv },
  ];

  const analysisGroup = [
    { id: 'atlas', label: t('navAtlas'), icon: Compass },
    { id: 'simulator', label: t('navSimulator'), icon: FlaskConical },
    { id: 'diagnostics', label: t('navDiagnostics'), icon: Activity, badge: pendingAlertsCount },
    { id: 'savings', label: t('navSavings'), icon: PiggyBank },
    { id: 'tariffs', label: t('navTariffs'), icon: FileSpreadsheet },
  ];

  const systemGroup = [
    { id: 'tools', label: t('navTools'), icon: Calculator },
    { id: 'reports', label: t('navReports'), icon: FileText },
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ];

  const renderNavItem = (item: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
          isActive
            ? 'bg-[#35D39A]/15 text-[#35D39A] font-semibold dark:bg-[#35D39A]/20'
            : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#19273B]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? 'text-[#35D39A]'
                : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-white'
            }`}
          />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {/* Active line indicator on left edge */}
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#35D39A] rounded-r" />
        )}

        {/* Badge counter */}
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              isCollapsed
                ? 'absolute top-1 right-1 w-2 h-2 p-0 bg-[#F07676]'
                : 'bg-[#F07676] text-white'
            }`}
          >
            {!isCollapsed && item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`desktop-only hidden md:flex flex-col shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1220] min-h-[calc(100vh-4rem)] p-3 justify-between transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="space-y-3">
        {/* User Account / Google Card */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onOpenAccountModal}
            className="w-full p-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-emerald-500/40 shrink-0">
                <img src="/vatio-logo.png" alt="VATIO" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">
                  {userAccount?.name || 'Crear Cuenta'}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center gap-1">
                  {userAccount?.google.connected ? '● Google Vinculado' : '● Cuenta Local'}
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Installation selector button inside sidebar */}
        {!isCollapsed && household && (
          <button
            onClick={onOpenInstallationModal}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141F32] hover:border-slate-300 dark:hover:border-white/20 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#35D39A]/15 text-[#35D39A] flex items-center justify-center shrink-0">
                <Building className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-800 dark:text-white truncate">
                  {household.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-[#A7B6CA] truncate">
                  {household.distributor} · {household.currencySymbol}
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Group 1: Control Energético */}
        <div>
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1">
              {t('navControl')}
            </span>
          )}
          <nav className="space-y-0.5">{controlGroup.map(renderNavItem)}</nav>
        </div>

        {/* Group 2: Análisis y Simulación */}
        <div>
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1">
              {t('navAnalysis')}
            </span>
          )}
          <nav className="space-y-0.5">{analysisGroup.map(renderNavItem)}</nav>
        </div>

        {/* Group 3: Utilidades y Sistema */}
        <div>
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-1">
              {t('navUtilities')}
            </span>
          )}
          <nav className="space-y-0.5">{systemGroup.map(renderNavItem)}</nav>
        </div>
      </div>

      {/* Sidebar footer with collapse toggle */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
        {!isCollapsed && (
          <div className="px-2 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#35D39A]" />
            <span className="truncate">IndexedDB Cifrado Local</span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141F32] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
