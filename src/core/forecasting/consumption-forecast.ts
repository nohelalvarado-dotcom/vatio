import { ConsumptionForecast } from '../../types/diagnostic';
import { Invoice } from '../../types/invoice';
import { Tariff } from '../../types/tariff';
import { roundPrecision } from '../calculations/energy-math';
import { calculateTariffCost } from '../tariff-engine/tariff-engine';

/**
 * Generates transparent statistical forecast of upcoming consumption and bill projection.
 */
export function generateConsumptionForecast(
  invoices: Invoice[],
  activeTariff?: Tariff,
  targetDays: number = 30
): ConsumptionForecast | null {
  if (!invoices || invoices.length < 2) {
    return null;
  }

  // Chronological order
  const sorted = [...invoices].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  const n = sorted.length;
  // Calculate normalized daily consumption for each historical invoice
  const dailyRates = sorted.map(inv => inv.consumptionKwh / Math.max(1, inv.billingDays || 30));

  let projectedDailyKwh = 0;
  let method: 'promedio_movil' | 'tendencia_lineal' | 'tasa_diaria' = 'promedio_movil';
  let explanation = '';

  if (n >= 4) {
    // Linear regression on daily consumption rates: y = mx + c
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = dailyRates[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Project next period at x = n
    const regressionNextDaily = intercept + slope * n;
    // Bound reasonably to prevent extreme deviations
    projectedDailyKwh = Math.max(0.5, regressionNextDaily);
    method = 'tendencia_lineal';
    explanation = `Tendencia lineal calculada sobre ${n} periodos históricos (pendiente: ${roundPrecision(slope, 3)} kWh/día por periodo).`;
  } else {
    // Weighted moving average (recent periods have higher weight)
    const weights = n === 2 ? [0.4, 0.6] : [0.2, 0.3, 0.5];
    const recent = dailyRates.slice(-weights.length);
    let weightedDaily = 0;
    for (let i = 0; i < recent.length; i++) {
      weightedDaily += recent[i] * weights[i];
    }
    projectedDailyKwh = weightedDaily;
    method = 'promedio_movil';
    explanation = `Promedio ponderado de los últimos ${recent.length} periodos con mayor peso en el periodo más reciente.`;
  }

  const projectedKwh = roundPrecision(projectedDailyKwh * targetDays, 1);

  // Confidence margin based on variance of historical daily rates
  const mean = dailyRates.reduce((a, b) => a + b, 0) / n;
  const variance = dailyRates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const marginKwh = roundPrecision(stdDev * targetDays, 1);

  const minKwh = Math.max(10, roundPrecision(projectedKwh - marginKwh, 1));
  const maxKwh = roundPrecision(projectedKwh + marginKwh, 1);

  // Cost projection
  let projectedCost = 0;
  let minCost = 0;
  let maxCost = 0;

  if (activeTariff) {
    projectedCost = calculateTariffCost(activeTariff, projectedKwh).totalCalculated;
    minCost = calculateTariffCost(activeTariff, minKwh).totalCalculated;
    maxCost = calculateTariffCost(activeTariff, maxKwh).totalCalculated;
  } else {
    // Fallback to recent average cost per kWh
    const avgRate = sorted[sorted.length - 1].declaredTotal / Math.max(1, sorted[sorted.length - 1].consumptionKwh);
    projectedCost = roundPrecision(projectedKwh * avgRate, 2);
    minCost = roundPrecision(minKwh * avgRate, 2);
    maxCost = roundPrecision(maxKwh * avgRate, 2);
  }

  const confidence: 'Alta' | 'Media' | 'Baja' = n >= 6 ? 'Alta' : n >= 3 ? 'Media' : 'Baja';

  return {
    methodUsed: method,
    forecastPeriodDays: targetDays,
    projectedKwh,
    projectedCost,
    confidenceInterval: {
      minKwh,
      maxKwh,
      minCost,
      maxCost,
    },
    explanation,
    confidence,
    historicalPeriodsAnalyzed: n,
  };
}
