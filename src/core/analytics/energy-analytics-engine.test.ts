import { test } from 'node:test';
import assert from 'node:assert';
import { EnergyAnalyticsEngine } from './energy-analytics-engine';
import { Invoice } from '../../types/invoice';
import { Household } from '../../types/household';

const TEST_HOUSEHOLD: Household = {
  id: 'hh-test-1',
  name: 'Casa Modelo San José',
  country: 'Costa Rica',
  region: 'San José',
  city: 'Escazú',
  distributor: 'ICE',
  currency: 'CRC',
  currencySymbol: '₡',
  currencyDecimals: 0,
  timezone: 'America/Costa_Rica',
  installationType: 'home',
  occupants: 3,
  areaSquareMeters: 120,
  constructionType: 'Concreto',
  usageCategory: 'residential',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const TEST_INVOICES: Invoice[] = [
  {
    id: 'inv-test-1',
    householdId: 'hh-test-1',
    distributor: 'ICE',
    invoiceNumber: 'FAC-2024-05',
    issueDate: '2024-06-02',
    periodStart: '2024-05-01',
    periodEnd: '2024-05-31',
    billingDays: 31,
    consumptionKwh: 200,
    currency: 'CRC',
    declaredTotal: 16200,
    calculatedTotal: 16200,
    charges: [
      { id: 'c1', name: 'Energía', category: 'energy', amount: 14500, origin: 'DECLARADO' },
      { id: 'c2', name: 'Alumbrado Público', category: 'street_lighting', amount: 800, origin: 'DECLARADO' },
      { id: 'c3', name: 'Bomberos', category: 'fire_department', amount: 400, origin: 'DECLARADO' },
      { id: 'c4', name: 'Cargo Fijo', category: 'fixed_charge', amount: 500, origin: 'DECLARADO' },
    ],
    auditStatus: 'verified_exact',
    dataOrigin: 'MEDIDO',
    createdAt: '2024-06-02T00:00:00Z',
    updatedAt: '2024-06-02T00:00:00Z',
  },
  {
    id: 'inv-test-2',
    householdId: 'hh-test-1',
    distributor: 'ICE',
    invoiceNumber: 'FAC-2024-06',
    issueDate: '2024-07-02',
    periodStart: '2024-06-01',
    periodEnd: '2024-06-30',
    billingDays: 30,
    consumptionKwh: 260,
    currency: 'CRC',
    declaredTotal: 22800,
    calculatedTotal: 22800,
    charges: [
      { id: 'c1', name: 'Energía', category: 'energy', amount: 20500, origin: 'DECLARADO' },
      { id: 'c2', name: 'Alumbrado Público', category: 'street_lighting', amount: 900, origin: 'DECLARADO' },
      { id: 'c3', name: 'Bomberos', category: 'fire_department', amount: 500, origin: 'DECLARADO' },
      { id: 'c4', name: 'Cargo Fijo', category: 'fixed_charge', amount: 500, origin: 'DECLARADO' },
      { id: 'c5', name: 'Ajuste', category: 'adjustment', amount: 400, origin: 'DECLARADO' },
    ],
    auditStatus: 'verified_exact',
    dataOrigin: 'MEDIDO',
    createdAt: '2024-07-02T00:00:00Z',
    updatedAt: '2024-07-02T00:00:00Z',
  },
  {
    id: 'inv-test-3',
    householdId: 'hh-test-1',
    distributor: 'ICE',
    invoiceNumber: 'FAC-2024-07',
    issueDate: '2024-08-02',
    periodStart: '2024-07-01',
    periodEnd: '2024-07-31',
    billingDays: 31,
    consumptionKwh: 310,
    currency: 'CRC',
    declaredTotal: 33500,
    calculatedTotal: 33500,
    charges: [
      { id: 'c1', name: 'Energía', category: 'energy', amount: 28000, origin: 'DECLARADO' },
      { id: 'c2', name: 'Alumbrado Público', category: 'street_lighting', amount: 1000, origin: 'DECLARADO' },
      { id: 'c3', name: 'Bomberos', category: 'fire_department', amount: 600, origin: 'DECLARADO' },
      { id: 'c4', name: 'IVA 13%', category: 'tax', amount: 3400, origin: 'DECLARADO' },
      { id: 'c5', name: 'Cargo Fijo', category: 'fixed_charge', amount: 500, origin: 'DECLARADO' },
    ],
    auditStatus: 'verified_exact',
    dataOrigin: 'MEDIDO',
    createdAt: '2024-08-02T00:00:00Z',
    updatedAt: '2024-08-02T00:00:00Z',
  },
];

test('EnergyAnalyticsEngine: buildInvoiceDataset sorts chronologically and computes period metrics', () => {
  // Pass unsorted invoices to test chronological sorting
  const unsorted = [TEST_INVOICES[2], TEST_INVOICES[0], TEST_INVOICES[1]];
  const dataset = EnergyAnalyticsEngine.buildInvoiceDataset(unsorted, [], TEST_HOUSEHOLD, null, 'all');

  assert.strictEqual(dataset.periods.length, 3);
  assert.strictEqual(dataset.periods[0].invoiceId, 'inv-test-1');
  assert.strictEqual(dataset.periods[1].invoiceId, 'inv-test-2');
  assert.strictEqual(dataset.periods[2].invoiceId, 'inv-test-3');

  // Verify daily consumption: 200 kWh / 31 days = 6.45 kWh/d
  assert.strictEqual(dataset.periods[0].dailyConsumptionKwh, 6.45);
  // Period 2: 260 kWh / 30 days = 8.67 kWh/d
  assert.strictEqual(dataset.periods[1].dailyConsumptionKwh, 8.67);

  // Total consumption = 200 + 260 + 310 = 770 kWh
  assert.strictEqual(dataset.totalConsumptionKwh, 770);
  // Total spend = 16200 + 22800 + 33500 = 72500
  assert.strictEqual(dataset.totalSpend, 72500);
});

test('EnergyAnalyticsEngine: comparePeriods decomposes volume vs tariff and normalizes daily metrics', () => {
  const dataset = EnergyAnalyticsEngine.buildInvoiceDataset(TEST_INVOICES, [], TEST_HOUSEHOLD);
  const comp = EnergyAnalyticsEngine.comparePeriods(dataset, 'inv-test-1', 'inv-test-2');

  assert.ok(comp !== null);
  // Delta kWh: 260 - 200 = +60 kWh (+30%)
  assert.strictEqual(comp.kwhDelta, 60);
  assert.strictEqual(comp.kwhDeltaPercentage, 30);

  // Delta Cost: 22800 - 16200 = +6600 (+40.7%)
  assert.strictEqual(comp.costDelta, 6600);
  assert.strictEqual(comp.costDeltaPercentage, 40.7);

  // Daily kWh delta: 8.67 - 6.45 = +2.22 kWh/d
  assert.strictEqual(comp.dailyKwhDelta, 2.22);

  // Cause decomposition should identify volume increase
  assert.strictEqual(comp.causeDecomposition.primaryCause, 'volume');
  assert.ok(comp.causeDecomposition.provenFactors.length >= 2);
});

test('EnergyAnalyticsEngine: calculatePeaks correctly locates maximums, minimums and does not invent demand kW', () => {
  const dataset = EnergyAnalyticsEngine.buildInvoiceDataset(TEST_INVOICES, [], TEST_HOUSEHOLD);
  const peaks = EnergyAnalyticsEngine.calculatePeaks(dataset);

  // Max consumption = 310 kWh (inv-test-3)
  assert.strictEqual(peaks.maxConsumption?.value, 310);
  assert.strictEqual(peaks.maxConsumption?.periodId, 'inv-test-3');

  // Min consumption = 200 kWh (inv-test-1)
  assert.strictEqual(peaks.minConsumption?.value, 200);
  assert.strictEqual(peaks.minConsumption?.periodId, 'inv-test-1');

  // Max spend = ₡33,500 (inv-test-3)
  assert.strictEqual(peaks.maxSpend?.value, 33500);

  // Instantaneous demand kW should explicitly be marked unavailable with transparent explanation
  assert.strictEqual(peaks.instantaneousPeakDemandKw.isAvailable, false);
  assert.ok(peaks.instantaneousPeakDemandKw.explanation.includes('potencia'));
});

test('EnergyAnalyticsEngine: calculateTrends calculates linear regression slope', () => {
  const dataset = EnergyAnalyticsEngine.buildInvoiceDataset(TEST_INVOICES, [], TEST_HOUSEHOLD);
  const trends = EnergyAnalyticsEngine.calculateTrends(dataset);

  assert.strictEqual(trends.sampleSize, 3);
  // Periods: 200, 260, 310 -> strictly increasing
  assert.strictEqual(trends.kwhDirection, 'increasing');
  assert.strictEqual(trends.spendDirection, 'increasing');
  assert.ok(trends.kwhSlopePerPeriod > 0);
});

test('EnergyAnalyticsEngine: calculateStatistics computes accurate mean, median, std dev, per capita, and CO2', () => {
  const dataset = EnergyAnalyticsEngine.buildInvoiceDataset(TEST_INVOICES, [], TEST_HOUSEHOLD);
  const stats = EnergyAnalyticsEngine.calculateStatistics(dataset);

  // Mean = (200 + 260 + 310) / 3 = 256.7 kWh
  assert.strictEqual(stats.kwhMean, 256.7);
  // Median of [200, 260, 310] = 260
  assert.strictEqual(stats.kwhMedian, 260);

  // Per capita: 256.7 / 3 occupants = 85.6 kWh/persona/mes
  assert.strictEqual(stats.kwhPerCapitaMonthly, 85.6);

  // Per square meter: 256.7 / 120 m² = 2.14 kWh/m²/mes
  assert.strictEqual(stats.kwhPerSquareMeterMonthly, 2.14);

  // Costa Rica CO2 factor: 0.045 kg CO2/kWh
  assert.strictEqual(stats.co2FactorUsed, 0.045);
  // Annualized CO2: 256.7 * 12 * 0.045 = ~138.6 kg
  assert.strictEqual(stats.estimatedCo2KgAnnual, 138.6);
});
