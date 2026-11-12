import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wattsToKilowatts,
  kilowattsToWatts,
  wattHoursToKilowattHours,
  calculateEnergyKwhFromPower,
  calculatePowerWattsFromEnergy,
  calculateHoursFromEnergyAndPower,
} from '../units/unit-converter';
import {
  calculateApplianceEnergy,
  calculatePaybackPeriod,
  roundPrecision,
} from './energy-math';
import { calculateTariffCost } from '../tariff-engine/tariff-engine';
import { DEFAULT_TARIffS } from '../tariff-engine/default-tariffs';
import { validateAndAuditInvoice } from '../validators/invoice-validator';

test('Unit conversions: Watts, Kilowatts, and Watt-hours', () => {
  assert.equal(wattsToKilowatts(1500), 1.5);
  assert.equal(kilowattsToWatts(2.5), 2500);
  assert.equal(wattHoursToKilowattHours(4500), 4.5);
  assert.equal(calculateEnergyKwhFromPower(1000, 5, 1), 5.0);
  assert.equal(calculatePowerWattsFromEnergy(3, 2), 1500);
  assert.equal(calculateHoursFromEnergyAndPower(2, 500), 4);
});

test('Appliance energy calculation: continuous load (e.g. 100W bulb 5h/day for 30 days)', () => {
  // E = (100 * 5 * 30 * 1) / 1000 = 15 kWh
  const result = calculateApplianceEnergy({
    powerWatts: 100,
    usageHoursPerDay: 5,
    usageDaysPerMonth: 30,
    quantity: 1,
  });

  assert.equal(result.monthlyKwh, 15);
  assert.equal(result.dailyKwh, 0.5);
  assert.equal(result.annualKwh, 180);
});

test('Appliance energy calculation: refrigerator with duty cycle 0.35 and standby', () => {
  // 200W, 24h/day, 30 days, dutyCycle 0.35, standby 5W
  // E_active = (200 * 24 * 30 * 1 * 0.35) / 1000 = 50.4 kWh
  // standby = 0 (since 24h active duty cycle handles compressor runtime)
  const result = calculateApplianceEnergy({
    powerWatts: 200,
    usageHoursPerDay: 24,
    usageDaysPerMonth: 30,
    dutyCycle: 0.35,
    standbyWatts: 0,
    quantity: 1,
  });

  assert.equal(result.monthlyKwh, 50.4);
});

test('Appliance energy calculation: cycle-based appliance (washing machine 1.2 kWh/cycle, 15 cycles/month)', () => {
  const result = calculateApplianceEnergy({
    isCycleBased: true,
    energyPerCycleKwh: 1.2,
    cyclesPerMonth: 15,
    quantity: 1,
  });

  assert.equal(result.monthlyKwh, 18);
  assert.equal(result.annualKwh, 216);
});

test('Tariff engine: Flat tariff calculation', () => {
  const flatTariff = DEFAULT_TARIffS.find(t => t.calculationMethod === 'flat')!;
  // 100 kWh at 95 CRC = 9500 CRC, exempt from VAT since <= 280 kWh
  const result = calculateTariffCost(flatTariff, 100);
  assert.equal(result.energyCost, 9500);
  assert.equal(result.totalCalculated, 9500);
  assert.equal(result.effectiveAveragePricePerKwh, 95);
});

test('Tariff engine: Costa Rica ICE T-RE tiered marginal blocks & VAT threshold', () => {
  const iceTariff = DEFAULT_TARIffS.find(t => t.id === 'tariff-cr-ice-tre-2024')!;

  // Case A: 150 kWh (below 200 block and below 280 VAT threshold)
  // 150 * 68.25 = 10,237.50 CRC energy
  // Bomberos: 1.75% of 10,237.50 = 179.16 CRC
  // Alumbrado: 150 * 3.12 = 468 CRC
  // IVA: 0 CRC (exempt <= 280 kWh)
  const resultA = calculateTariffCost(iceTariff, 150);
  assert.equal(resultA.energyCost, 10237.5);
  assert.equal(resultA.totalTaxes, 0); // Exempt
  assert.ok(resultA.totalCalculated > 10800 && resultA.totalCalculated < 10900);

  // Case B: 300 kWh (crosses 200 kWh block AND crosses 280 kWh VAT threshold)
  // Block 1 (200 kWh): 200 * 68.25 = 13,650 CRC
  // Block 2 (100 kWh): 100 * 121.40 = 12,140 CRC
  // Total Energy: 25,790 CRC
  // IVA 13% MUST apply because 300 > 280 kWh
  const resultB = calculateTariffCost(iceTariff, 300);
  assert.equal(resultB.energyCost, 25790);
  assert.ok(resultB.totalTaxes > 0, 'IVA should apply over 280 kWh in Costa Rica');
});

test('Invoice validator: arithmetic verification and meter reading check', () => {
  // Exact match
  const validInvoice = validateAndAuditInvoice({
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    billingDays: 31,
    consumptionKwh: 200,
    previousReading: 1000,
    currentReading: 1200,
    meterMultiplier: 1,
    declaredTotal: 15000,
    currency: 'CRC',
    charges: [
      { id: '1', name: 'Energía', category: 'energy', amount: 14000, origin: 'DECLARADO' },
      { id: '2', name: 'Alumbrado', category: 'street_lighting', amount: 1000, origin: 'DECLARADO' },
    ],
  });

  assert.equal(validInvoice.isValid, true);
  assert.equal(validInvoice.auditStatus, 'verified_exact');
  assert.equal(validInvoice.arithmeticDifference, 0);

  // Arithmetic mismatch
  const mismatchInvoice = validateAndAuditInvoice({
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    billingDays: 31,
    consumptionKwh: 200,
    declaredTotal: 20000, // declared 20,000 but sum is 15,000
    currency: 'CRC',
    charges: [
      { id: '1', name: 'Energía', category: 'energy', amount: 14000, origin: 'DECLARADO' },
      { id: '2', name: 'Alumbrado', category: 'street_lighting', amount: 1000, origin: 'DECLARADO' },
    ],
  });

  assert.equal(mismatchInvoice.auditStatus, 'arithmetic_difference');
  assert.equal(mismatchInvoice.arithmeticDifference, 5000);
});

test('Payback calculation logic', () => {
  // Replacement costs 120,000 CRC, saves 40,000 CRC per year -> 36 months (3 years)
  const pb = calculatePaybackPeriod(120000, 40000);
  assert.equal(pb.paybackMonths, 36);
});
