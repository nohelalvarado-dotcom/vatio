import { Appliance } from '../../types/appliance';
import { DiagnosticItem } from '../../types/diagnostic';
import { Invoice } from '../../types/invoice';
import { roundPrecision } from '../calculations/energy-math';

/**
 * Runs rule-based mathematical diagnostic checks across all registered invoices and appliance inventory.
 * Pure logic engine, no external AI calls.
 */
export function runEnergyDiagnostics(
  invoices: Invoice[],
  appliances: Appliance[],
  householdId: string
): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];
  const nowStr = new Date().toISOString().split('T')[0];

  if (!invoices || invoices.length === 0) {
    return diagnostics;
  }

  // Sort invoices chronologically by periodStart
  const sorted = [...invoices].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  const latest = sorted[sorted.length - 1];

  // Check 1: Arithmetic differences on any invoice
  for (const inv of sorted) {
    if (inv.auditStatus === 'arithmetic_difference' && inv.arithmeticDifference) {
      diagnostics.push({
        id: `diag-arith-${inv.id}`,
        householdId,
        title: `Diferencia aritmética en factura de ${inv.periodStart}`,
        date: nowStr,
        category: 'error_aritmetico',
        severity: 'alerta',
        description: `La suma de conceptos detallados difiere del importe total declarado en la factura.`,
        numericalEvidence: `Total declarado: ${inv.declaredTotal} ${inv.currency} | Suma calculada: ${inv.calculatedTotal} ${inv.currency} | Diferencia: ${Math.abs(inv.arithmeticDifference)} ${inv.currency}`,
        calculationExplanation: `Diferencia = Total declarado (${inv.declaredTotal}) - Suma conceptos (${inv.calculatedTotal}) = ${inv.arithmeticDifference} ${inv.currency}`,
        confidence: 'Alta',
        confidenceReason: 'Cálculo aritmético determinista directo sobre los conceptos registrados.',
        recommendation: 'Verifica los ítems de la factura física. Si la diferencia persiste en el recibo original de la distribuidora, solicita una aclaración formal de cobro.',
        status: 'pendiente',
        createdAt: nowStr,
      });
    }
  }

  // Check 2: Reading vs Consumption inconsistency
  for (const inv of sorted) {
    if (inv.auditStatus === 'reading_inconsistent' && inv.readingDerivedKwh !== undefined) {
      const diff = roundPrecision(Math.abs(inv.readingDerivedKwh - inv.consumptionKwh), 2);
      diagnostics.push({
        id: `diag-reading-${inv.id}`,
        householdId,
        title: `Inconsistencia entre lectura y consumo facturado (${inv.periodStart})`,
        date: nowStr,
        category: 'lectura_incoherente',
        severity: 'alerta',
        description: `El consumo declarado en el recibo no coincide con la resta de lecturas del medidor.`,
        numericalEvidence: `Consumo declarado: ${inv.consumptionKwh} kWh | Consumo por lecturas (${inv.currentReading} - ${inv.previousReading}): ${inv.readingDerivedKwh} kWh | Desviación: ${diff} kWh`,
        calculationExplanation: `E_lectura = (${inv.currentReading} - ${inv.previousReading}) × ${inv.meterMultiplier || 1} = ${inv.readingDerivedKwh} kWh`,
        confidence: 'Alta',
        confidenceReason: 'Comparación numérica directa entre el campo de consumo y las lecturas del medidor.',
        recommendation: 'Revisa si existió un ajuste por estimación previa o un error de digitación en la lectura.',
        status: 'pendiente',
        createdAt: nowStr,
      });
    }
  }

  // Check 3: Atypical billing period duration (< 26 days or > 35 days)
  for (const inv of sorted) {
    if (inv.billingDays < 26 || inv.billingDays > 35) {
      diagnostics.push({
        id: `diag-days-${inv.id}`,
        householdId,
        title: `Periodo de facturación atípico (${inv.billingDays} días)`,
        date: nowStr,
        category: 'periodo_atipico',
        severity: 'advertencia',
        description: `La factura corresponde a un periodo de ${inv.billingDays} días, distinto al ciclo mensual estándar de 28 a 32 días.`,
        numericalEvidence: `Días facturados: ${inv.billingDays} días | Intervalo habitual: 28 a 31 días.`,
        calculationExplanation: `Un periodo más largo puede empujar el consumo hacia bloques tarifarios superiores o provocar la aplicación del 13% de IVA si se superan los 280 kWh mensuales prorrateados.`,
        confidence: 'Alta',
        confidenceReason: 'Verificación del número de días del ciclo de facturación.',
        recommendation: 'Considera el promedio diario (kWh/día) en vez del consumo total para comparar este mes con los anteriores.',
        status: 'pendiente',
        createdAt: nowStr,
      });
    }
  }

  // Check 4: Historical spike in consumption (> 25% increase compared to historical average)
  if (sorted.length >= 2) {
    const previousInvoices = sorted.slice(0, sorted.length - 1);
    const avgHistoricalKwh = previousInvoices.reduce((sum, inv) => sum + inv.consumptionKwh, 0) / previousInvoices.length;
    const latestDaily = latest.consumptionKwh / Math.max(1, latest.billingDays);
    const avgHistoricalDaily = previousInvoices.reduce((sum, inv) => sum + (inv.consumptionKwh / Math.max(1, inv.billingDays)), 0) / previousInvoices.length;

    const percentSpike = avgHistoricalDaily > 0 
      ? roundPrecision(((latestDaily - avgHistoricalDaily) / avgHistoricalDaily) * 100, 1) 
      : 0;

    if (percentSpike >= 25) {
      diagnostics.push({
        id: `diag-spike-${latest.id}`,
        householdId,
        title: `Incremento relevante en el consumo diario (+${percentSpike}%)`,
        date: nowStr,
        category: 'consumo_anormal',
        severity: 'advertencia',
        description: `El promedio diario del último periodo (${roundPrecision(latestDaily, 2)} kWh/día) supera significativamente el promedio histórico (${roundPrecision(avgHistoricalDaily, 2)} kWh/día).`,
        numericalEvidence: `Último consumo: ${latest.consumptionKwh} kWh (${roundPrecision(latestDaily, 2)} kWh/día) vs Promedio anterior: ${roundPrecision(avgHistoricalKwh, 1)} kWh (${roundPrecision(avgHistoricalDaily, 2)} kWh/día).`,
        calculationExplanation: `Variación = ((${latestDaily.toFixed(2)} - ${avgHistoricalDaily.toFixed(2)}) / ${avgHistoricalDaily.toFixed(2)}) × 100 = +${percentSpike}%`,
        confidence: sorted.length >= 4 ? 'Alta' : 'Media',
        confidenceReason: sorted.length >= 4 
          ? 'Basado en suficiente historial (4 o más periodos previos).' 
          : 'Historial limitado a pocos periodos previos; la estacionalidad climática podría explicar parte de la variación.',
        recommendation: 'Revisa si incorporaste nuevos electrodomésticos, si hubo mayor ocupación en el hogar o uso intensivo de aire acondicionado/ducha eléctrica.',
        status: 'pendiente',
        createdAt: nowStr,
      });
    }
  }

  // Check 5: Appliance inventory vs Latest invoice reconciliation (12.3)
  const activeAppliances = appliances.filter(a => a.active);
  if (activeAppliances.length > 0 && latest) {
    const totalApplianceMonthlyKwh = roundPrecision(
      activeAppliances.reduce((sum, a) => sum + a.calculatedMonthlyKwh, 0),
      2
    );
    const invoiceKwh = latest.consumptionKwh;
    const diffKwh = roundPrecision(invoiceKwh - totalApplianceMonthlyKwh, 2);
    const deviationPercent = invoiceKwh > 0 
      ? roundPrecision((Math.abs(diffKwh) / invoiceKwh) * 100, 1) 
      : 0;

    if (deviationPercent >= 30) {
      diagnostics.push({
        id: `diag-inventory-mismatch-${latest.id}`,
        householdId,
        title: `Desviación entre inventario de aparatos y factura (${deviationPercent}%)`,
        date: nowStr,
        category: 'desviacion_aparatos',
        severity: 'informativa',
        description: diffKwh > 0
          ? `El consumo facturado (${invoiceKwh} kWh) es mayor que la suma estimada de tus aparatos registrados (${totalApplianceMonthlyKwh} kWh).`
          : `El consumo estimado de tus aparatos (${totalApplianceMonthlyKwh} kWh) es mayor que la factura registrada (${invoiceKwh} kWh).`,
        numericalEvidence: `Factura: ${invoiceKwh} kWh | Inventario (${activeAppliances.length} aparatos): ${totalApplianceMonthlyKwh} kWh | Diferencia no contabilizada: ${diffKwh} kWh (${deviationPercent}%).`,
        calculationExplanation: `Diferencia = Factura (${invoiceKwh} kWh) - Suma aparatos (${totalApplianceMonthlyKwh} kWh) = ${diffKwh} kWh`,
        confidence: 'Media',
        confidenceReason: 'El inventario de aparatos utiliza horas de uso y potencias declaradas o de referencia, las cuales pueden variar en el uso real.',
        recommendation: diffKwh > 0
          ? 'Es probable que existan aparatos no registrados (iluminación secundaria, cargadores, equipos de cocción) o que las horas reales de uso sean mayores.'
          : 'Revisa las horas de uso estimadas en tus aparatos; es posible que estén sobreestimadas.',
        status: 'pendiente',
        createdAt: nowStr,
      });
    }
  }

  return diagnostics;
}
