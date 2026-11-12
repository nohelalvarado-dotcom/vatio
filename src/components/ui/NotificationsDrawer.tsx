import React, { useState } from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, TrendingUp, Zap, ArrowRight, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { DiagnosticItem } from '../../types/diagnostic';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: DiagnosticItem[];
  onNavigate: (view: string) => void;
  onDismissDiagnostic: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  diagnostics,
  onNavigate,
  onDismissDiagnostic,
  onMarkAllRead,
}: NotificationsDrawerProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'alert' | 'warning' | 'info'>('all');

  if (!isOpen) return null;

  const filtered = diagnostics.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'alert') return d.severity === 'alerta';
    if (filter === 'warning') return d.severity === 'advertencia';
    if (filter === 'info') return d.severity === 'informativa';
    return true;
  });

  const getSeverityBadge = (sev: DiagnosticItem['severity']) => {
    switch (sev) {
      case 'alerta':
        return {
          label: t('sevAlert'),
          color: 'text-[#F07676] bg-[#F07676]/10 border-[#F07676]/20',
          icon: <AlertTriangle className="w-4 h-4 text-[#F07676]" />,
        };
      case 'advertencia':
        return {
          label: t('sevWarning'),
          color: 'text-[#F1B653] bg-[#F1B653]/10 border-[#F1B653]/20',
          icon: <TrendingUp className="w-4 h-4 text-[#F1B653]" />,
        };
      default:
        return {
          label: t('sevInfo'),
          color: 'text-[#42C7D9] bg-[#42C7D9]/10 border-[#42C7D9]/20',
          icon: <Zap className="w-4 h-4 text-[#42C7D9]" />,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-[#141F32] border-l border-slate-200 dark:border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35D39A]/15 text-[#35D39A] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('notifications')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#A7B6CA]">
                {diagnostics.length} alertas registradas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {diagnostics.length > 0 && (
              <button
                onClick={onMarkAllRead}
                className="px-2.5 py-1 text-[11px] text-[#35D39A] hover:bg-[#35D39A]/10 rounded-md transition-colors"
              >
                {t('markAllRead')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0B1220]/30 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-slate-200 dark:bg-[#24364D] text-slate-900 dark:text-white font-medium'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            Todas ({diagnostics.length})
          </button>
          <button
            onClick={() => setFilter('alert')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'alert'
                ? 'bg-[#F07676]/20 text-[#F07676] font-medium'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            Prioridad Alta
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'warning'
                ? 'bg-[#F1B653]/20 text-[#F1B653] font-medium'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            Advertencias
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'info'
                ? 'bg-[#42C7D9]/20 text-[#42C7D9] font-medium'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            Info
          </button>
        </div>

        {/* Notification Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-[#35D39A] opacity-60 mb-2" />
              <p className="text-xs font-medium">{t('noNotifications')}</p>
              <p className="text-[11px] text-slate-500 mt-1">Todos los parámetros energéticos están en rango nominal.</p>
            </div>
          ) : (
            filtered.map(item => {
              const badge = getSeverityBadge(item.severity);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col gap-2 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-white dark:bg-[#0B1220] shadow-xs">
                        {badge.icon}
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                    </div>
                    <button
                      onClick={() => onDismissDiagnostic(item.id)}
                      title="Descartar alerta"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#F07676] p-1 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-[#A7B6CA] leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/5 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                    <button
                      onClick={() => {
                        onNavigate('diagnostics');
                        onClose();
                      }}
                      className="text-[#35D39A] hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Ver diagnóstico</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#0B1220]/60 border-t border-slate-200 dark:border-white/10 text-center">
          <span className="text-[11px] text-slate-500">
            {t('verifiedLocalData')}
          </span>
        </div>
      </div>
    </div>
  );
}
