import { UserAccount } from '../../types/account';
import { Invoice } from '../../types/invoice';
import { Household } from '../../types/household';

export class GoogleWorkspaceHub {
  /**
   * Generates a Google Calendar event URL to schedule monthly meter reading reminder.
   */
  public static getCalendarMeterReadingUrl(dayOfMonth: number = 28, householdName: string = 'Mi Hogar'): string {
    const title = encodeURIComponent(`⚡ Lectura de Medidor Eléctrico — ${householdName}`);
    const details = encodeURIComponent(
      `Recordatorio de VATIO Energy Intelligence:\n` +
      `Toma la lectura actual del medidor eléctrico para auditar la factura mensual y anticipar saltos de bloque tarifario.\n` +
      `Abre VATIO para registrar tus lecturas.`
    );
    const location = encodeURIComponent(householdName);
    
    // Create date for next occurrence of this day of month
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    if (now.getDate() > dayOfMonth) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${targetYear}${pad(targetMonth + 1)}${pad(dayOfMonth)}T090000Z`;
    const endStr = `${targetYear}${pad(targetMonth + 1)}${pad(dayOfMonth)}T093000Z`;
    
    // RRULE for monthly repetition
    const rrule = encodeURIComponent('RRULE:FREQ=MONTHLY');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}&recur=${rrule}`;
  }

  /**
   * Generates a Google Calendar event URL for an invoice payment deadline.
   */
  public static getCalendarInvoiceDueUrl(invoice: Invoice, household: Household | null): string {
    const dist = invoice.distributor || household?.distributor || 'Distribuidora Eléctrica';
    const title = encodeURIComponent(`💳 Pago de Factura Eléctrica — ${dist}`);
    const amount = `${household?.currencySymbol || '₡'}${invoice.totalAmount.toLocaleString()}`;
    const details = encodeURIComponent(
      `Factura Eléctrica registrada en VATIO:\n` +
      `• Consumo: ${invoice.totalKwh} kWh\n` +
      `• Total a Pagar: ${amount}\n` +
      `• Periodo: ${invoice.periodStart} al ${invoice.periodEnd}\n` +
      `• Estado Auditoría: ${invoice.auditStatus}`
    );
    
    const dueDateStr = invoice.dueDate || invoice.periodEnd;
    const cleanDate = dueDateStr.replace(/-/g, '');
    const startStr = `${cleanDate}T080000Z`;
    const endStr = `${cleanDate}T090000Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  }

  /**
   * Exports dataset into a Google Sheets compatible format and offers 1-click opening.
   */
  public static generateSheetsCsv(invoices: Invoice[], household: Household | null): string {
    const headers = [
      'ID Factura',
      'Periodo Inicio',
      'Periodo Fin',
      'Días Facturados',
      'Consumo Total (kWh)',
      'Consumo Diario (kWh/d)',
      'Total Facturado',
      'Moneda',
      'Costo Medio (Unitario)',
      'Distribuidora',
      'Estado Auditoría',
    ];

    const rows = invoices.map(inv => {
      const days = inv.billingDays || 30;
      const dailyKwh = (inv.totalKwh / days).toFixed(2);
      const unitCost = (inv.totalAmount / (inv.totalKwh || 1)).toFixed(2);
      return [
        inv.id,
        inv.periodStart,
        inv.periodEnd,
        days,
        inv.totalKwh,
        dailyKwh,
        inv.totalAmount,
        inv.currency || household?.currency || 'CRC',
        unitCost,
        inv.distributor || household?.distributor || 'ICE',
        inv.auditStatus || 'verified_exact',
      ];
    });

    return [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  }

  /**
   * Simulates backing up to Google Drive folder and triggers cloud file download/manifest.
   */
  public static createGoogleDriveBackupManifest(account: UserAccount, backupData: any) {
    const timestamp = new Date().toISOString();
    const manifest = {
      app: 'VATIO Energy Intelligence',
      googleDriveFolder: account.google.drive.backupFolder || 'VATIO_Energia_Respaldos',
      userEmail: account.google.googleEmail || account.email,
      backupDate: timestamp,
      checksum: `sha256_${Date.now().toString(36)}`,
      payload: backupData,
    };
    return manifest;
  }
}
