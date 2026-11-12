import React, { useState } from 'react';
import { ArrowRight, TrendingUp, TrendingDown, GitCompare, Info } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Invoice } from '../../types/invoice';
import { compareInvoices } from '../../core/validators/invoice-validator';

interface InvoiceCompareModalProps {
  invoices: Invoice[];
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceCompareModal: React.FC<InvoiceCompareModalProps> = ({
  invoices,
  isOpen,
  onClose,
}) => {
  // Select two invoices to compare (defaults to last two if available)
  const sorted = [...invoices].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  const [idA, setIdA] = useState<string>(sorted[sorted.length - 2]?.id || sorted[0]?.id || '');
  const [idB, setIdB] = useState<string>(sorted[sorted.length - 1]?.id || sorted[1]?.id || '');

  const invA = sorted.find(i => i.id === idA);
  const invB = sorted.find(i => i.id === idB);

  if (!invA || !invB || invA.id === invB.id) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Comparación de Periodos" maxWidth="md">
        <div className="py-6 text-center text-xs text-slate-500 space-y-3">
          <GitCompare className="w-8 h-8 text-slate-400 mx-auto" />
          <p>Se requieren al menos dos facturas distintas para ejecutar la comparación analítica.</p>
        </div>
      </Modal>
    );
  }

  const comparison = compareInvoices(invA, invB);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comparación Rigurosa entre Periodos"
      subtitle="Identifica si la variación obedece a consumo, duración o tarifas"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Period Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Periodo Base (A)
            </label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            >
              {sorted.map(inv => (
                <option key={inv.id} value={inv.id} disabled={inv.id === idB}>
                  {inv.periodStart} al {inv.periodEnd} ({inv.consumptionKwh} kWh — {inv.currency}{inv.declaredTotal.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Periodo Comparado (B)
            </label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            >
              {sorted.map(inv => (
                <option key={inv.id} value={inv.id} disabled={inv.id === idA}>
                  {inv.periodStart} al {inv.periodEnd} ({inv.consumptionKwh} kWh — {inv.currency}{inv.declaredTotal.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">Delta Consumo</span>
            <div className="flex items-center gap-1.5">
              {comparison.deltaKwh >= 0 ? (
                <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {comparison.deltaKwh >= 0 ? `+${comparison.deltaKwh}` : comparison.deltaKwh} kWh
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              ({comparison.deltaPercentKwh >= 0 ? `+${comparison.deltaPercentKwh}` : comparison.deltaPercentKwh}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">Delta Gasto</span>
            <div className="flex items-center gap-1.5">
              {comparison.deltaCost >= 0 ? (
                <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {comparison.deltaCost >= 0 ? `+${invA.currency}${comparison.deltaCost.toLocaleString()}` : `-${invA.currency}${Math.abs(comparison.deltaCost).toLocaleString()}`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              ({comparison.deltaPercentCost >= 0 ? `+${comparison.deltaPercentCost}` : comparison.deltaPercentCost}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">Delta Promedio Diario</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white block">
              {comparison.deltaAvgDailyKwh >= 0 ? `+${comparison.deltaAvgDailyKwh}` : comparison.deltaAvgDailyKwh} kWh/d
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {comparison.avgDailyKwhA} → {comparison.avgDailyKwhB} kWh/d
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">Delta Precio Unitario</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white block">
              {comparison.deltaCostPerKwh >= 0 ? `+${comparison.deltaCostPerKwh}` : comparison.deltaCostPerKwh} {invA.currency}/kWh
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {comparison.avgCostPerKwhA} → {comparison.avgCostPerKwhB}
            </span>
          </div>
        </div>

        {/* Detailed Side-by-Side Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Variable</th>
                <th className="p-3">Periodo A</th>
                <th className="p-3">Periodo B</th>
                <th className="p-3 text-right">Variación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              <tr>
                <td className="p-3 font-sans text-slate-700 dark:text-slate-300 font-medium">Consumo total</td>
                <td className="p-3">{invA.consumptionKwh} kWh</td>
                <td className="p-3">{invB.consumptionKwh} kWh</td>
                <td className="p-3 text-right font-bold">{comparison.deltaKwh > 0 ? `+${comparison.deltaKwh}` : comparison.deltaKwh} kWh</td>
              </tr>
              <tr>
                <td className="p-3 font-sans text-slate-700 dark:text-slate-300 font-medium">Importe total</td>
                <td className="p-3">{invA.currency} {invA.declaredTotal.toLocaleString()}</td>
                <td className="p-3">{invB.currency} {invB.declaredTotal.toLocaleString()}</td>
                <td className="p-3 text-right font-bold">{comparison.deltaCost > 0 ? `+${comparison.deltaCost}` : comparison.deltaCost}</td>
              </tr>
              <tr>
                <td className="p-3 font-sans text-slate-700 dark:text-slate-300 font-medium">Días facturados</td>
                <td className="p-3">{invA.billingDays} días</td>
                <td className="p-3">{invB.billingDays} días</td>
                <td className="p-3 text-right">{comparison.deltaDays > 0 ? `+${comparison.deltaDays}` : comparison.deltaDays} días</td>
              </tr>
              <tr>
                <td className="p-3 font-sans text-slate-700 dark:text-slate-300 font-medium">Tasa diaria</td>
                <td className="p-3">{comparison.avgDailyKwhA} kWh/d</td>
                <td className="p-3">{comparison.avgDailyKwhB} kWh/d</td>
                <td className="p-3 text-right font-bold">{comparison.deltaAvgDailyKwh > 0 ? `+${comparison.deltaAvgDailyKwh}` : comparison.deltaAvgDailyKwh} kWh/d</td>
              </tr>
              <tr>
                <td className="p-3 font-sans text-slate-700 dark:text-slate-300 font-medium">Costo unitario efectivo</td>
                <td className="p-3">{invA.currency}{comparison.avgCostPerKwhA}/kWh</td>
                <td className="p-3">{invB.currency}{comparison.avgCostPerKwhB}/kWh</td>
                <td className="p-3 text-right font-bold">{comparison.deltaCostPerKwh > 0 ? `+${comparison.deltaCostPerKwh}` : comparison.deltaCostPerKwh}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Probable Causes Analysis */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <Info className="w-4 h-4 text-cyan-500" />
            <span>Factores causales identificados matemáticamente:</span>
          </div>
          {comparison.possibleCauses.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
              {comparison.possibleCauses.map((cause, i) => (
                <li key={i}>{cause}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">
              No se detectaron variaciones significativas de días, tarifa o consumo entre ambos periodos.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
