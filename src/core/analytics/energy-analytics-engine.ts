import { Invoice } from '../../types/invoice';
import { Appliance } from '../../types/appliance';
import { Household } from '../../types/household';
import { Tariff } from '../../types/tariff';
import {
  AnalyticsDataset,
  PeriodMetrics,
  PeriodComparison,
  PeakAnalysis,
  PeakItem,
  TrendAnalysis,
  EnergyStatistics,
  TimeRangeFilter,
} from '../../types/atlas';

export class EnergyAnalyticsEngine {
  /**
   * Transforms raw invoices into a structured, chronological AnalyticsDataset.
   */
  public static buildInvoiceDataset(
    invoices: Invoice[],
    appliances: Appliance[] = [],
    household: Household | null = null,
    tariff: Tariff | null = null,
    filter: TimeRangeFilter = 'all'
  ): AnalyticsDataset {
    // 1. Filter by household if household is provided
    let list = household ? invoices.filter(i => i.householdId === household.id) : [...invoices];

    // 2. Sort chronologically by periodStart
    list.sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());

    // 3. Apply time range filtering
    if (filter === '3m' && list.length > 3) {
      list = list.slice(-3);
    } else if (filter === '6m' && list.length > 6) {
      list = list.slice(-6);
    } else if (filter === '12m' && list.length > 12) {
      list = list.slice(-12);
    } else if (filter === 'current-year' && list.length > 0) {
      const latestYear = new Date(list[list.length - 1].periodStart).getFullYear();
      list = list.filter(i => new Date(i.periodStart).getFullYear() === latestYear);
    } else if (filter === 'prev-year' && list.length > 0) {
      const latestYear = new Date(list[list.length - 1].periodStart).getFullYear();
      list = list.filter(i => new Date(i.periodStart).getFullYear() === latestYear - 1);
    }

    // 4. Map into PeriodMetrics
    const currency = household?.currencySymbol || (list[0]?.currency === 'USD' ? '$' : '₡');

    const periods: PeriodMetrics[] = list.map(inv => {
      const billingDays = Math.max(1, inv.billingDays || 30);
      const consumptionKwh = Math.max(0, inv.consumptionKwh || 0);
      const totalCost = Math.max(0, inv.declaredTotal || 0);
      const dailyKwh = Math.round((consumptionKwh / billingDays) * 100) / 100;
      const dailyCost = Math.round((totalCost / billingDays) * 100) / 100;
      const effectiveCostPerKwh =
        consumptionKwh > 0 ? Math.round((totalCost / consumptionKwh) * 100) / 100 : 0;

      // Extract itemized breakdown from charges
      let energyCharge = 0;
      let fixedCharge = 0;
      let taxes = 0;
      let streetLighting = 0;
      let otherCharges = 0;

      if (inv.charges && inv.charges.length > 0) {
        for (const ch of inv.charges) {
          if (ch.category === 'energy') energyCharge += ch.amount;
          else if (ch.category === 'fixed_charge') fixedCharge += ch.amount;
          else if (ch.category === 'tax') taxes += ch.amount;
          else if (ch.category === 'street_lighting') streetLighting += ch.amount;
          else otherCharges += ch.amount;
        }
      } else {
        // Fallback: estimate 85% energy, 10% taxes/charges, 5% street lighting
        energyCharge = Math.round(totalCost * 0.85);
        taxes = Math.round(totalCost * 0.1);
        streetLighting = totalCost - energyCharge - taxes;
      }

      const pDate = new Date(inv.periodStart);
      const year = pDate.getFullYear();
      const month = pDate.getMonth() + 1;
      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      const periodLabel = `${monthNames[pDate.getMonth()]} ${String(year).slice(2)}`;

      return {
        id: `metrics-${inv.id}`,
        invoiceId: inv.id,
        householdId: inv.householdId,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        billingDays,
        periodLabel,
        year,
        month,
        consumptionKwh,
        dailyConsumptionKwh: dailyKwh,
        previousReading: inv.previousReading,
        currentReading: inv.currentReading,
        readingDerivedKwh: inv.readingDerivedKwh,
        totalCost,
        dailyCost,
        effectiveCostPerKwh,
        currency,
        energyCharge,
        fixedCharge,
        taxes,
        streetLighting,
        otherCharges,
        tariffId: inv.tariffId,
        distributor: inv.distributor,
        auditStatus: inv.auditStatus || 'verified_exact',
        dataOrigin: inv.dataOrigin || 'MEDIDO',
      };
    });

    const totalConsumptionKwh = periods.reduce((sum, p) => sum + p.consumptionKwh, 0);
    const totalSpend = periods.reduce((sum, p) => sum + p.totalCost, 0);
    const averageMonthlyConsumptionKwh =
      periods.length > 0 ? Math.round((totalConsumptionKwh / periods.length) * 10) / 10 : 0;
    const averageMonthlySpend =
      periods.length > 0 ? Math.round(totalSpend / periods.length) : 0;

    const dateRange = {
      start: periods[0]?.periodStart || '',
      end: periods[periods.length - 1]?.periodEnd || '',
    };

    return {
      householdId: household?.id || 'household-primary',
      periods,
      invoicesCount: periods.length,
      dateRange,
      totalConsumptionKwh,
      totalSpend,
      averageMonthlyConsumptionKwh,
      averageMonthlySpend,
      currency,
      household,
      appliances,
      tariff,
    };
  }

  /**
   * Compares two periods with mathematical rigor, normalized daily rates, and cause decomposition.
   */
  public static comparePeriods(
    dataset: AnalyticsDataset,
    periodAId: string,
    periodBId: string
  ): PeriodComparison | null {
    const periodA = dataset.periods.find(p => p.invoiceId === periodAId || p.id === periodAId);
    const periodB = dataset.periods.find(p => p.invoiceId === periodBId || p.id === periodBId);

    if (!periodA || !periodB) return null;

    const kwhDelta = periodB.consumptionKwh - periodA.consumptionKwh;
    const kwhDeltaPercentage =
      periodA.consumptionKwh > 0 ? Math.round((kwhDelta / periodA.consumptionKwh) * 1000) / 10 : 0;

    const costDelta = periodB.totalCost - periodA.totalCost;
    const costDeltaPercentage =
      periodA.totalCost > 0 ? Math.round((costDelta / periodA.totalCost) * 1000) / 10 : 0;

    const daysDelta = periodB.billingDays - periodA.billingDays;
    const dailyKwhDelta = Math.round((periodB.dailyConsumptionKwh - periodA.dailyConsumptionKwh) * 100) / 100;
    const dailyKwhDeltaPercentage =
      periodA.dailyConsumptionKwh > 0
        ? Math.round((dailyKwhDelta / periodA.dailyConsumptionKwh) * 1000) / 10
        : 0;

    const dailyCostDelta = Math.round((periodB.dailyCost - periodA.dailyCost) * 100) / 100;
    const dailyCostDeltaPercentage =
      periodA.dailyCost > 0 ? Math.round((dailyCostDelta / periodA.dailyCost) * 1000) / 10 : 0;

    const effectiveCostPerKwhDelta =
      Math.round((periodB.effectiveCostPerKwh - periodA.effectiveCostPerKwh) * 100) / 100;

    // Cause decomposition
    // 1. Volume impact: delta kWh valued at base period rate
    const volumeImpactCost = Math.round(kwhDelta * periodA.effectiveCostPerKwh);
    // 2. Tariff impact: change in effective rate applied to new consumption
    const tariffImpactCost = Math.round(effectiveCostPerKwhDelta * periodB.consumptionKwh);
    // 3. Days duration variance: impact of difference in billing cycle length
    const daysDurationImpactKwh = Math.round(daysDelta * periodA.dailyConsumptionKwh * 10) / 10;
    // 4. Taxes and additional charges delta
    const taxAndChargesImpactCost =
      (periodB.taxes + periodB.streetLighting + periodB.fixedCharge) -
      (periodA.taxes + periodA.streetLighting + periodA.fixedCharge);

    // Identify primary cause
    const absVol = Math.abs(volumeImpactCost);
    const absTar = Math.abs(tariffImpactCost);
    const absDays = Math.abs(daysDelta);

    let primaryCause: 'volume' | 'tariff' | 'duration' | 'taxes_charges' | 'stable' = 'stable';
    if (Math.abs(costDelta) < 100 && Math.abs(kwhDelta) < 5) {
      primaryCause = 'stable';
    } else if (absDays >= 5 && Math.abs(daysDurationImpactKwh) > Math.abs(kwhDelta) * 0.5) {
      primaryCause = 'duration';
    } else if (absVol >= absTar) {
      primaryCause = 'volume';
    } else {
      primaryCause = 'tariff';
    }

    const provenFactors: string[] = [];
    if (kwhDelta !== 0) {
      provenFactors.push(
        `Variación de consumo de ${kwhDelta > 0 ? '+' : ''}${kwhDelta} kWh (${kwhDeltaPercentage > 0 ? '+' : ''}${kwhDeltaPercentage}%).`
      );
    }
    if (daysDelta !== 0) {
      provenFactors.push(
        `Diferencia de duración del periodo: ${periodB.billingDays} días vs ${periodA.billingDays} días (${daysDelta > 0 ? '+' : ''}${daysDelta} días).`
      );
    }
    if (Math.abs(effectiveCostPerKwhDelta) >= 0.5) {
      provenFactors.push(
        `Costo medio efectivo por kWh varió en ${effectiveCostPerKwhDelta > 0 ? '+' : ''}${dataset.currency}${effectiveCostPerKwhDelta}/kWh debido a estructura de bloques o cambios tarifarios.`
      );
    }
    if (taxAndChargesImpactCost !== 0) {
      provenFactors.push(
        `Cargos fijos, alumbrado y tributos variaron en ${taxAndChargesImpactCost > 0 ? '+' : ''}${dataset.currency}${Math.round(taxAndChargesImpactCost)}.`
      );
    }

    const contextualNotes: string[] = [];
    if (daysDelta !== 0) {
      contextualNotes.push(
        `El consumo diario normalizado (${periodB.dailyConsumptionKwh} kWh/d vs ${periodA.dailyConsumptionKwh} kWh/d, delta ${dailyKwhDeltaPercentage > 0 ? '+' : ''}${dailyKwhDeltaPercentage}%) refleja con mayor exactitud el cambio de hábito que el total bruto del recibo.`
      );
    }
    if (periodB.consumptionKwh > 200 && periodA.consumptionKwh <= 200) {
      contextualNotes.push(
        'El periodo posterior superó el límite del Bloque 1 (200 kWh), gravando el excedente en el Bloque 2 a una tarifa marginal superior.'
      );
    }
    if (periodB.consumptionKwh > 280 && periodA.consumptionKwh <= 280) {
      contextualNotes.push(
        'El periodo posterior superó el umbral de exención de IVA (280 kWh en Costa Rica), agregando el 13% sobre el total facturado.'
      );
    }

    return {
      periodA,
      periodB,
      kwhDelta,
      kwhDeltaPercentage,
      costDelta,
      costDeltaPercentage,
      daysDelta,
      dailyKwhDelta,
      dailyKwhDeltaPercentage,
      dailyCostDelta,
      dailyCostDeltaPercentage,
      effectiveCostPerKwhDelta,
      causeDecomposition: {
        volumeImpactCost,
        tariffImpactCost,
        daysDurationImpactKwh,
        taxAndChargesImpactCost,
        primaryCause,
        provenFactors,
        contextualNotes,
      },
    };
  }

  /**
   * Computes peak historical values, records, and minimums with period traceability.
   */
  public static calculatePeaks(dataset: AnalyticsDataset): PeakAnalysis {
    const { periods, currency } = dataset;

    if (periods.length === 0) {
      return {
        maxConsumption: null,
        minConsumption: null,
        maxSpend: null,
        minSpend: null,
        maxDailyConsumption: null,
        maxEffectiveCostPerKwh: null,
        minEffectiveCostPerKwh: null,
        maxMomIncrease: null,
        maxMomDecrease: null,
        instantaneousPeakDemandKw: {
          isAvailable: false,
          explanation:
            'La demanda máxima instantánea (kW) requiere telemetría de potencia de un medidor inteligente. Las facturas residenciales estándar registran energía acumulada (kWh), de la cual se determinan máximos mensuales y promedios diarios documentados.',
        },
      };
    }

    // Max & Min consumption
    const sortedByKwh = [...periods].sort((a, b) => b.consumptionKwh - a.consumptionKwh);
    const maxKwhPeriod = sortedByKwh[0];
    const minKwhPeriod = sortedByKwh[sortedByKwh.length - 1];

    const maxConsumption: PeakItem = {
      value: maxKwhPeriod.consumptionKwh,
      formattedValue: `${maxKwhPeriod.consumptionKwh.toLocaleString()} kWh`,
      unit: 'kWh',
      periodId: maxKwhPeriod.invoiceId,
      periodLabel: maxKwhPeriod.periodLabel,
      periodDate: `${maxKwhPeriod.periodStart} al ${maxKwhPeriod.periodEnd}`,
      contextText: `Máximo histórico registrado en ciclo de ${maxKwhPeriod.billingDays} días.`,
      dataOrigin: maxKwhPeriod.dataOrigin,
    };

    const minConsumption: PeakItem = {
      value: minKwhPeriod.consumptionKwh,
      formattedValue: `${minKwhPeriod.consumptionKwh.toLocaleString()} kWh`,
      unit: 'kWh',
      periodId: minKwhPeriod.invoiceId,
      periodLabel: minKwhPeriod.periodLabel,
      periodDate: `${minKwhPeriod.periodStart} al ${minKwhPeriod.periodEnd}`,
      contextText: `Mínimo histórico registrado en ciclo de ${minKwhPeriod.billingDays} días.`,
      dataOrigin: minKwhPeriod.dataOrigin,
    };

    // Max & Min Spend
    const sortedBySpend = [...periods].sort((a, b) => b.totalCost - a.totalCost);
    const maxSpendPeriod = sortedBySpend[0];
    const minSpendPeriod = sortedBySpend[sortedBySpend.length - 1];

    const maxSpend: PeakItem = {
      value: maxSpendPeriod.totalCost,
      formattedValue: `${currency}${maxSpendPeriod.totalCost.toLocaleString()}`,
      unit: currency,
      periodId: maxSpendPeriod.invoiceId,
      periodLabel: maxSpendPeriod.periodLabel,
      periodDate: `${maxSpendPeriod.periodStart} al ${maxSpendPeriod.periodEnd}`,
      contextText: `Mayor desembolso mensual documentado (${maxSpendPeriod.consumptionKwh} kWh).`,
      dataOrigin: maxSpendPeriod.dataOrigin,
    };

    const minSpend: PeakItem = {
      value: minSpendPeriod.totalCost,
      formattedValue: `${currency}${minSpendPeriod.totalCost.toLocaleString()}`,
      unit: currency,
      periodId: minSpendPeriod.invoiceId,
      periodLabel: minSpendPeriod.periodLabel,
      periodDate: `${minSpendPeriod.periodStart} al ${minSpendPeriod.periodEnd}`,
      contextText: `Menor desembolso mensual documentado (${minSpendPeriod.consumptionKwh} kWh).`,
      dataOrigin: minSpendPeriod.dataOrigin,
    };

    // Max Daily Consumption
    const sortedByDailyKwh = [...periods].sort((a, b) => b.dailyConsumptionKwh - a.dailyConsumptionKwh);
    const maxDailyPeriod = sortedByDailyKwh[0];
    const maxDailyConsumption: PeakItem = {
      value: maxDailyPeriod.dailyConsumptionKwh,
      formattedValue: `${maxDailyPeriod.dailyConsumptionKwh} kWh/día`,
      unit: 'kWh/día',
      periodId: maxDailyPeriod.invoiceId,
      periodLabel: maxDailyPeriod.periodLabel,
      periodDate: `${maxDailyPeriod.periodStart} al ${maxDailyPeriod.periodEnd}`,
      contextText: `Intensidad de uso más alta calculada (${maxDailyPeriod.consumptionKwh} kWh en ${maxDailyPeriod.billingDays} días).`,
      dataOrigin: 'CALCULADO',
    };

    // Max & Min Effective Cost
    const sortedByUnitCost = [...periods].filter(p => p.effectiveCostPerKwh > 0).sort((a, b) => b.effectiveCostPerKwh - a.effectiveCostPerKwh);
    const maxUnitPeriod = sortedByUnitCost[0] || periods[0];
    const minUnitPeriod = sortedByUnitCost[sortedByUnitCost.length - 1] || periods[0];

    const maxEffectiveCostPerKwh: PeakItem = {
      value: maxUnitPeriod.effectiveCostPerKwh,
      formattedValue: `${currency}${maxUnitPeriod.effectiveCostPerKwh} / kWh`,
      unit: `${currency}/kWh`,
      periodId: maxUnitPeriod.invoiceId,
      periodLabel: maxUnitPeriod.periodLabel,
      periodDate: `${maxUnitPeriod.periodStart} al ${maxUnitPeriod.periodEnd}`,
      contextText: `Mayor costo medio unitario resultante de cargos fijos e impuestos.`,
      dataOrigin: 'CALCULADO',
    };

    const minEffectiveCostPerKwh: PeakItem = {
      value: minUnitPeriod.effectiveCostPerKwh,
      formattedValue: `${currency}${minUnitPeriod.effectiveCostPerKwh} / kWh`,
      unit: `${currency}/kWh`,
      periodId: minUnitPeriod.invoiceId,
      periodLabel: minUnitPeriod.periodLabel,
      periodDate: `${minUnitPeriod.periodStart} al ${minUnitPeriod.periodEnd}`,
      contextText: `Menor costo medio unitario registrado.`,
      dataOrigin: 'CALCULADO',
    };

    // MoM shifts
    let maxIncrease: { percentage: number; kwhDelta: number; fromPeriod: string; toPeriod: string } | null = null;
    let maxDecrease: { percentage: number; kwhDelta: number; fromPeriod: string; toPeriod: string } | null = null;

    for (let i = 1; i < periods.length; i++) {
      const prev = periods[i - 1];
      const curr = periods[i];
      const deltaKwh = curr.consumptionKwh - prev.consumptionKwh;
      const pct = prev.consumptionKwh > 0 ? (deltaKwh / prev.consumptionKwh) * 100 : 0;

      if (deltaKwh > 0 && (!maxIncrease || pct > maxIncrease.percentage)) {
        maxIncrease = {
          percentage: Math.round(pct * 10) / 10,
          kwhDelta: deltaKwh,
          fromPeriod: prev.periodLabel,
          toPeriod: curr.periodLabel,
        };
      }
      if (deltaKwh < 0 && (!maxDecrease || pct < maxDecrease.percentage)) {
        maxDecrease = {
          percentage: Math.round(pct * 10) / 10,
          kwhDelta: deltaKwh,
          fromPeriod: prev.periodLabel,
          toPeriod: curr.periodLabel,
        };
      }
    }

    return {
      maxConsumption,
      minConsumption,
      maxSpend,
      minSpend,
      maxDailyConsumption,
      maxEffectiveCostPerKwh,
      minEffectiveCostPerKwh,
      maxMomIncrease: maxIncrease,
      maxMomDecrease: maxDecrease,
      instantaneousPeakDemandKw: {
        isAvailable: false,
        explanation:
          'La demanda máxima instantánea de potencia (kW) no está disponible en las lecturas de los recibos residenciales vigentes. Las mediciones documentadas corresponden a consumo activo de energía (kWh).',
      },
    };
  }

  /**
   * Computes linear trend slopes and trajectories across periods.
   */
  public static calculateTrends(dataset: AnalyticsDataset): TrendAnalysis {
    const { periods } = dataset;
    const n = periods.length;

    if (n < 2) {
      return {
        sampleSize: n,
        kwhSlopePerPeriod: 0,
        kwhDirection: 'stable',
        spendSlopePerPeriod: 0,
        spendDirection: 'stable',
        dailyConsumptionTrend: 'stable',
        methodologyNotes: 'Se requieren al menos 2 periodos consecutivos para estimar una tendencia.',
        sampleWarning: 'Muestra insuficiente para regresión lineal confiable.',
      };
    }

    // Linear regression on index (0, 1, 2, ... n-1)
    let sumX = 0;
    let sumKwh = 0;
    let sumSpend = 0;
    let sumXDaily = 0;
    let sumXX = 0;
    let sumXKwh = 0;
    let sumXSpend = 0;

    for (let i = 0; i < n; i++) {
      const p = periods[i];
      sumX += i;
      sumKwh += p.consumptionKwh;
      sumSpend += p.totalCost;
      sumXDaily += p.dailyConsumptionKwh;
      sumXX += i * i;
      sumXKwh += i * p.consumptionKwh;
      sumXSpend += i * p.totalCost;
    }

    const denominator = n * sumXX - sumX * sumX;
    const kwhSlope = denominator !== 0 ? (n * sumXKwh - sumX * sumKwh) / denominator : 0;
    const spendSlope = denominator !== 0 ? (n * sumXSpend - sumX * sumSpend) / denominator : 0;

    const roundedKwhSlope = Math.round(kwhSlope * 10) / 10;
    const roundedSpendSlope = Math.round(spendSlope);

    let kwhDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (roundedKwhSlope > 1.5) kwhDirection = 'increasing';
    else if (roundedKwhSlope < -1.5) kwhDirection = 'decreasing';

    let spendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (roundedSpendSlope > 500) spendDirection = 'increasing';
    else if (roundedSpendSlope < -500) spendDirection = 'decreasing';

    let sampleWarning: string | undefined;
    if (n < 4) {
      sampleWarning = `Muestra reducida (${n} periodos). La pendiente indica la dirección secuencial entre periodos registrados, no una proyección anual desestacionalizada.`;
    }

    return {
      sampleSize: n,
      kwhSlopePerPeriod: roundedKwhSlope,
      kwhDirection,
      spendSlopePerPeriod: roundedSpendSlope,
      spendDirection,
      dailyConsumptionTrend: kwhDirection,
      methodologyNotes: `Regresión lineal por mínimos cuadrados ordinarios (MCO) sobre los ${n} periodos ordenados cronológicamente.`,
      sampleWarning,
    };
  }

  /**
   * Computes comprehensive descriptive statistics, per capita and carbon footprint.
   */
  public static calculateStatistics(dataset: AnalyticsDataset): EnergyStatistics {
    const { periods, household } = dataset;
    const count = periods.length;

    if (count === 0) {
      return {
        count: 0,
        kwhSum: 0,
        kwhMean: 0,
        kwhMedian: 0,
        kwhMin: 0,
        kwhMax: 0,
        kwhStdDev: 0,
        kwhVariance: 0,
        costSum: 0,
        costMean: 0,
        costMedian: 0,
        costMin: 0,
        costMax: 0,
        costStdDev: 0,
        effectiveCostMean: 0,
        effectiveCostMin: 0,
        effectiveCostMax: 0,
        estimatedCo2KgAnnual: 0,
        co2FactorUsed: 0.045,
        co2GridNote: 'Matriz eléctrica de Costa Rica (>98% fuentes renovables).',
      };
    }

    const kwhValues = periods.map(p => p.consumptionKwh).sort((a, b) => a - b);
    const costValues = periods.map(p => p.totalCost).sort((a, b) => a - b);
    const unitCosts = periods.map(p => p.effectiveCostPerKwh).filter(c => c > 0).sort((a, b) => a - b);

    // Sums
    const kwhSum = kwhValues.reduce((a, b) => a + b, 0);
    const costSum = costValues.reduce((a, b) => a + b, 0);

    // Means
    const kwhMean = Math.round((kwhSum / count) * 10) / 10;
    const costMean = Math.round(costSum / count);
    const effectiveCostMean =
      unitCosts.length > 0
        ? Math.round((unitCosts.reduce((a, b) => a + b, 0) / unitCosts.length) * 100) / 100
        : 0;

    // Medians
    const mid = Math.floor(count / 2);
    const kwhMedian = count % 2 !== 0 ? kwhValues[mid] : Math.round(((kwhValues[mid - 1] + kwhValues[mid]) / 2) * 10) / 10;
    const costMedian = count % 2 !== 0 ? costValues[mid] : Math.round((costValues[mid - 1] + costValues[mid]) / 2);

    // Variance & Standard Deviation
    const kwhVariance =
      Math.round(
        (kwhValues.reduce((sum, val) => sum + Math.pow(val - kwhMean, 2), 0) / count) * 100
      ) / 100;
    const kwhStdDev = Math.round(Math.sqrt(kwhVariance) * 10) / 10;

    const costVariance =
      Math.round(
        costValues.reduce((sum, val) => sum + Math.pow(val - costMean, 2), 0) / count
      );
    const costStdDev = Math.round(Math.sqrt(costVariance));

    // Per capita & area
    const occupants = household?.occupants && household.occupants > 0 ? household.occupants : undefined;
    const area = household?.areaSquareMeters && household.areaSquareMeters > 0 ? household.areaSquareMeters : undefined;

    const kwhPerCapitaMonthly = occupants ? Math.round((kwhMean / occupants) * 10) / 10 : undefined;
    const costPerCapitaMonthly = occupants ? Math.round(costMean / occupants) : undefined;

    const kwhPerSquareMeterMonthly = area ? Math.round((kwhMean / area) * 100) / 100 : undefined;
    const costPerSquareMeterMonthly = area ? Math.round((costMean / area) * 10) / 10 : undefined;

    // Carbon Footprint
    // Factor CR: ~0.045 kg CO2/kWh; Factor promedio internacional: ~0.35 kg CO2/kWh
    const isCostaRica = household?.country?.toLowerCase().includes('costa rica') || household?.distributor === 'ICE';
    const co2Factor = isCostaRica ? 0.045 : 0.35;
    const annualKwh = kwhMean * 12;
    const estimatedCo2KgAnnual = Math.round(annualKwh * co2Factor * 10) / 10;
    const co2GridNote = isCostaRica
      ? 'Factor SEN Costa Rica (0.045 kg CO₂e/kWh): Matriz de alta penetración renovable (hidroeléctrica, geotérmica y eólica).'
      : `Factor promedio de red (${co2Factor} kg CO₂e/kWh) para proyección anual.`;

    return {
      count,
      kwhSum,
      kwhMean,
      kwhMedian,
      kwhMin: kwhValues[0],
      kwhMax: kwhValues[count - 1],
      kwhStdDev,
      kwhVariance,
      costSum,
      costMean,
      costMedian,
      costMin: costValues[0],
      costMax: costValues[count - 1],
      costStdDev,
      effectiveCostMean,
      effectiveCostMin: unitCosts[0] || 0,
      effectiveCostMax: unitCosts[unitCosts.length - 1] || 0,
      kwhPerCapitaMonthly,
      costPerCapitaMonthly,
      kwhPerSquareMeterMonthly,
      costPerSquareMeterMonthly,
      estimatedCo2KgAnnual,
      co2FactorUsed: co2Factor,
      co2GridNote,
    };
  }
}
