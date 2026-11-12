import React from 'react';
import { Appliance, ApplianceCategory } from '../../types/appliance';

interface CategoryDonutChartProps {
  appliances: Appliance[];
  currency?: string;
}

const CATEGORY_LABELS: Record<ApplianceCategory, string> = {
  climatizacion: 'Climatización',
  cocina: 'Cocina',
  lavanderia: 'Lavandería',
  agua_caliente: 'Agua Caliente',
  entretenimiento: 'Entretenimiento',
  informatica: 'Informática',
  iluminacion: 'Iluminación',
  otros: 'Otros',
};

const CATEGORY_COLORS: Record<ApplianceCategory, string> = {
  climatizacion: '#37BDD0', // cyan
  cocina: '#EBAA44',        // amber
  lavanderia: '#6366F1',    // indigo
  agua_caliente: '#D95D5D', // red
  entretenimiento: '#A855F7',// purple
  informatica: '#3B82F6',   // blue
  iluminacion: '#31B77A',   // green
  otros: '#64748B',         // slate
};

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  appliances,
  currency = '₡',
}) => {
  const activeAppliances = appliances.filter(a => a.active);

  if (activeAppliances.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500">
        No hay aparatos activos registrados para generar la distribución.
      </div>
    );
  }

  // Aggregate by category
  const categoryMap: Partial<Record<ApplianceCategory, { kwh: number; cost: number; count: number }>> = {};
  let totalKwh = 0;

  for (const app of activeAppliances) {
    if (!categoryMap[app.category]) {
      categoryMap[app.category] = { kwh: 0, cost: 0, count: 0 };
    }
    const cat = categoryMap[app.category]!;
    cat.kwh += app.calculatedMonthlyKwh;
    cat.cost += app.calculatedMonthlyCost;
    cat.count += app.quantity;
    totalKwh += app.calculatedMonthlyKwh;
  }

  const categories = (Object.keys(categoryMap) as ApplianceCategory[]).map(catKey => {
    const data = categoryMap[catKey]!;
    const percentage = totalKwh > 0 ? (data.kwh / totalKwh) * 100 : 0;
    return {
      key: catKey,
      label: CATEGORY_LABELS[catKey],
      color: CATEGORY_COLORS[catKey],
      kwh: Math.round(data.kwh * 10) / 10,
      cost: Math.round(data.cost),
      count: data.count,
      percentage: Math.round(percentage * 10) / 10,
    };
  }).sort((a, b) => b.kwh - a.kwh);

  // Build SVG Donut slices
  let cumulativeAngle = 0;
  const size = 160;
  const center = size / 2;
  const radius = 60;
  const strokeWidth = 24;

  const slices = categories.map((cat) => {
    const angle = (cat.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // Circumference and dash array
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
    const strokeDashoffset = -((startAngle / 360) * circumference);

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="flex flex-col md:flex-row xl:flex-col 2xl:flex-row items-center gap-5 w-full">
      {/* SVG Donut */}
      <div className="relative shrink-0 flex items-center justify-center my-1">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          aria-label="Gráfico de distribución por categoría"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {slices.map((slice) => (
            <circle
              key={slice.key}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-300"
            />
          ))}
        </svg>

        {/* Center Total Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Est.</span>
          <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
            {Math.round(totalKwh)}
          </span>
          <span className="text-[10px] text-slate-400">kWh/mes</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-col gap-1.5 text-xs flex-1 w-full min-w-0">
        {categories.slice(0, 5).map((cat) => (
          <div
            key={cat.key}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-[#141F32] border border-slate-200/60 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]">
                {cat.label}
              </span>
            </div>
            <div className="text-right font-mono shrink-0 whitespace-nowrap text-[11px]">
              <span className="font-semibold text-slate-900 dark:text-white">
                {cat.percentage}%
              </span>
              <span className="text-[10px] text-slate-400 ml-1">
                ({cat.kwh} kWh)
              </span>
            </div>
          </div>
        ))}
        {categories.length > 5 && (
          <p className="text-[10px] text-slate-400 text-center pt-0.5">
            +{categories.length - 5} categorías adicionales
          </p>
        )}
      </div>
    </div>
  );
};
