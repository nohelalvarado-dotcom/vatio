import { Invoice, InvoiceAuditStatus, InvoiceComparison, InvoiceItemCharge } from '../../types/invoice';
import { Tariff } from '../../types/tariff';
import { roundPrecision } from '../calculations/energy-math';
import { calculateTariffCost } from '../tariff-engine/tariff-engine';

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  auditStatus: InvoiceAuditStatus;
  auditExplanation: string;
  calculatedItemsTotal: number;
  arithmeticDifference: number;
  readingDerivedKwh?: number;
  readingMismatch: boolean;
}

/**
 * Validates invoice inputs and executes mathematical audit of arithmetic and meter readings.
 */
export function validateAndAuditInvoice(
  invoice: Partial<Invoice>,
  appliedTariff?: Tariff
): InvoiceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Period checks
  if (!invoice.periodStart) errors.push('La fecha de inicio de periodo es obligatoria.');
  if (!invoice.periodEnd) errors.push('La fecha de finalización de periodo es obligatoria.');

  let billingDays = invoice.billingDays || 0;
  if (invoice.periodStart && invoice.periodEnd) {
    const start = new Date(invoice.periodStart).getTime();
    const end = new Date(invoice.periodEnd).getTime();
    if (end < start) {
      errors.push('La fecha de finalización no puede ser anterior a la de inicio.');
    } else {
      const calculatedDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (!invoice.billingDays) {
        billingDays = calculatedDays;
      } else if (Math.abs(invoice.billingDays - calculatedDays) > 3) {
        warnings.push(`Los días facturados (${invoice.billingDays}) difieren del intervalo entre fechas (${calculatedDays} días).`);
      }
    }
  }

  // 2. Consumption checks
  const consumptionKwh = invoice.consumptionKwh ?? 0;
  if (consumptionKwh < 0) {
    errors.push('El consumo en kWh no puede ser negativo.');
  }

  // 3. Declared total checks
  const declaredTotal = invoice.declaredTotal ?? 0;
  if (declaredTotal < 0) {
    errors.push('El importe total no puede ser negativo.');
  }

  // 4. Meter readings check
  let readingDerivedKwh: number | undefined = undefined;
  let readingMismatch = false;

  if (invoice.previousReading !== undefined && invoice.currentReading !== undefined) {
    const prev = invoice.previousReading;
    const curr = invoice.currentReading;
    const mult = invoice.meterMultiplier && invoice.meterMultiplier > 0 ? invoice.meterMultiplier : 1;

    if (curr >= prev) {
      readingDerivedKwh = roundPrecision((curr - prev) * mult, 2);
    } else {
      // Meter rollover possibility (e.g. 99999 to 00050)
      warnings.push('La lectura actual es menor que la anterior (posible reinicio o ciclo de medidor).');
    }

    if (readingDerivedKwh !== undefined && Math.abs(readingDerivedKwh - consumptionKwh) > 1) {
      readingMismatch = true;
      warnings.push(`El consumo derivado de las lecturas (${readingDerivedKwh} kWh) difiere del consumo declarado (${consumptionKwh} kWh).`);
    }
  }

  // 5. Arithmetic audit of line items
  const charges: InvoiceItemCharge[] = invoice.charges || [];
  const calculatedItemsTotal = roundPrecision(
    charges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    2
  );

  let arithmeticDifference = 0;
  let auditStatus: InvoiceAuditStatus = 'unverified';
  let auditExplanation = 'Factura pendiente de verificación.';

  if (charges.length > 0) {
    arithmeticDifference = roundPrecision(declaredTotal - calculatedItemsTotal, 2);
    if (Math.abs(arithmeticDifference) <= 0.05) {
      if (readingMismatch) {
        auditStatus = 'reading_inconsistent';
        auditExplanation = 'La suma de conceptos coincide exactamente, pero existe discrepancia con las lecturas del medidor.';
      } else {
        auditStatus = 'verified_exact';
        auditExplanation = 'Suma de conceptos coincide exactamente con el total declarado.';
      }
    } else {
      auditStatus = 'arithmetic_difference';
      auditExplanation = `Existe una diferencia aritmética de ${Math.abs(arithmeticDifference)} ${invoice.currency || '₡'} entre el total declarado (${declaredTotal}) y la suma de conceptos (${calculatedItemsTotal}).`;
    }
  } else {
    auditStatus = 'incomplete_data';
    auditExplanation = 'No se desglosaron conceptos individuales; se conserva el total declarado.';
  }

  // 6. Tariff recalculation comparison if tariff provided
  if (appliedTariff) {
    try {
      const tariffCalc = calculateTariffCost(appliedTariff, consumptionKwh);
      const diffWithTariff = roundPrecision(declaredTotal - tariffCalc.totalCalculated, 2);
      if (Math.abs(diffWithTariff) > 5) {
        warnings.push(`El total de la factura (${declaredTotal}) difiere del cálculo según tarifa vigente ${appliedTariff.name} (${tariffCalc.totalCalculated}). Diferencia: ${diffWithTariff} ${invoice.currency}.`);
      }
    } catch {
      // Ignored non-fatal
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    auditStatus,
    auditExplanation,
    calculatedItemsTotal,
    arithmeticDifference,
    readingDerivedKwh,
    readingMismatch,
  };
}

/**
 * Compares two billing periods in detail.
 */
export function compareInvoices(invoiceA: Invoice, invoiceB: Invoice): InvoiceComparison {
  const deltaKwh = roundPrecision(invoiceB.consumptionKwh - invoiceA.consumptionKwh, 2);
  const deltaPercentKwh = invoiceA.consumptionKwh > 0 
    ? roundPrecision((deltaKwh / invoiceA.consumptionKwh) * 100, 1) 
    : 0;

  const deltaCost = roundPrecision(invoiceB.declaredTotal - invoiceA.declaredTotal, 2);
  const deltaPercentCost = invoiceA.declaredTotal > 0 
    ? roundPrecision((deltaCost / invoiceA.declaredTotal) * 100, 1) 
    : 0;

  const daysA = Math.max(1, invoiceA.billingDays || 30);
  const daysB = Math.max(1, invoiceB.billingDays || 30);
  const deltaDays = daysB - daysA;

  const avgDailyKwhA = roundPrecision(invoiceA.consumptionKwh / daysA, 2);
  const avgDailyKwhB = roundPrecision(invoiceB.consumptionKwh / daysB, 2);
  const deltaAvgDailyKwh = roundPrecision(avgDailyKwhB - avgDailyKwhA, 2);

  const avgCostPerKwhA = invoiceA.consumptionKwh > 0 ? roundPrecision(invoiceA.declaredTotal / invoiceA.consumptionKwh, 2) : 0;
  const avgCostPerKwhB = invoiceB.consumptionKwh > 0 ? roundPrecision(invoiceB.declaredTotal / invoiceB.consumptionKwh, 2) : 0;
  const deltaCostPerKwh = roundPrecision(avgCostPerKwhB - avgCostPerKwhA, 2);

  const tariffChanged = invoiceA.tariffId !== invoiceB.tariffId;

  const possibleCauses: string[] = [];
  if (Math.abs(deltaPercentKwh) > 10) {
    if (deltaKwh > 0) possibleCauses.push(`Aumento de consumo energético (+${deltaKwh} kWh, +${deltaPercentKwh}%)`);
    else possibleCauses.push(`Reducción de consumo energético (${deltaKwh} kWh, ${deltaPercentKwh}%)`);
  }
  if (deltaDays !== 0) {
    possibleCauses.push(`Diferencia en duración del periodo facturado (${deltaDays > 0 ? `+${deltaDays}` : deltaDays} días)`);
  }
  if (Math.abs(deltaCostPerKwh) > 2) {
    possibleCauses.push(`Variación en el costo promedio unitario por kWh (${deltaCostPerKwh > 0 ? `+${deltaCostPerKwh}` : deltaCostPerKwh} ${invoiceA.currency}/kWh)`);
  }
  if (tariffChanged) {
    possibleCauses.push('Se registró un cambio de tarifa aplicada entre ambos periodos.');
  }

  return {
    invoiceA,
    invoiceB,
    deltaKwh,
    deltaPercentKwh,
    deltaCost,
    deltaPercentCost,
    deltaDays,
    avgDailyKwhA,
    avgDailyKwhB,
    deltaAvgDailyKwh,
    avgCostPerKwhA,
    avgCostPerKwhB,
    deltaCostPerKwh,
    tariffChanged,
    possibleCauses,
  };
}
