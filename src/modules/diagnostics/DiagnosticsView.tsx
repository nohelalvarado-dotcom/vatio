import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart2,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { DiagnosticItem } from '../../types/diagnostic';
import { Invoice } from '../../types/invoice';
import { Appliance } from '../../types/appliance';
import { Tariff } from '../../types/tariff';
import { generateConsumptionForecast } from '../../core/forecasting/consumption-forecast';

interface DiagnosticsViewProps {
  diagnostics: DiagnosticItem[];
  invoices: Invoice[];
  appliances: Appliance[];
  tariff?: Tariff;
  currencySymbol: string;
  onUpdateDiagnosticStatus: (id: string, status: 'pendiente' | 'revisado' | 'descartado') => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  diagnostics,
  invoices,
  appliances,
  tariff,
  currencySymbol,
  onUpdateDiagnosticStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'revisado' | 'descartado'>('all');

  // Forecast engine
  const forecast = generateConsumptionForecast(invoices, tariff, 30);

  const filteredDiagnostics = diagnostics.filter(d => {
    if (filterStatus === 'all') return true;
    return d.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-amber-500" />
          <span>Sistema de Diagnóstico y Pronóstico</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Auditoría estadística de patrones de consumo, detección de discrepancias y proyección matemática del próximo recibo.
        </p>
      </div>

      {/* Consumption Forecast Card (Part 12.7, 12.8) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#192B40] to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Proyección Estadística del Próximo Recibo (30 Días)
            </span>
            <h2 className="text-xl font-bold mt-0.5">
              Pronóstico Local sin Servicios Externos
            </h2>
          </div>
          {forecast && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Confianza {forecast.confidence} ({forecast.methodUsed === 'tendencia_lineal' ? 'Tendencia Lineal' : 'Promedio Ponderado'})
            </span>
          )}
        </div>

        {forecast ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block font-sans">Consumo Proyectado</span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                  {forecast.projectedKwh} kWh
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Intervalo: {forecast.confidenceInterval.minKwh} - {forecast.confidenceInterval.maxKwh} kWh
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block font-sans">Gasto Estimado Próximo Recibo</span>
                <span className="text-2xl font-black font-mono text-cyan-300 mt-1 block">
                  {currencySymbol} {Math.round(forecast.projectedCost).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Intervalo: {currencySymbol}{Math.round(forecast.confidenceInterval.minCost).toLocaleString()} - {currencySymbol}{Math.round(forecast.confidenceInterval.maxCost).toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block font-sans">Historial Analizado</span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">
                  {forecast.historicalPeriodsAnalyzed} facturas
                </span>
                <span className="text-[10px] text-slate-400">Normalizadas por días de ciclo</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 block font-sans">Tarifa de Proyección</span>
                <span className="text-sm font-bold text-white mt-1 block truncate">
                  {tariff ? tariff.name : 'Tarifa Plana'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {tariff ? tariff.distributor : 'General'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              • {forecast.explanation} El intervalo de confianza considera la desviación típica histórica.
            </p>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-300">
              Todavía no hay suficientes datos históricos para generar una predicción fiable.
            </p>
            <p>Se requieren al menos 2 facturas registradas en periodos diferentes para calcular tendencias estadísticas.</p>
          </div>
        )}
      </div>

      {/* Diagnostics Filters */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <span>Hallazgos y Anomalías ({diagnostics.length}):</span>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {(['all', 'pendiente', 'revisado', 'descartado'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-md capitalize font-semibold transition ${
                filterStatus === st
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {st === 'all' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostics Cards List */}
      {filteredDiagnostics.length > 0 ? (
        <div className="space-y-4">
          {filteredDiagnostics.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition shadow-xs space-y-3 ${
                item.severity === 'alerta'
                  ? 'bg-red-50/30 dark:bg-red-950/15 border-red-200 dark:border-red-900/40'
                  : item.severity === 'advertencia'
                  ? 'bg-amber-50/30 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/40'
                  : 'bg-white dark:bg-[#111C2C] border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {item.severity === 'alerta' ? (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  ) : item.severity === 'advertencia' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-cyan-500 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Detectado: {item.date} • Categoría: {item.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Confianza {item.confidence}
                  </span>

                  {item.status === 'pendiente' ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateDiagnosticStatus(item.id, 'revisado')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                      >
                        <Check className="w-3 h-3" />
                        <span>Marcar Revisado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateDiagnosticStatus(item.id, 'descartado')}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        title="Descartar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold uppercase text-slate-400 px-2">
                      {item.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>

              {/* Numerical Evidence & Calculation */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-mono space-y-1.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">
                    Evidencia Numérica:
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {item.numericalEvidence}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">
                    Cálculo Explicativo:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {item.calculationExplanation}
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Recomendación para el usuario:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {item.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111C2C] p-6 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Sin diagnósticos pendientes
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            El motor matemático no detectó inconsistencias de facturación, discrepancias en medidor ni picos anómalos en los registros analizados.
          </p>
        </div>
      )}
    </div>
  );
};
