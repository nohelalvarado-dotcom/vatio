import React, { useState, useEffect } from 'react';
import {
  Compass,
  Box,
  BarChart2,
  GitCompare,
  TrendingUp,
  Bookmark,
  Calendar,
  Layers,
  Table,
  Zap,
  Activity,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Household } from '../../types/household';
import { Invoice } from '../../types/invoice';
import { Appliance } from '../../types/appliance';
import { Tariff } from '../../types/tariff';
import {
  AtlasViewTab,
  ThreeChartType,
  TimeRangeFilter,
  SavedVisualization,
  AnalyticsSnapshot,
  DataTraceabilityInfo,
} from '../../types/atlas';
import { EnergyAnalyticsEngine } from '../../core/analytics/energy-analytics-engine';
import { ThreeEnergyCanvas } from './components/ThreeEnergyCanvas';
import { AnalyticalTable2D } from './components/AnalyticalTable2D';
import { PeriodComparatorTab } from './components/PeriodComparatorTab';
import { StatisticsRadarTab } from './components/StatisticsRadarTab';
import { SavedAnalysesTab } from './components/SavedAnalysesTab';
import { TraceabilityModal } from './components/TraceabilityModal';
import { db } from '../../database/db';
import { STORES } from '../../database/schema';
import { useI18n } from '../../i18n/I18nContext';

interface AtlasViewProps {
  household: Household | null;
  invoices: Invoice[];
  appliances: Appliance[];
  tariff: Tariff | null;
  onNavigate: (view: string) => void;
  onOpenAddInvoice: () => void;
}

export const AtlasView: React.FC<AtlasViewProps> = ({
  household,
  invoices,
  appliances,
  tariff,
  onNavigate,
  onOpenAddInvoice,
}) => {
  const { t, formatCurrency, formatNumber } = useI18n();

  // Active navigation tab within Atlas
  const [activeTab, setActiveTab] = useState<AtlasViewTab>('3d-canvas');
  const [renderMode, setRenderMode] = useState<'3d' | '2d' | 'table'>('3d');
  const [timeFilter, setTimeFilter] = useState<TimeRangeFilter>('all');
  const [chartType, setChartType] = useState<ThreeChartType>('consumption-3d');

  // Persistence for Atlas
  const [savedVisualizations, setSavedVisualizations] = useState<SavedVisualization[]>([]);
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);

  // Traceability Modal state
  const [inspectModalData, setInspectModalData] = useState<DataTraceabilityInfo | null>(null);

  // Load Saved Visualizations & Snapshots from IndexedDB
  const loadSavedData = async () => {
    try {
      const vizs = await db.getAll<SavedVisualization>(STORES.SAVED_VISUALIZATIONS);
      const snaps = await db.getAll<AnalyticsSnapshot>(STORES.ANALYTICS_SNAPSHOTS);
      setSavedVisualizations(vizs || []);
      setSnapshots(snaps || []);
    } catch (err) {
      console.warn('Error loading Atlas persistence stores:', err);
    }
  };

  useEffect(() => {
    loadSavedData();
  }, []);

  // Compute Analytics Dataset using EnergyAnalyticsEngine
  const dataset = EnergyAnalyticsEngine.buildInvoiceDataset(
    invoices,
    appliances,
    household,
    tariff,
    timeFilter
  );

  const stats = EnergyAnalyticsEngine.calculateStatistics(dataset);
  const peaks = EnergyAnalyticsEngine.calculatePeaks(dataset);
  const trends = EnergyAnalyticsEngine.calculateTrends(dataset);
  const currency = household?.currencySymbol || dataset.currency;

  // Handlers for Saved Visualizations
  const handleSaveCurrentVisualization = async (title: string, description: string) => {
    const newViz: SavedVisualization = {
      id: `viz-${Date.now()}`,
      householdId: household?.id || 'household-primary',
      title,
      description,
      chartType,
      renderMode,
      dateRange: timeFilter,
      sourceInvoiceIds: dataset.periods.map(p => p.invoiceId),
      configuration: {
        metric: chartType === 'spend-3d' ? 'spend' : 'consumption',
        showGrid: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
    };

    await db.put(STORES.SAVED_VISUALIZATIONS, newViz);
    await loadSavedData();
  };

  const handleDeleteVisualization = async (id: string) => {
    await db.delete(STORES.SAVED_VISUALIZATIONS, id);
    await loadSavedData();
  };

  const handleToggleFavorite = async (id: string) => {
    const target = savedVisualizations.find(v => v.id === id);
    if (!target) return;
    const updated = { ...target, isFavorite: !target.isFavorite, updatedAt: new Date().toISOString() };
    await db.put(STORES.SAVED_VISUALIZATIONS, updated);
    await loadSavedData();
  };

  const handleOpenSavedVisualization = (viz: SavedVisualization) => {
    setChartType(viz.chartType);
    setRenderMode(viz.renderMode);
    setTimeFilter(viz.dateRange);
    setActiveTab('3d-canvas');
  };

  // If no invoices exist
  if (invoices.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Centro de Investigación Energética</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ATLAS ENERGÉTICO
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            «Explora, visualiza y comprende la evolución de tu consumo eléctrico».
          </p>
        </div>

        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg mx-auto">
          <Box className="w-12 h-12 mx-auto text-cyan-400/60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Sin facturas registradas para construir el Atlas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Atlas Energético genera modelos tridimensionales, matrices 3D y análisis históricos comparativos a partir de tus facturas reales. Registra tu primer recibo para desbloquear el observatorio.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddInvoice}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition inline-flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Factura</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-500 font-bold text-[11px] uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Centro de Análisis Científico e Histórico</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ATLAS ENERGÉTICO
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            «Explora, visualiza y comprende la evolución de tu consumo eléctrico».
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('3d-canvas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === '3d-canvas'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Visualizador 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparator')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'comparator'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Comparar Periodos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('statistics')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'statistics'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Estadísticas & Récords</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'saved'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Mis Análisis ({savedVisualizations.length})</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Facturas Analizadas
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {dataset.invoicesCount} <span className="text-xs font-normal text-slate-400">ciclos</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate block">
            {dataset.dateRange.start || '—'} al {dataset.dateRange.end || '—'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Consumo Acumulado
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {dataset.totalConsumptionKwh.toLocaleString()} <span className="text-xs font-normal">kWh</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Promedio: <strong className="font-mono text-slate-600 dark:text-slate-300">{dataset.averageMonthlyConsumptionKwh} kWh/m</strong>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Gasto Acumulado
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {currency}{dataset.totalSpend.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">
            Promedio: <strong className="font-mono text-slate-600 dark:text-slate-300">{currency}{dataset.averageMonthlySpend.toLocaleString()}/m</strong>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Pico Histórico de Consumo
          </span>
          <span className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
            {peaks.maxConsumption ? `${peaks.maxConsumption.value} kWh` : '—'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {peaks.maxConsumption?.periodLabel || 'Sin registros'}
          </span>
        </div>
      </div>

      {/* Tab 1: 3D Visualization & Matrix */}
      {activeTab === '3d-canvas' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-xs">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold shrink-0">Variable 3D:</span>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ThreeChartType)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="consumption-3d">Evolución de Consumo Activo (kWh)</option>
                <option value="spend-3d">Trayectoria de Gasto Facturado ({currency})</option>
                <option value="components-3d">Componentes de Factura (Energía, Fijos, IVA)</option>
                <option value="category-3d">Matriz 3D por Categoría de Aparatos (Est.)</option>
                <option value="unit-cost-3d">Costo Medio Unitario Efectivo ({currency}/kWh)</option>
                <option value="matrix-3d">Matriz Tridimensional de Magnitudes</option>
              </select>
            </div>

            {/* Time Filter Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold shrink-0">Periodo:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeRangeFilter)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="all">Todas las facturas</option>
                <option value="3m">Últimos 3 ciclos</option>
                <option value="6m">Últimos 6 ciclos</option>
                <option value="12m">Últimos 12 ciclos</option>
                <option value="current-year">Año actual</option>
                <option value="prev-year">Año anterior</option>
              </select>
            </div>

            {/* Render Mode Selector (3D WebGL vs 2D Proporcional vs Tabla) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setRenderMode('3d')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  renderMode === '3d'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Box className="w-3 h-3" />
                <span>3D WebGL</span>
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('table')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  renderMode === 'table'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Tabla Sincronizada</span>
              </button>
            </div>
          </div>

          {/* Render 3D Canvas or Table */}
          {renderMode === '3d' ? (
            <ThreeEnergyCanvas
              dataset={dataset}
              chartType={chartType}
              onInspectPoint={setInspectModalData}
            />
          ) : (
            <AnalyticalTable2D
              dataset={dataset}
              onInspectPoint={setInspectModalData}
            />
          )}
        </div>
      )}

      {/* Tab 2: Period Comparator */}
      {activeTab === 'comparator' && (
        <PeriodComparatorTab dataset={dataset} />
      )}

      {/* Tab 3: Statistics & Peaks Radar */}
      {activeTab === 'statistics' && (
        <StatisticsRadarTab dataset={dataset} />
      )}

      {/* Tab 4: Saved Analyses Library */}
      {activeTab === 'saved' && (
        <SavedAnalysesTab
          savedList={savedVisualizations}
          snapshots={snapshots}
          onOpenVisualization={handleOpenSavedVisualization}
          onSaveCurrentVisualization={handleSaveCurrentVisualization}
          onDeleteVisualization={handleDeleteVisualization}
          onToggleFavorite={handleToggleFavorite}
          currentChartType={chartType}
        />
      )}

      {/* Traceability Modal ("Ver origen del dato") */}
      <TraceabilityModal
        isOpen={inspectModalData !== null}
        onClose={() => setInspectModalData(null)}
        data={inspectModalData}
      />
    </div>
  );
};
