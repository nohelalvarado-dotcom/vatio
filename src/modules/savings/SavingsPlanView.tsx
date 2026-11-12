import React, { useState } from 'react';
import {
  PiggyBank,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  ShieldAlert,
  Sparkles,
  DollarSign,
  TrendingDown,
  Check,
} from 'lucide-react';
import { SavingsActionItem, EnergyInvestment } from '../../types/savings';
import { Appliance } from '../../types/appliance';
import { Tariff } from '../../types/tariff';
import { calculatePaybackPeriod } from '../../core/calculations/energy-math';

interface SavingsPlanViewProps {
  actions: SavingsActionItem[];
  investments: EnergyInvestment[];
  appliances: Appliance[];
  tariff?: Tariff;
  householdId: string;
  currencySymbol: string;
  onUpdateActionStatus: (id: string, status: SavingsActionItem['status']) => void;
  onAddAction: (action: SavingsActionItem) => void;
  onAddInvestment: (inv: EnergyInvestment) => void;
  onDeleteInvestment: (id: string) => void;
}

export const SavingsPlanView: React.FC<SavingsPlanViewProps> = ({
  actions,
  investments,
  appliances,
  tariff,
  householdId,
  currencySymbol,
  onUpdateActionStatus,
  onAddAction,
  onAddInvestment,
  onDeleteInvestment,
}) => {
  const [tab, setTab] = useState<'actions' | 'investments'>('actions');

  // Investment form state
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [invTitle, setInvTitle] = useState('');
  const [invCategory, setInvCategory] = useState<EnergyInvestment['category']>('aparato_eficiente');
  const [invPrice, setInvPrice] = useState('120000');
  const [invSavings, setInvSavings] = useState('36000');
  const [invWarranty, setInvWarranty] = useState('2');
  const [invNotes, setInvNotes] = useState('');

  // Auto-generate realistic opportunities from user's actual appliances
  const completedActions = actions.filter(a => a.status === 'completada');
  const activeOpportunities = actions.filter(a => a.status === 'sugerida' || a.status === 'en_progreso');

  const totalMonthlyPotential = activeOpportunities.reduce((sum, a) => sum + a.potentialMonthlyCostSaved, 0);
  const totalAnnualPotential = activeOpportunities.reduce((sum, a) => sum + a.potentialAnnualCostSaved, 0);

  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invTitle.trim()) return;

    const newInv: EnergyInvestment = {
      id: `inv-${Date.now()}`,
      householdId,
      title: invTitle.trim(),
      category: invCategory,
      purchasePrice: parseFloat(invPrice) || 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      estimatedAnnualSavingsCost: parseFloat(invSavings) || 0,
      warrantyYears: parseInt(invWarranty) || undefined,
      notes: invNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddInvestment(newInv);
    setIsAddingInvestment(false);
    setInvTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-emerald-500" />
            <span>Plan de Ahorro y Eficiencia Energética</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recomendaciones concretas basadas en tus aparatos reales y registro de inversiones con retorno medible.
          </p>
        </div>

        {tab === 'investments' && (
          <button
            type="button"
            onClick={() => setIsAddingInvestment(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Inversión</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Ahorro Potencial Mensual</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {currencySymbol} {Math.round(totalMonthlyPotential).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Sumatoria no redundante</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Ahorro Potencial Anual</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {currencySymbol} {Math.round(totalAnnualPotential).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">En 12 meses continuos</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Oportunidades Activas</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {activeOpportunities.length}
          </span>
          <span className="text-[10px] text-slate-400">Acciones priorizadas</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Acciones Completadas</span>
          <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
            {completedActions.length}
          </span>
          <span className="text-[10px] text-slate-400">Hábitos optimizados</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('actions')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'actions'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Acciones y Tareas de Ahorro ({actions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('investments')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'investments'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Registro de Inversiones y Retorno ({investments.length})</span>
        </button>
      </div>

      {/* Tab 1: Actions */}
      {tab === 'actions' && (
        <div className="space-y-4">
          {actions.length > 0 ? (
            <div className="space-y-4">
              {actions.map((act) => {
                const isDone = act.status === 'completada';
                return (
                  <div
                    key={act.id}
                    className={`p-5 rounded-2xl border transition shadow-xs space-y-3 ${
                      isDone
                        ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                        : 'bg-white dark:bg-[#111C2C] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`font-bold text-base ${isDone ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {act.title}
                          </h3>
                          {act.applianceName && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {act.applianceName}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            act.difficulty === 'Baja' ? 'bg-emerald-500/10 text-emerald-600' : act.difficulty === 'Media' ? 'bg-cyan-500/10 text-cyan-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            Dificultad {act.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {act.description}
                        </p>
                      </div>

                      {/* Right action button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isDone ? (
                          <button
                            type="button"
                            onClick={() => onUpdateActionStatus(act.id, 'sugerida')}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            Reabrir
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateActionStatus(act.id, 'completada')}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Marcar Realizada</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Numeric Impact Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Reducción Energía</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          -{act.potentialMonthlyKwhSaved} kWh/mes
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Ahorro Mensual</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          +{currencySymbol} {act.potentialMonthlyCostSaved.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Ahorro Anual</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          +{currencySymbol} {act.potentialAnnualCostSaved.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Inversión Requerida</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {act.implementationCost > 0 ? `${currencySymbol} ${act.implementationCost.toLocaleString()}` : '₡0 (Hábito)'}
                        </span>
                      </div>
                    </div>

                    {/* Steps list */}
                    {act.steps && act.steps.length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wide">
                          Pasos sugeridos:
                        </span>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 pl-1">
                          {act.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111C2C] p-6 space-y-2">
              <Sparkles className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Sin acciones pendientes
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Registra tus electrodomésticos para que el motor identifique los puntos de consumo elevado y genere oportunidades de ahorro personalizadas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Investments */}
      {tab === 'investments' && (
        <div className="space-y-4">
          {/* Add investment inline modal/card */}
          {isAddingInvestment && (
            <form onSubmit={handleCreateInvestment} className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-emerald-500/40 shadow-md space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Registrar Compra / Inversión de Eficiencia</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Concepto de Inversión *</label>
                  <input
                    type="text"
                    required
                    value={invTitle}
                    onChange={(e) => setInvTitle(e.target.value)}
                    placeholder="Sustitución por Refrigerador Inverter A+++"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Categoría</label>
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="aparato_eficiente">Aparato Eficiente</option>
                    <option value="iluminacion_led">Iluminación LED</option>
                    <option value="aislamiento">Aislamiento Térmico</option>
                    <option value="climatizacion">Climatización Inverter</option>
                    <option value="solar">Energía Solar</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Precio de Compra ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    value={invPrice}
                    onChange={(e) => setInvPrice(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Ahorro Anual Estimado ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    value={invSavings}
                    onChange={(e) => setInvSavings(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Años de Garantía (opcional)</label>
                  <input
                    type="number"
                    value={invWarranty}
                    onChange={(e) => setInvWarranty(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingInvestment(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Guardar Inversión
                </button>
              </div>
            </form>
          )}

          {/* Investments list */}
          {investments.length > 0 ? (
            <div className="space-y-3">
              {investments.map((inv) => {
                const payback = calculatePaybackPeriod(inv.purchasePrice, inv.estimatedAnnualSavingsCost);
                return (
                  <div
                    key={inv.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {inv.category.replace('_', ' ')} • Fecha: {inv.purchaseDate}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                        {inv.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        Inversión: {currencySymbol} {inv.purchasePrice.toLocaleString()} • Ahorro Anual: {currencySymbol} {inv.estimatedAnnualSavingsCost.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left sm:text-right font-mono">
                        <span className="text-[10px] text-slate-400 block font-sans">Retorno de Inversión</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
                          {payback.paybackMonths ? `${payback.paybackMonths} meses` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {payback.paybackMonths ? `${(payback.paybackMonths / 12).toFixed(1)} años` : ''}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar la inversión "${inv.title}"?`)) {
                            onDeleteInvestment(inv.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111C2C] p-6 space-y-2">
              <DollarSign className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Sin inversiones registradas
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Registra compras de bombillas LED, electrodomésticos eficientes o aislamientos térmicos para calcular matemáticamente su tiempo de amortización.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
