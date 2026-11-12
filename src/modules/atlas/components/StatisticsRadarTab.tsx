import React from 'react';
import {
  BarChart2,
  TrendingUp,
  Activity,
  Users,
  Maximize,
  Leaf,
  ShieldCheck,
  AlertCircle,
  Clock,
  Zap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';
import { AnalyticsDataset, PeakAnalysis } from '../../../types/atlas';
import { EnergyAnalyticsEngine } from '../../../core/analytics/energy-analytics-engine';
import { OriginBadge } from '../../../components/ui/OriginBadge';

interface StatisticsRadarTabProps {
  dataset: AnalyticsDataset;
}

export const StatisticsRadarTab: React.FC<StatisticsRadarTabProps> = ({ dataset }) => {
  const stats = EnergyAnalyticsEngine.calculateStatistics(dataset);
  const peaks = EnergyAnalyticsEngine.calculatePeaks(dataset);
  const trends = EnergyAnalyticsEngine.calculateTrends(dataset);
  const { currency, household } = dataset;

  return (
    <div className="space-y-6">
      {/* Top Statistical Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mean & Median Consumption */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Consumo Promedio
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.kwhMean} <span className="text-xs font-normal text-slate-400">kWh/mes</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Mediana: <strong className="text-slate-700 dark:text-slate-300 font-mono">{stats.kwhMedian} kWh</strong></span>
            <span>σ = <strong className="font-mono">{stats.kwhStdDev}</strong></span>
          </div>
        </div>

        {/* Mean & Median Spend */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Gasto Promedio
            </span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {currency}{stats.costMean.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">/mes</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Mediana: <strong className="text-slate-700 dark:text-slate-300 font-mono">{currency}{stats.costMedian.toLocaleString()}</strong></span>
            <span>σ = <strong className="font-mono">{currency}{stats.costStdDev}</strong></span>
          </div>
        </div>

        {/* Per Capita Monthly */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Intensidad por Ocupante
            </span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
            {stats.kwhPerCapitaMonthly !== undefined ? stats.kwhPerCapitaMonthly : '—'}{' '}
            <span className="text-xs font-normal text-slate-400">kWh/hab/m</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>{household?.occupants || 1} ocupantes</span>
            <span className="font-mono">{stats.costPerCapitaMonthly ? `${currency}${stats.costPerCapitaMonthly}/hab` : '—'}</span>
          </div>
        </div>

        {/* Carbon Footprint */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Huella de Carbono Est.
            </span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
            {stats.estimatedCo2KgAnnual}{' '}
            <span className="text-xs font-normal text-slate-400">kg CO₂e/año</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-1.5 truncate" title={stats.co2GridNote}>
            {stats.co2GridNote}
          </p>
        </div>
      </div>

      {/* Historical Peaks and Extreme Values Radar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Récords, Extremos y Máximos Históricos Documentados
              </h3>
              <p className="text-[11px] text-slate-400">
                Picos de consumo, gasto e intensidades registrados a partir de facturas reales.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {stats.count} periodos analizados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Max Consumption */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Máximo Consumo Mensual
              </span>
              <OriginBadge origin={peaks.maxConsumption?.dataOrigin || 'MEDIDO'} />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {peaks.maxConsumption?.formattedValue || '—'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Periodo: <strong className="text-slate-800 dark:text-slate-200">{peaks.maxConsumption?.periodLabel || '—'}</strong>
            </div>
            <p className="text-[10px] text-slate-400">{peaks.maxConsumption?.contextText}</p>
          </div>

          {/* Min Consumption */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Mínimo Consumo Mensual
              </span>
              <OriginBadge origin={peaks.minConsumption?.dataOrigin || 'MEDIDO'} />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {peaks.minConsumption?.formattedValue || '—'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Periodo: <strong className="text-slate-800 dark:text-slate-200">{peaks.minConsumption?.periodLabel || '—'}</strong>
            </div>
            <p className="text-[10px] text-slate-400">{peaks.minConsumption?.contextText}</p>
          </div>

          {/* Max Spend */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Mayor Gasto Facturado
              </span>
              <OriginBadge origin={peaks.maxSpend?.dataOrigin || 'MEDIDO'} />
            </div>
            <div className="text-xl font-bold font-mono text-[#F07676]">
              {peaks.maxSpend?.formattedValue || '—'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Periodo: <strong className="text-slate-800 dark:text-slate-200">{peaks.maxSpend?.periodLabel || '—'}</strong>
            </div>
            <p className="text-[10px] text-slate-400">{peaks.maxSpend?.contextText}</p>
          </div>

          {/* Min Spend */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Menor Gasto Facturado
              </span>
              <OriginBadge origin={peaks.minSpend?.dataOrigin || 'MEDIDO'} />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-500">
              {peaks.minSpend?.formattedValue || '—'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Periodo: <strong className="text-slate-800 dark:text-slate-200">{peaks.minSpend?.periodLabel || '—'}</strong>
            </div>
            <p className="text-[10px] text-slate-400">{peaks.minSpend?.contextText}</p>
          </div>

          {/* Max Daily Consumption */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Mayor Intensidad Diaria
              </span>
              <OriginBadge origin="CALCULADO" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {peaks.maxDailyConsumption?.formattedValue || '—'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Periodo: <strong className="text-slate-800 dark:text-slate-200">{peaks.maxDailyConsumption?.periodLabel || '—'}</strong>
            </div>
            <p className="text-[10px] text-slate-400">{peaks.maxDailyConsumption?.contextText}</p>
          </div>

          {/* Instantaneous Demand kW Check */}
          <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#141F32]/50 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Demanda Máxima (kW)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                No Disponible
              </span>
            </div>
            <div className="text-base font-bold font-mono text-slate-400">
              Requiere Medidor Inteligente
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {peaks.instantaneousPeakDemandKw.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
