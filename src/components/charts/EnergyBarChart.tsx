import React, { useState } from 'react';
import { Invoice } from '../../types/invoice';

interface EnergyBarChartProps {
  invoices: Invoice[];
  currency?: string;
}

export const EnergyBarChart: React.FC<EnergyBarChartProps> = ({
  invoices,
  currency = '₡',
}) => {
  const [metric, setMetric] = useState<'kwh' | 'cost'>('kwh');
  const [range, setRange] = useState<'3m' | '6m' | '12m' | 'all'>('6m');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          No hay datos de consumo histórico disponibles.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Registra tus facturas para visualizar la evolución del consumo.
        </p>
      </div>
    );
  }

  // Sort chronological
  const sorted = [...invoices].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  // Filter by range
  let filtered = sorted;
  if (range === '3m') filtered = sorted.slice(-3);
  else if (range === '6m') filtered = sorted.slice(-6);
  else if (range === '12m') filtered = sorted.slice(-12);

  const values = filtered.map(inv => (metric === 'kwh' ? inv.consumptionKwh : inv.declaredTotal));
  const maxValue = Math.max(...values, metric === 'kwh' ? 100 : 10000);

  const chartHeight = 180;
  const barWidth = 36;
  const gap = 24;
  const totalWidth = Math.max(340, filtered.length * (barWidth + gap) + 40);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Metric toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMetric('kwh')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              metric === 'kwh'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Consumo (kWh)
          </button>
          <button
            type="button"
            onClick={() => setMetric('cost')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              metric === 'cost'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Gasto ({currency})
          </button>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 text-slate-500">
          {(['3m', '6m', '12m', 'all'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded font-medium transition ${
                range === r
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {r === '3m' ? '3 Meses' : r === '6m' ? '6 Meses' : r === '12m' ? '12 Meses' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Container */}
      <div className="overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + 50}`}
          className="w-full h-auto min-w-[340px]"
          aria-label="Gráfico de barras de evolución energética"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = chartHeight - pct * (chartHeight - 30);
            return (
              <g key={i}>
                <line
                  x1="30"
                  y1={y}
                  x2={totalWidth - 10}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-slate-200 dark:text-slate-800"
                />
                <text
                  x="25"
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {Math.round(maxValue * pct)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {filtered.map((inv, idx) => {
            const val = metric === 'kwh' ? inv.consumptionKwh : inv.declaredTotal;
            const barHeight = Math.max(4, (val / maxValue) * (chartHeight - 30));
            const x = 40 + idx * (barWidth + gap);
            const y = chartHeight - barHeight;
            const isHovered = hoveredIdx === idx;

            // Format date label (e.g. "Ene 24")
            const d = new Date(inv.periodStart);
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
            const dateLabel = !isNaN(d.getTime()) ? `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear().toString().slice(-2)}` : inv.periodStart.slice(0, 7);

            return (
              <g
                key={inv.id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  className={`transition-colors duration-150 ${
                    metric === 'kwh'
                      ? isHovered
                        ? 'fill-emerald-400 dark:fill-emerald-400'
                        : 'fill-emerald-500/80 dark:fill-emerald-500'
                      : isHovered
                      ? 'fill-cyan-400 dark:fill-cyan-400'
                      : 'fill-cyan-500/80 dark:fill-cyan-500'
                  }`}
                />

                {/* Value on top if hovered */}
                {isHovered && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="text-[11px] font-bold font-mono fill-slate-900 dark:fill-white"
                  >
                    {metric === 'kwh' ? `${val} kWh` : `${currency}${val.toLocaleString()}`}
                  </text>
                )}

                {/* X axis date label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-mono transition-colors ${
                    isHovered
                      ? 'fill-slate-900 dark:fill-white font-bold'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {dateLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered details box */}
      {hoveredIdx !== null && filtered[hoveredIdx] && (
        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Periodo: {filtered[hoveredIdx].periodStart} al {filtered[hoveredIdx].periodEnd}
            </span>
            <span className="text-slate-500 ml-2">({filtered[hoveredIdx].billingDays} días)</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <div>
              <span className="text-slate-500">Consumo:</span>{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {filtered[hoveredIdx].consumptionKwh} kWh
              </span>
            </div>
            <div>
              <span className="text-slate-500">Total:</span>{' '}
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {currency}
                {filtered[hoveredIdx].declaredTotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Promedio/día:</span>{' '}
              <span className="font-bold">
                {(filtered[hoveredIdx].consumptionKwh / Math.max(1, filtered[hoveredIdx].billingDays)).toFixed(2)} kWh/d
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
