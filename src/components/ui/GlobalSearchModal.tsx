import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Zap, BookOpen, AlertTriangle, Layers, Sliders, X, ArrowRight } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Invoice } from '../../types/invoice';
import { Appliance } from '../../types/appliance';
import { Tariff } from '../../types/tariff';
import { Scenario } from '../../types/scenario';
import { DiagnosticItem } from '../../types/diagnostic';
import { ENERGY_GLOSSARY } from '../../database/seed';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  invoices: Invoice[];
  appliances: Appliance[];
  tariffs: Tariff[];
  scenarios: Scenario[];
  diagnostics: DiagnosticItem[];
}

interface SearchResult {
  id: string;
  type: 'invoice' | 'appliance' | 'tariff' | 'scenario' | 'diagnostic' | 'glossary';
  title: string;
  subtitle: string;
  badge: string;
  targetView: string;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  onNavigate,
  invoices,
  appliances,
  tariffs,
  scenarios,
  diagnostics,
}: GlobalSearchModalProps) {
  const { t, formatCurrency } = useI18n();
  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Index and filter results
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const list: SearchResult[] = [];

    // Invoices
    invoices.forEach(inv => {
      const match =
        inv.distributor.toLowerCase().includes(q) ||
        inv.periodStart.includes(q) ||
        String(inv.consumptionKwh).includes(q) ||
        String(inv.declaredTotal).includes(q);
      if (match) {
        list.push({
          id: inv.id,
          type: 'invoice',
          title: `Factura ${inv.periodStart.slice(0, 7)} · ${inv.distributor}`,
          subtitle: `${inv.consumptionKwh} kWh — ${formatCurrency(inv.declaredTotal, inv.currency)}`,
          badge: 'Factura',
          targetView: 'invoices',
        });
      }
    });

    // Appliances
    appliances.forEach(app => {
      const match =
        app.name.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        String(app.powerWatts || 0).includes(q);
      if (match) {
        list.push({
          id: app.id,
          type: 'appliance',
          title: app.name,
          subtitle: `${app.powerWatts || 0}W · ${app.category} · ${app.usageHoursPerDay || 0}h/día`,
          badge: 'Aparato',
          targetView: 'appliances',
        });
      }
    });

    // Tariffs
    tariffs.forEach(tar => {
      const match =
        tar.name.toLowerCase().includes(q) ||
        tar.distributor.toLowerCase().includes(q);
      if (match) {
        list.push({
          id: tar.id,
          type: 'tariff',
          title: tar.name,
          subtitle: `${tar.distributor} · ${tar.country} · ${tar.components.tiers?.length || 1} bloques`,
          badge: 'Tarifa',
          targetView: 'tariffs',
        });
      }
    });

    // Scenarios
    scenarios.forEach(sc => {
      const match =
        sc.name.toLowerCase().includes(q) ||
        (sc.description && sc.description.toLowerCase().includes(q));
      if (match) {
        list.push({
          id: sc.id,
          type: 'scenario',
          title: sc.name,
          subtitle: sc.description || 'Escenario de simulación guardado',
          badge: 'Laboratorio',
          targetView: 'simulator',
        });
      }
    });

    // Diagnostics
    diagnostics.forEach(diag => {
      const match =
        diag.title.toLowerCase().includes(q) ||
        diag.description.toLowerCase().includes(q) ||
        diag.category.toLowerCase().includes(q);
      if (match) {
        list.push({
          id: diag.id,
          type: 'diagnostic',
          title: diag.title,
          subtitle: diag.description,
          badge: 'Diagnóstico',
          targetView: 'diagnostics',
        });
      }
    });

    // Glossary
    ENERGY_GLOSSARY.forEach(term => {
      const match =
        term.term.toLowerCase().includes(q) ||
        (term.definitionSimple && term.definitionSimple.toLowerCase().includes(q)) ||
        (term.definitionTechnical && term.definitionTechnical.toLowerCase().includes(q));
      if (match) {
        list.push({
          id: `glossary-${term.term}`,
          type: 'glossary',
          title: term.term,
          subtitle: term.definitionSimple,
          badge: 'Glosario',
          targetView: 'tools',
        });
      }
    });

    // Atlas Energético & 3D Analytics
    if (
      'atlas energético'.includes(q) ||
      '3d'.includes(q) ||
      'matriz'.includes(q) ||
      'grafico 3d'.includes(q) ||
      'comparador'.includes(q) ||
      'estadisticas'.includes(q) ||
      'records'.includes(q)
    ) {
      list.push({
        id: 'atlas-energy-center',
        type: 'scenario',
        title: 'ATLAS ENERGÉTICO — Visualizaciones 3D y Análisis Histórico',
        subtitle: 'Explora gráficos tridimensionales, matrices energéticas, comparativas y tendencias históricas.',
        badge: 'Atlas 3D',
        targetView: 'atlas',
      });
    }

    return list.slice(0, 12);
  }, [query, invoices, appliances, tariffs, scenarios, diagnostics, formatCurrency]);

  if (!isOpen) return null;

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'invoice':
        return <FileText className="w-4 h-4 text-[#42C7D9]" />;
      case 'appliance':
        return <Zap className="w-4 h-4 text-[#35D39A]" />;
      case 'tariff':
        return <Layers className="w-4 h-4 text-[#F1B653]" />;
      case 'scenario':
        return <Sliders className="w-4 h-4 text-emerald-400" />;
      case 'diagnostic':
        return <AlertTriangle className="w-4 h-4 text-[#F07676]" />;
      case 'glossary':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            autoFocus
            className="flex-1 text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-[#19273B] text-slate-500 rounded border border-slate-200 dark:border-white/10">
            ESC
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-white/5">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Escribe para buscar facturas, aparatos, tarifas, diagnósticos o términos...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm font-medium">No se encontraron resultados para "{query}"</p>
              <p className="text-xs mt-1">Prueba con palabras clave como 'ICE', 'Refrigeradora', 'IVA' o '2024'.</p>
            </div>
          ) : (
            results.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.targetView);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-[#19273B] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0B1220] flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-[#A7B6CA]">
                        · {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#35D39A] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 dark:bg-[#0B1220]/60 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500">
          <span>{results.length} resultados encontrados</span>
          <div className="flex items-center gap-3">
            <span>Navegar con Enter</span>
            <span>Cerrar con ESC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
