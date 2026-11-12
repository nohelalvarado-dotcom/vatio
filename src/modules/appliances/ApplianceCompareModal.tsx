import React, { useState } from 'react';
import { GitCompare, TrendingDown, ArrowRight, DollarSign } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Appliance } from '../../types/appliance';
import { calculatePaybackPeriod } from '../../core/calculations/energy-math';

interface ApplianceCompareModalProps {
  appliances: Appliance[];
  isOpen: boolean;
  onClose: () => void;
  currencySymbol: string;
}

export const ApplianceCompareModal: React.FC<ApplianceCompareModalProps> = ({
  appliances,
  isOpen,
  onClose,
  currencySymbol,
}) => {
  const [idA, setIdA] = useState<string>(appliances[0]?.id || '');
  const [idB, setIdB] = useState<string>(appliances[1]?.id || '');
  const [replacementCost, setReplacementCost] = useState<string>('150000');

  const appA = appliances.find(a => a.id === idA);
  const appB = appliances.find(a => a.id === idB);

  if (!appA || !appB || appA.id === appB.id) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Comparación de Aparatos" maxWidth="md">
        <div className="py-6 text-center text-xs text-slate-500 space-y-2">
          <GitCompare className="w-8 h-8 text-slate-400 mx-auto" />
          <p>Registra al menos dos aparatos para comparar su eficiencia energética.</p>
        </div>
      </Modal>
    );
  }

  // Comparison metrics (A vs B)
  const monthlyDeltaKwh = Math.round((appA.calculatedMonthlyKwh - appB.calculatedMonthlyKwh) * 10) / 10;
  const annualDeltaKwh = Math.round(monthlyDeltaKwh * 12 * 10) / 10;
  const monthlySavingsCost = Math.round(appA.calculatedMonthlyCost - appB.calculatedMonthlyCost);
  const annualSavingsCost = Math.round(monthlySavingsCost * 12);

  const parsedCost = parseFloat(replacementCost) || 0;
  const payback = parsedCost > 0 && annualSavingsCost > 0
    ? calculatePaybackPeriod(parsedCost, annualSavingsCost)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comparación de Electrodomésticos"
      subtitle="Evalúa el impacto en consumo y retorno de inversión en reemplazo"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Aparato Actual / Base (A)
            </label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            >
              {appliances.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === idB}>
                  {a.name} ({a.calculatedMonthlyKwh} kWh/m — {currencySymbol}{a.calculatedMonthlyCost.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Aparato Alternativo / Eficiente (B)
            </label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            >
              {appliances.map(a => (
                <option key={a.id} value={a.id} disabled={a.id === idA}>
                  {a.name} ({a.calculatedMonthlyKwh} kWh/m — {currencySymbol}{a.calculatedMonthlyCost.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 block">Diferencia Energética Anual</span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              {annualDeltaKwh > 0 ? `-${annualDeltaKwh}` : `+${Math.abs(annualDeltaKwh)}`} kWh/año
            </span>
            <span className="text-[10px] text-slate-400">
              {monthlyDeltaKwh > 0 ? `-${monthlyDeltaKwh}` : `+${Math.abs(monthlyDeltaKwh)}`} kWh al mes
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 block">Ahorro Económico Anual</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {annualSavingsCost > 0 ? `+${currencySymbol}${annualSavingsCost.toLocaleString()}` : `${currencySymbol}${annualSavingsCost.toLocaleString()}`}
            </span>
            <span className="text-[10px] text-slate-400">
              {currencySymbol}{monthlySavingsCost.toLocaleString()} mensual
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 block">Periodo de Retorno (Payback)</span>
            <span className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
              {payback?.paybackMonths !== null && payback?.paybackMonths !== undefined
                ? `${payback.paybackMonths} meses`
                : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-400">
              {payback?.paybackMonths ? `${(payback.paybackMonths / 12).toFixed(1)} años` : 'Requiere ahorro > 0'}
            </span>
          </div>
        </div>

        {/* Investment Payback Calculator */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Precio de compra / sustitución del aparato alternativo:
              </span>
              <span className="text-slate-400">
                Calcula el tiempo necesario para amortizar el costo del equipo nuevo con el ahorro eléctrico.
              </span>
            </div>
            <div className="relative w-40 shrink-0">
              <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={replacementCost}
                onChange={(e) => setReplacementCost(e.target.value)}
                className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-right"
              />
            </div>
          </div>

          {payback && (
            <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
              {payback.explanation}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
