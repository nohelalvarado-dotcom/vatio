import React, { useState } from 'react';
import {
  ArrowUpDown,
  Search,
  Download,
  Copy,
  Check,
  Info,
  Calendar,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { AnalyticsDataset, PeriodMetrics, DataTraceabilityInfo } from '../../../types/atlas';
import { OriginBadge } from '../../../components/ui/OriginBadge';

interface AnalyticalTable2DProps {
  dataset: AnalyticsDataset;
  onInspectPoint: (info: DataTraceabilityInfo) => void;
}

type SortField =
  | 'periodStart'
  | 'billingDays'
  | 'consumptionKwh'
  | 'dailyConsumptionKwh'
  | 'totalCost'
  | 'dailyCost'
  | 'effectiveCostPerKwh'
  | 'auditStatus';

export const AnalyticalTable2D: React.FC<AnalyticalTable2DProps> = ({
  dataset,
  onInspectPoint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('periodStart');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const { periods, currency } = dataset;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter and sort
  const filtered = periods.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      p.periodLabel.toLowerCase().includes(s) ||
      p.distributor.toLowerCase().includes(s) ||
      p.periodStart.includes(s) ||
      p.auditStatus.toLowerCase().includes(s)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    const numA = Number(valA) || 0;
    const numB = Number(valB) || 0;
    return sortAsc ? numA - numB : numB - numA;
  });

  // Copy CSV to clipboard
  const handleCopyClipboard = () => {
    const headers = [
      'Periodo',
      'Fecha Inicio',
      'Fecha Fin',
      'Días',
      'Consumo (kWh)',
      'Consumo Diario (kWh/d)',
      `Gasto Total (${currency})`,
      `Gasto Diario (${currency}/d)`,
      `Costo Efectivo (${currency}/kWh)`,
      'Auditoría',
      'Procedencia',
    ];

    const rows = sorted.map(p => [
      p.periodLabel,
      p.periodStart,
      p.periodEnd,
      p.billingDays,
      p.consumptionKwh,
      p.dailyConsumptionKwh,
      p.totalCost,
      p.dailyCost,
      p.effectiveCostPerKwh,
      p.auditStatus,
      p.dataOrigin,
    ]);

    const csvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export CSV file
  const handleExportCsv = () => {
    const headers = [
      'Periodo',
      'Fecha Inicio',
      'Fecha Fin',
      'Dias Facturados',
      'Consumo kWh',
      'Consumo Diario kWh',
      `Gasto Total ${currency}`,
      `Gasto Diario ${currency}`,
      `Costo Medio Efectivo ${currency}_kWh`,
      'Auditoria',
      'Procedencia',
    ];

    const rows = sorted.map(p => [
      `"${p.periodLabel}"`,
      p.periodStart,
      p.periodEnd,
      p.billingDays,
      p.consumptionKwh,
      p.dailyConsumptionKwh,
      p.totalCost,
      p.dailyCost,
      p.effectiveCostPerKwh,
      `"${p.auditStatus}"`,
      p.dataOrigin,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vatio-tabla-analitica-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRowInspect = (p: PeriodMetrics) => {
    onInspectPoint({
      metricName: `Ciclo ${p.periodLabel}`,
      value: `${p.consumptionKwh.toLocaleString()} kWh · ${currency}${p.totalCost.toLocaleString()}`,
      unit: '',
      formula:
        'Costo Unitario Efectivo = Gasto Total / Consumo (kWh) | Consumo Diario = Consumo (kWh) / Días Facturados',
      provenance: p.dataOrigin,
      sourceInvoiceId: p.invoiceId,
      sourceInvoiceNumber: p.invoiceId,
      periodDates: `${p.periodStart} al ${p.periodEnd}`,
      underlyingInputs: [
        { label: 'Días Facturados', value: `${p.billingDays} días` },
        { label: 'Consumo Total', value: `${p.consumptionKwh} kWh` },
        { label: 'Importe Total', value: `${currency}${p.totalCost.toLocaleString()}` },
        { label: 'Consumo Diario', value: `${p.dailyConsumptionKwh} kWh/d` },
        { label: 'Costo Diario', value: `${currency}${p.dailyCost}/d` },
        { label: 'Costo Medio Efectivo', value: `${currency}${p.effectiveCostPerKwh}/kWh` },
        { label: 'Estado de Auditoría', value: p.auditStatus },
      ],
      explanation:
        'Datos verificados de la factura registrada en almacenamiento local seguro IndexedDB.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por periodo, distribuidora o estado..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyClipboard}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 font-medium"
            title="Copiar filas al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 font-semibold shadow-xs"
            title="Descargar tabla en formato CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1728] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#141F32] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold select-none">
              <th
                onClick={() => handleSort('periodStart')}
                className="py-3 px-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Periodo</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('billingDays')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Días</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('consumptionKwh')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Consumo (kWh)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('dailyConsumptionKwh')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Diario (kWh/d)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalCost')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total ({currency})</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('effectiveCostPerKwh')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Costo/kWh</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Procedencia</th>
              <th className="py-3 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
            {sorted.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-slate-50/80 dark:hover:bg-[#141F32]/60 transition"
              >
                <td className="py-2.5 px-3.5 font-sans">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {p.periodLabel}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {p.periodStart} al {p.periodEnd}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">
                  {p.billingDays}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {p.consumptionKwh.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                  {p.dailyConsumptionKwh}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                  {currency}{p.totalCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-cyan-600 dark:text-cyan-400">
                  {currency}{p.effectiveCostPerKwh}
                </td>
                <td className="py-2.5 px-3 text-center font-sans">
                  <OriginBadge origin={p.dataOrigin} />
                </td>
                <td className="py-2.5 px-3 text-center font-sans">
                  <button
                    type="button"
                    onClick={() => handleRowInspect(p)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition"
                    title="Ver origen del dato y trazabilidad"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
