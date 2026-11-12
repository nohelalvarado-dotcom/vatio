import React from 'react';
import { Tv, Edit2, Trash2, Power, Clock, Calendar, CheckCircle2, DollarSign } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Appliance } from '../../types/appliance';
import { OriginBadge } from '../../components/ui/OriginBadge';
import { FormulaDialog } from '../../components/ui/FormulaDialog';

interface ApplianceDetailModalProps {
  appliance: Appliance | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (appliance: Appliance) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
  totalHouseholdKwh: number;
}

export const ApplianceDetailModal: React.FC<ApplianceDetailModalProps> = ({
  appliance,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  currencySymbol,
  totalHouseholdKwh,
}) => {
  if (!appliance) return null;

  const percentOfHousehold = totalHouseholdKwh > 0
    ? Math.round((appliance.calculatedMonthlyKwh / totalHouseholdKwh) * 1000) / 10
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appliance.name}
      subtitle={`Categoría: ${appliance.category} • Cantidad: ${appliance.quantity}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Top Spend banner */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Consumo Mensual Estimado
            </span>
            <div className="text-3xl font-black font-mono mt-0.5">
              {appliance.calculatedMonthlyKwh} <span className="text-sm font-normal text-slate-400">kWh/mes</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
              <span>{currencySymbol} {appliance.calculatedMonthlyCost.toLocaleString()}/mes</span>
              <span>•</span>
              <span>{currencySymbol} {appliance.calculatedAnnualCost.toLocaleString()}/año</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(appliance);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Editar aparato"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Eliminar ${appliance.name} del inventario?`)) {
                  onDelete(appliance.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition"
              title="Eliminar aparato"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Technical specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">Potencia Nominal</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {appliance.powerWatts ? `${appliance.powerWatts} W` : 'Por ciclos'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">Uso Diario</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {appliance.usageHoursPerDay ? `${appliance.usageHoursPerDay} h/día` : `${appliance.cyclesPerMonth} ciclos/mes`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">Potencia en Espera</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {appliance.standbyWatts ? `${appliance.standbyWatts} W` : '0 W'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">% Consumo Hogar</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {percentOfHousehold}%
            </span>
          </div>
        </div>

        {/* Origin & Quality Card */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Calidad del dato:</span>
            <OriginBadge origin={appliance.dataOrigin} size="md" />
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Confianza {appliance.confidence}
            </span>
          </div>

          <FormulaDialog
            data={{
              title: `Fórmula de Consumo — ${appliance.name}`,
              formula: appliance.dutyCycle && appliance.dutyCycle < 1.0
                ? 'E = (P × h × d × n × FactorCiclo) / 1000 + E_espera'
                : 'E = (P × h × d × n) / 1000 + E_espera',
              variables: [
                { symbol: 'P', name: 'Potencia Eléctrica', value: appliance.powerWatts || 0, unit: 'W' },
                { symbol: 'h', name: 'Horas de uso diario', value: appliance.usageHoursPerDay || 0, unit: 'horas' },
                { symbol: 'd', name: 'Días de uso al mes', value: appliance.usageDaysPerMonth || 30, unit: 'días' },
                { symbol: 'n', name: 'Cantidad de unidades', value: appliance.quantity, unit: 'unidades' },
                { symbol: 'FC', name: 'Factor de trabajo', value: appliance.dutyCycle || 1.0, unit: 'factor' },
              ],
              substitution: `(${appliance.powerWatts || 0} × ${appliance.usageHoursPerDay || 0} × ${appliance.usageDaysPerMonth || 30} × ${appliance.quantity} × ${appliance.dutyCycle || 1.0}) / 1000`,
              result: String(appliance.calculatedMonthlyKwh),
              units: 'kWh/mes',
              assumptions: [
                'La potencia nominal indicada se mantiene estable durante las horas de funcionamiento consideradas.',
                'El factor de ciclo refleja las paradas y arranques del compresor o termostato bajo temperatura ambiente normal.',
              ],
              limitations: [
                'Factores como el desgaste mecánico, la temperatura ambiental externa y aperturas de puerta influyen en el consumo real.',
              ],
            }}
          />
        </div>

        {/* Notes */}
        {appliance.notes && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Notas / Supuestos:</span>
            {appliance.notes}
          </div>
        )}
      </div>
    </Modal>
  );
};
