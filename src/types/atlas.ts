import { Invoice } from './invoice';
import { Appliance } from './appliance';
import { Household, OriginLabel } from './household';
import { Tariff } from './tariff';

export type AtlasViewTab = 'overview' | '3d-canvas' | 'comparator' | 'statistics' | 'saved';

export type ThreeChartType =
  | 'consumption-3d'
  | 'spend-3d'
  | 'components-3d'
  | 'category-3d'
  | 'unit-cost-3d'
  | 'matrix-3d'
  | 'comparison-3d';

export type TimeRangeFilter = '3m' | '6m' | '12m' | 'current-year' | 'prev-year' | 'all' | 'custom';

export interface PeriodMetrics {
  id: string;
  invoiceId: string;
  householdId: string;
  periodStart: string;
  periodEnd: string;
  billingDays: number;
  periodLabel: string;
  year: number;
  month: number;
  
  // Energy metrics
  consumptionKwh: number;
  dailyConsumptionKwh: number;
  previousReading?: number;
  currentReading?: number;
  readingDerivedKwh?: number;

  // Financial metrics
  totalCost: number;
  dailyCost: number;
  effectiveCostPerKwh: number;
  currency: string;

  // Itemized breakdown
  energyCharge: number;
  fixedCharge: number;
  taxes: number;
  streetLighting: number;
  otherCharges: number;

  // Metadata & Audit
  tariffId?: string;
  distributor: string;
  auditStatus: string;
  dataOrigin: 'MEDIDO' | 'DECLARADO' | 'CALCULADO' | 'ESTIMADO' | 'PREDICHO' | 'NO_VERIFICADO';
}

export interface AnalyticsDataset {
  householdId: string;
  periods: PeriodMetrics[];
  invoicesCount: number;
  dateRange: { start: string; end: string };
  totalConsumptionKwh: number;
  totalSpend: number;
  averageMonthlyConsumptionKwh: number;
  averageMonthlySpend: number;
  currency: string;
  household: Household | null;
  appliances: Appliance[];
  tariff: Tariff | null;
}

export interface PeakItem {
  value: number;
  formattedValue: string;
  unit: string;
  periodId: string;
  periodLabel: string;
  periodDate: string;
  contextText: string;
  dataOrigin: OriginLabel;
}

export interface PeakAnalysis {
  maxConsumption: PeakItem | null;
  minConsumption: PeakItem | null;
  maxSpend: PeakItem | null;
  minSpend: PeakItem | null;
  maxDailyConsumption: PeakItem | null;
  maxEffectiveCostPerKwh: PeakItem | null;
  minEffectiveCostPerKwh: PeakItem | null;
  maxMomIncrease: {
    percentage: number;
    kwhDelta: number;
    fromPeriod: string;
    toPeriod: string;
  } | null;
  maxMomDecrease: {
    percentage: number;
    kwhDelta: number;
    fromPeriod: string;
    toPeriod: string;
  } | null;
  instantaneousPeakDemandKw: {
    isAvailable: boolean;
    value?: number;
    explanation: string;
  };
}

export interface PeriodComparison {
  periodA: PeriodMetrics;
  periodB: PeriodMetrics;
  
  // Absolute & percentage differentials
  kwhDelta: number;
  kwhDeltaPercentage: number;
  costDelta: number;
  costDeltaPercentage: number;
  
  // Normalized daily comparisons (accounts for billing day variance)
  daysDelta: number;
  dailyKwhDelta: number;
  dailyKwhDeltaPercentage: number;
  dailyCostDelta: number;
  dailyCostDeltaPercentage: number;
  
  effectiveCostPerKwhDelta: number;

  // Cause decomposition
  causeDecomposition: {
    volumeImpactCost: number;     // Cost impact directly from kWh change
    tariffImpactCost: number;     // Cost impact from unit rate change
    daysDurationImpactKwh: number;// Normalized kWh difference due to days length
    taxAndChargesImpactCost: number;// Differential from taxes/fixed charges
    primaryCause: 'volume' | 'tariff' | 'duration' | 'taxes_charges' | 'stable';
    provenFactors: string[];
    contextualNotes: string[];
  };
}

export interface TrendAnalysis {
  sampleSize: number;
  kwhSlopePerPeriod: number;     // Linear regression slope
  kwhDirection: 'increasing' | 'decreasing' | 'stable';
  spendSlopePerPeriod: number;
  spendDirection: 'increasing' | 'decreasing' | 'stable';
  dailyConsumptionTrend: 'increasing' | 'decreasing' | 'stable';
  methodologyNotes: string;
  sampleWarning?: string;
}

export interface EnergyStatistics {
  count: number;
  // Consumption stats
  kwhSum: number;
  kwhMean: number;
  kwhMedian: number;
  kwhMin: number;
  kwhMax: number;
  kwhStdDev: number;
  kwhVariance: number;
  
  // Cost stats
  costSum: number;
  costMean: number;
  costMedian: number;
  costMin: number;
  costMax: number;
  costStdDev: number;
  
  // Unit cost stats
  effectiveCostMean: number;
  effectiveCostMin: number;
  effectiveCostMax: number;
  
  // Per capita and area stats
  kwhPerCapitaMonthly?: number;
  costPerCapitaMonthly?: number;
  kwhPerSquareMeterMonthly?: number;
  costPerSquareMeterMonthly?: number;

  // CO2 footprint
  estimatedCo2KgAnnual: number;
  co2FactorUsed: number;
  co2GridNote: string;
}

export interface AnalyticsSnapshot {
  id: string;
  householdId: string;
  invoiceId?: string;
  title: string;
  periodStart?: string;
  periodEnd?: string;
  dataType: string;
  createdAt: string;
  generatedAt: string;
  sourceInvoiceIds: string[];
  methodologyVersion: string;
  status: 'active' | 'archived';
  metricsSummary: {
    consumptionKwh: number;
    declaredTotal: number;
    effectiveCostPerKwh: number;
    dailyKwh: number;
  };
}

export interface SavedVisualization {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  chartType: ThreeChartType;
  renderMode: '3d' | '2d' | 'table';
  dateRange: TimeRangeFilter;
  sourceInvoiceIds: string[];
  configuration: {
    metric: 'consumption' | 'spend' | 'unit_cost' | 'components';
    perspectiveAngle?: number;
    showGrid?: boolean;
    colorPalette?: string;
    customNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export interface DataTraceabilityInfo {
  metricName: string;
  value: string | number;
  unit: string;
  formula?: string;
  provenance: 'MEDIDO' | 'DECLARADO' | 'CALCULADO' | 'ESTIMADO' | 'PREDICHO' | 'NO_VERIFICADO';
  sourceInvoiceId?: string;
  sourceInvoiceNumber?: string;
  periodDates?: string;
  underlyingInputs?: Array<{ label: string; value: string | number }>;
  explanation: string;
}
