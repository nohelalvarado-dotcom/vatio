/**
 * Independent mathematical calculation engine for appliances and household energy consumption.
 * Rigorous formulas with visible steps and explanations.
 */

export interface ApplianceCalculationInput {
  powerWatts?: number;
  standbyWatts?: number;
  usageHoursPerDay?: number;
  usageDaysPerMonth?: number;
  quantity?: number;
  dutyCycle?: number; // 0 to 1.0 (default 1.0)
  isCycleBased?: boolean;
  energyPerCycleKwh?: number;
  cyclesPerMonth?: number;
}

export interface ApplianceCalculationOutput {
  dailyKwh: number;
  monthlyKwh: number;
  annualKwh: number;
  standbyMonthlyKwh: number;
  activeMonthlyKwh: number;
  formulaDescription: string;
  numericalSteps: string[];
}

export function roundPrecision(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates monthly kWh for an appliance with transparent mathematical breakdown.
 * Formula for continuous/stable appliance:
 * E_active = (P * h * d * n * dutyCycle) / 1000
 * E_standby = (P_standby * (24 - h) * d * n) / 1000
 *
 * Formula for cycle-based appliance:
 * E_mes = E_ciclo * N_ciclos * n
 */
export function calculateApplianceEnergy(input: ApplianceCalculationInput): ApplianceCalculationOutput {
  const quantity = Math.max(1, input.quantity || 1);
  const steps: string[] = [];

  if (input.isCycleBased && (input.energyPerCycleKwh !== undefined || input.cyclesPerMonth !== undefined)) {
    const energyPerCycle = Math.max(0, input.energyPerCycleKwh || 0);
    const cycles = Math.max(0, input.cyclesPerMonth || 0);
    const monthlyKwh = roundPrecision(energyPerCycle * cycles * quantity, 3);
    const dailyKwh = roundPrecision(monthlyKwh / 30, 3);
    const annualKwh = roundPrecision(monthlyKwh * 12, 2);

    steps.push(`Modo por ciclos:`);
    steps.push(`E_mes = E_ciclo (${energyPerCycle} kWh) × Ciclos/mes (${cycles}) × Unidades (${quantity})`);
    steps.push(`E_mes = ${monthlyKwh} kWh`);

    return {
      dailyKwh,
      monthlyKwh,
      annualKwh,
      standbyMonthlyKwh: 0,
      activeMonthlyKwh: monthlyKwh,
      formulaDescription: 'E_mes = E_ciclo × N_ciclos × n',
      numericalSteps: steps,
    };
  }

  const watts = Math.max(0, input.powerWatts || 0);
  const hours = Math.min(24, Math.max(0, input.usageHoursPerDay || 0));
  const days = Math.min(31, Math.max(0, input.usageDaysPerMonth !== undefined ? input.usageDaysPerMonth : 30));
  const duty = Math.min(1.0, Math.max(0.01, input.dutyCycle !== undefined ? input.dutyCycle : 1.0));
  const standbyWatts = Math.max(0, input.standbyWatts || 0);

  // Active consumption
  // E = (P * h * d * n * duty) / 1000
  const activeMonthlyKwh = roundPrecision((watts * hours * days * quantity * duty) / 1000, 3);
  const activeDailyKwh = roundPrecision((watts * hours * quantity * duty) / 1000, 3);

  // Standby consumption (runs during non-active hours of active days, or 24h if 0 hours active)
  const standbyHours = Math.max(0, 24 - hours);
  const standbyMonthlyKwh = roundPrecision((standbyWatts * standbyHours * days * quantity) / 1000, 3);

  const totalMonthlyKwh = roundPrecision(activeMonthlyKwh + standbyMonthlyKwh, 3);
  const totalDailyKwh = roundPrecision(activeDailyKwh + (standbyMonthlyKwh / (days || 1)), 3);
  const totalAnnualKwh = roundPrecision(totalMonthlyKwh * 12, 2);

  steps.push(`Potencia nominal: ${watts} W | Horas diarias: ${hours} h | Días/mes: ${days} | Cantidad: ${quantity}`);
  if (duty < 1.0) {
    steps.push(`Factor de trabajo (ciclo compresor/termostato): ${(duty * 100).toFixed(0)}%`);
    steps.push(`E_activa = (${watts} W × ${hours} h × ${days} d × ${quantity} × ${duty}) / 1000 = ${activeMonthlyKwh} kWh`);
  } else {
    steps.push(`E_activa = (${watts} W × ${hours} h × ${days} d × ${quantity}) / 1000 = ${activeMonthlyKwh} kWh`);
  }

  if (standbyWatts > 0) {
    steps.push(`Consumo en espera (standby): (${standbyWatts} W × ${standbyHours} h × ${days} d × ${quantity}) / 1000 = ${standbyMonthlyKwh} kWh`);
    steps.push(`Total mensual = ${activeMonthlyKwh} + ${standbyMonthlyKwh} = ${totalMonthlyKwh} kWh`);
  }

  return {
    dailyKwh: totalDailyKwh,
    monthlyKwh: totalMonthlyKwh,
    annualKwh: totalAnnualKwh,
    standbyMonthlyKwh,
    activeMonthlyKwh,
    formulaDescription: duty < 1.0 
      ? 'E = (P × h × d × n × FactorCiclo) / 1000 + E_espera'
      : 'E = (P × h × d × n) / 1000 + E_espera',
    numericalSteps: steps,
  };
}

/**
 * Payback calculation in months.
 * Payback (months) = (Replacement Cost / (Annual Savings / 12))
 */
export function calculatePaybackPeriod(
  replacementCost: number,
  annualSavingsCost: number
): { paybackMonths: number | null; explanation: string } {
  if (replacementCost <= 0 || annualSavingsCost <= 0) {
    return {
      paybackMonths: null,
      explanation: 'No es posible calcular retorno sin costo de reemplazo y ahorro anual positivo.',
    };
  }
  const monthlySavings = annualSavingsCost / 12;
  const paybackMonths = roundPrecision(replacementCost / monthlySavings, 1);
  return {
    paybackMonths,
    explanation: `Retorno = ${replacementCost} / (${annualSavingsCost} / 12) = ${paybackMonths} meses (${(paybackMonths / 12).toFixed(1)} años)`,
  };
}
