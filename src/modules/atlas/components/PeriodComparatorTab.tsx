import React, { useState } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  DollarSign,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { AnalyticsDataset, PeriodMetrics } from '../../../types/atlas';
import { EnergyAnalyticsEngine } from '../../../core/analytics/energy-analytics-engine';
import { OriginBadge } from '../../../components/ui/OriginBadge';

interface PeriodComparatorTabProps {
  dataset: AnalyticsDataset;
}

export const PeriodComparatorTab: React.FC<PeriodComparatorTabProps> = ({ dataset }) => {
  const { periods, currency } = dataset;

  const [periodAId, setPeriodAId] = useState<string>(() => {
    return periods.length > 1 ? periods[periods.length - 2].invoiceId : periods[0]?.invoiceId || '';
  });
  const [periodBId, setPeriodBId] = useState<string>(() => {
    return periods.length > 0 ? periods[periods.length - 1].invoiceId : '';
  });

  if (periods.length < 2) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-slate-500">
        <GitCompare className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Se requieren al menos 2 facturas para comparar periodos
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Registra o carga tus recibos eléctricos para analizar variaciones de consumo, efectos tarifarios y descomposición causal de la factura.
        </p>
      </div>
    );
  }

  const comparison = EnergyAnalyticsEngine.comparePeriods(dataset, periodAId, periodBId);
  if (!comparison) return null;

  const { periodA, periodB, causeDecomposition } = comparison;

  return (
    <div className="space-y-6">
      {/* Period Selection Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Periodo Base / Referencia (A)
            </label>
            <select
              value={periodAId}
              onChange={(e) => setPeriodAId(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {periods.map((p) => (
                <option key={p.invoiceId} value={p.invoiceId}>
                  {p.periodLabel} ({p.periodStart} al {p.periodEnd}) — {p.consumptionKwh} kWh
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center justify-center p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-400 shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="w-full sm:w-1/2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Periodo de Comparación (B)
            </label>
            <select
              value={periodBId}
              onChange={(e) => setPeriodBId(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {periods.map((p) => (
                <option key={p.invoiceId} value={p.invoiceId}>
                  {p.periodLabel} ({p.periodStart} al {p.periodEnd}) — {p.consumptionKwh} kWh
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side KPI Cards Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Period A Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Periodo A (Base)
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {periodA.periodLabel}
              </h3>
            </div>
            <OriginBadge origin={periodA.dataOrigin} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Consumo Total</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {periodA.consumptionKwh} kWh
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Gasto Facturado</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {currency}{periodA.totalCost.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Consumo Diario</span>
              <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">
                {periodA.dailyConsumptionKwh} kWh/d
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Costo/kWh Efectivo</span>
              <span className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400">
                {currency}{periodA.effectiveCostPerKwh}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Duración: {periodA.billingDays} días</span>
            <span>Distribuidora: {periodA.distributor}</span>
          </div>
        </div>

        {/* Period B Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Periodo B (Comparación)
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {periodB.periodLabel}
              </h3>
            </div>
            <OriginBadge origin={periodB.dataOrigin} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Consumo Total</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {periodB.consumptionKwh} kWh
                </span>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    comparison.kwhDelta > 0 ? 'text-[#F07676]' : 'text-emerald-400'
                  }`}
                >
                  {comparison.kwhDelta > 0 ? `+${comparison.kwhDelta}` : comparison.kwhDelta} ({comparison.kwhDeltaPercentage > 0 ? `+${comparison.kwhDeltaPercentage}` : comparison.kwhDeltaPercentage}%)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Gasto Facturado</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {currency}{periodB.totalCost.toLocaleString()}
                </span>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    comparison.costDelta > 0 ? 'text-[#F07676]' : 'text-emerald-400'
                  }`}
                >
                  {comparison.costDelta > 0 ? `+${comparison.costDelta}` : comparison.costDelta} ({comparison.costDeltaPercentage > 0 ? `+${comparison.costDeltaPercentage}` : comparison.costDeltaPercentage}%)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Consumo Diario (Normalizado)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">
                  {periodB.dailyConsumptionKwh} kWh/d
                </span>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    comparison.dailyKwhDelta > 0 ? 'text-[#F07676]' : 'text-emerald-400'
                  }`}
                >
                  {comparison.dailyKwhDelta > 0 ? `+${comparison.dailyKwhDelta}` : comparison.dailyKwhDelta}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32]">
              <span className="text-slate-400 block text-[11px]">Costo/kWh Efectivo</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400">
                  {currency}{periodB.effectiveCostPerKwh}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({comparison.effectiveCostPerKwhDelta > 0 ? `+${comparison.effectiveCostPerKwhDelta}` : comparison.effectiveCostPerKwhDelta})
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Duración: {periodB.billingDays} días ({comparison.daysDelta > 0 ? `+${comparison.daysDelta}` : comparison.daysDelta} d)</span>
            <span>Distribuidora: {periodB.distributor}</span>
          </div>
        </div>
      </div>

      {/* Cause Decomposition & Diagnostic Proof */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Descomposición Causal del Diferencial de la Factura
              </h3>
              <p className="text-[11px] text-slate-400">
                Auditoría matemática independiente para determinar el origen exacto de la variación económica.
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Causa Dominante:{' '}
            <span className="text-cyan-400 uppercase">
              {causeDecomposition.primaryCause === 'volume' && 'Volumen de Energía (kWh)'}
              {causeDecomposition.primaryCause === 'tariff' && 'Tarifa o Salto de Bloque'}
              {causeDecomposition.primaryCause === 'duration' && 'Duración del Periodo (Días)'}
              {causeDecomposition.primaryCause === 'taxes_charges' && 'Impuestos y Cargos Fijos'}
              {causeDecomposition.primaryCause === 'stable' && 'Consumo Estable'}
            </span>
          </div>
        </div>

        {/* Impact Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Impacto por Volumen (kWh)
            </span>
            <span
              className={`text-base font-bold font-mono mt-1 block ${
                causeDecomposition.volumeImpactCost >= 0 ? 'text-[#F07676]' : 'text-emerald-400'
              }`}
            >
              {currency}{causeDecomposition.volumeImpactCost > 0 ? '+' : ''}{causeDecomposition.volumeImpactCost.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Valorado a tarifa base</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Impacto por Tarifa/Bloque
            </span>
            <span
              className={`text-base font-bold font-mono mt-1 block ${
                causeDecomposition.tariffImpactCost >= 0 ? 'text-[#F07676]' : 'text-emerald-400'
              }`}
            >
              {currency}{causeDecomposition.tariffImpactCost > 0 ? '+' : ''}{causeDecomposition.tariffImpactCost.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Por variación en costo/kWh</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Efecto Días Facturados
            </span>
            <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 block">
              {comparison.daysDelta > 0 ? `+${comparison.daysDelta}` : comparison.daysDelta} días
            </span>
            <span className="text-[10px] text-slate-400">
              ~{causeDecomposition.daysDurationImpactKwh > 0 ? `+${causeDecomposition.daysDurationImpactKwh}` : causeDecomposition.daysDurationImpactKwh} kWh atribuibles
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Cargos Fijos y Tributos
            </span>
            <span
              className={`text-base font-bold font-mono mt-1 block ${
                causeDecomposition.taxAndChargesImpactCost >= 0 ? 'text-[#F07676]' : 'text-emerald-400'
              }`}
            >
              {currency}{causeDecomposition.taxAndChargesImpactCost > 0 ? '+' : ''}{Math.round(causeDecomposition.taxAndChargesImpactCost).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Alumbrado, IVA y fijos</span>
          </div>
        </div>

        {/* Proven Factors List */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Factores Demostrados Matemáticamente:
          </span>
          <div className="space-y-1.5">
            {causeDecomposition.provenFactors.map((fact, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141F32]/60 border border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{fact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contextual Notes */}
        {causeDecomposition.contextualNotes.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Notas Metodológicas y de Contexto:
            </span>
            {causeDecomposition.contextualNotes.map((note, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-200"
              >
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
