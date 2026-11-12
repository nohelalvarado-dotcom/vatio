import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Tv,
  Compass,
  FlaskConical,
  Activity,
  PiggyBank,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  pendingAlertsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  pendingAlertsCount,
}) => {
  const { t } = useI18n();

  const items = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'invoices', label: t('navInvoices'), icon: Receipt },
    { id: 'atlas', label: t('navAtlas'), icon: Compass },
    { id: 'appliances', label: t('navAppliances'), icon: Tv },
    { id: 'simulator', label: t('navSimulator'), icon: FlaskConical },
    { id: 'diagnostics', label: t('navDiagnostics'), icon: Activity, badge: pendingAlertsCount },
  ];

  return (
    <nav className="mobile-only md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 flex items-center justify-around px-1 py-1 shadow-lg transition-colors">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 relative transition ${
              isActive
                ? 'text-[#35D39A] font-bold'
                : 'text-slate-500 dark:text-[#A7B6CA] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-[#F07676] text-white text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[54px]">
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-[#35D39A] rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
