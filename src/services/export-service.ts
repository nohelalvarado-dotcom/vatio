import { Appliance } from '../types/appliance';
import { Invoice } from '../types/invoice';

/**
 * Exports data to CSV and initiates browser download.
 */
export function exportInvoicesToCsv(invoices: Invoice[]): void {
  const headers = [
    'ID',
    'Distribuidora',
    'No. Factura',
    'Inicio Periodo',
    'Fin Periodo',
    'Días Facturados',
    'Lectura Anterior',
    'Lectura Actual',
    'Consumo (kWh)',
    'Moneda',
    'Total Declarado',
    'Total Calculado',
    'Estado Auditoría',
    'Origen Datos',
  ];

  const rows = invoices.map(inv => [
    `"${inv.id}"`,
    `"${inv.distributor || ''}"`,
    `"${inv.invoiceNumber || ''}"`,
    `"${inv.periodStart}"`,
    `"${inv.periodEnd}"`,
    inv.billingDays,
    inv.previousReading ?? '',
    inv.currentReading ?? '',
    inv.consumptionKwh,
    `"${inv.currency}"`,
    inv.declaredTotal,
    inv.calculatedTotal ?? '',
    `"${inv.auditStatus}"`,
    `"${inv.dataOrigin}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `vatio_facturas_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportAppliancesToCsv(appliances: Appliance[]): void {
  const headers = [
    'ID',
    'Nombre',
    'Categoría',
    'Marca',
    'Modelo',
    'Cantidad',
    'Potencia (W)',
    'Espera (W)',
    'Horas/Día',
    'Días/Mes',
    'Factor Ciclo',
    'kWh Mensual',
    'Costo Mensual Estimado',
    'Costo Anual Estimado',
    'Origen Datos',
    'Confianza',
    'Activo',
  ];

  const rows = appliances.map(app => [
    `"${app.id}"`,
    `"${app.name}"`,
    `"${app.category}"`,
    `"${app.brand || ''}"`,
    `"${app.model || ''}"`,
    app.quantity,
    app.powerWatts ?? '',
    app.standbyWatts ?? '',
    app.usageHoursPerDay ?? '',
    app.usageDaysPerMonth ?? '',
    app.dutyCycle ?? 1.0,
    app.calculatedMonthlyKwh,
    app.calculatedMonthlyCost,
    app.calculatedAnnualCost,
    `"${app.dataOrigin}"`,
    `"${app.confidence}"`,
    app.active ? 'Sí' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `vatio_aparatos_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function downloadJsonFile(jsonString: string, filename: string): void {
  downloadBlob(jsonString, filename, 'application/json;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
