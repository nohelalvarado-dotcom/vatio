import React, { useState } from 'react';
import { Tv, Sparkles, AlertCircle, Info, Calculator } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Appliance, ApplianceCategory } from '../../types/appliance';
import { OriginLabel } from '../../types/household';
import { APPLIANCE_CATALOG, ApplianceReferenceItem } from '../../database/seed';
import { calculateApplianceEnergy, roundPrecision } from '../../core/calculations/energy-math';
import { Tariff } from '../../types/tariff';
import { calculateTariffCost } from '../../core/tariff-engine/tariff-engine';

interface ApplianceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appliance: Appliance) => void;
  householdId: string;
  tariff?: Tariff;
  currencySymbol: string;
  initialData?: Appliance | null;
}

const CATEGORIES: { id: ApplianceCategory; label: string }[] = [
  { id: 'climatizacion', label: 'Climatización' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'lavanderia', label: 'Lavandería' },
  { id: 'agua_caliente', label: 'Agua Caliente' },
  { id: 'entretenimiento', label: 'Entretenimiento' },
  { id: 'informatica', label: 'Informática' },
  { id: 'iluminacion', label: 'Iluminación' },
  { id: 'otros', label: 'Otros' },
];

export const ApplianceFormModal: React.FC<ApplianceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  householdId,
  tariff,
  currencySymbol,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<ApplianceCategory>(initialData?.category || 'cocina');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || 1);

  // Power specs
  const [powerWatts, setPowerWatts] = useState<string>(initialData?.powerWatts !== undefined ? String(initialData.powerWatts) : '200');
  const [standbyWatts, setStandbyWatts] = useState<string>(initialData?.standbyWatts !== undefined ? String(initialData.standbyWatts) : '0');
  const [dutyCycle, setDutyCycle] = useState<number>(initialData?.dutyCycle !== undefined ? initialData.dutyCycle : 1.0);

  // Usage specs
  const [usageHoursPerDay, setUsageHoursPerDay] = useState<string>(initialData?.usageHoursPerDay !== undefined ? String(initialData.usageHoursPerDay) : '5');
  const [usageDaysPerMonth, setUsageDaysPerMonth] = useState<number>(initialData?.usageDaysPerMonth !== undefined ? initialData.usageDaysPerMonth : 30);

  // Cycle based alternative
  const [isCycleBased, setIsCycleBased] = useState<boolean>(initialData?.isCycleBased || false);
  const [energyPerCycleKwh, setEnergyPerCycleKwh] = useState<string>(initialData?.energyPerCycleKwh !== undefined ? String(initialData.energyPerCycleKwh) : '0.5');
  const [cyclesPerMonth, setCyclesPerMonth] = useState<number>(initialData?.cyclesPerMonth !== undefined ? initialData.cyclesPerMonth : 15);

  // Origin & Confidence
  const [dataOrigin, setDataOrigin] = useState<OriginLabel>(initialData?.dataOrigin || 'ESTIMADO');
  const [confidence, setConfidence] = useState<'Alta' | 'Media' | 'Baja'>(initialData?.confidence || 'Media');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Pre-fill from reference catalog
  const handleApplyTemplate = (item: ApplianceReferenceItem) => {
    setName(item.name);
    setCategory(item.category);
    setPowerWatts(String(item.typicalWatts));
    setStandbyWatts(String(item.typicalStandbyWatts || 0));
    setUsageHoursPerDay(String(item.typicalHoursPerDay));
    setUsageDaysPerMonth(item.typicalDaysPerMonth);
    setDutyCycle(item.dutyCycle !== undefined ? item.dutyCycle : 1.0);
    setIsCycleBased(Boolean(item.isCycleBased));
    if (item.typicalEnergyPerCycleKwh) setEnergyPerCycleKwh(String(item.typicalEnergyPerCycleKwh));
    if (item.cyclesPerMonth) setCyclesPerMonth(item.cyclesPerMonth);
    setDataOrigin('ESTIMADO');
    setConfidence('Media');
    setNotes(item.note);
  };

  // Live calculation output
  const energyCalc = calculateApplianceEnergy({
    powerWatts: parseFloat(powerWatts) || 0,
    standbyWatts: parseFloat(standbyWatts) || 0,
    usageHoursPerDay: parseFloat(usageHoursPerDay) || 0,
    usageDaysPerMonth,
    quantity,
    dutyCycle,
    isCycleBased,
    energyPerCycleKwh: parseFloat(energyPerCycleKwh) || 0,
    cyclesPerMonth,
  });

  // Cost calculation based on active tariff
  let monthlyCost = 0;
  if (tariff) {
    const calc = calculateTariffCost(tariff, energyCalc.monthlyKwh);
    monthlyCost = calc.totalCalculated;
  } else {
    monthlyCost = roundPrecision(energyCalc.monthlyKwh * 95, 2);
  }
  const annualCost = roundPrecision(monthlyCost * 12, 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAppliance: Appliance = {
      id: initialData?.id || `app-${Date.now()}`,
      householdId,
      name: name.trim(),
      category,
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      quantity: Math.max(1, quantity),
      powerWatts: !isCycleBased ? parseFloat(powerWatts) || 0 : undefined,
      standbyWatts: parseFloat(standbyWatts) || 0,
      dutyCycle: !isCycleBased ? dutyCycle : 1.0,
      usageHoursPerDay: !isCycleBased ? parseFloat(usageHoursPerDay) || 0 : undefined,
      usageDaysPerMonth: !isCycleBased ? usageDaysPerMonth : undefined,
      isCycleBased,
      energyPerCycleKwh: isCycleBased ? parseFloat(energyPerCycleKwh) || 0 : undefined,
      cyclesPerMonth: isCycleBased ? cyclesPerMonth : undefined,
      calculatedMonthlyKwh: energyCalc.monthlyKwh,
      calculatedMonthlyCost: monthlyCost,
      calculatedAnnualCost: annualCost,
      dataOrigin,
      confidence,
      active: initialData ? initialData.active : true,
      notes: notes.trim() || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newAppliance);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Aparato' : 'Registrar Nuevo Aparato'}
      subtitle="Cálculo matemático de consumo energético y costo mensual"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Quick Reference Catalog Picker */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Plantillas Rápidas del Catálogo Orientativo</span>
            </span>
            <span className="text-[10px] text-slate-400">Referencia estimada</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {APPLIANCE_CATALOG.slice(0, 7).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleApplyTemplate(item)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition"
              >
                {item.name.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name, Category, Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Aparato *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Refrigerador No Frost, Aire Acondicionado..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cantidad de unidades
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 2: Category, Brand, Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ApplianceCategory)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca (opcional)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="LG, Samsung, Mabe..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Modelo (opcional)
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Inverter 2023"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Calculation Mode Toggle: Continuous Power vs Cycle-based */}
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsCycleBased(false)}
              className={`flex-1 py-1.5 rounded-md transition ${
                !isCycleBased
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Potencia Continua (Watts × Horas)
            </button>
            <button
              type="button"
              onClick={() => setIsCycleBased(true)}
              className={`flex-1 py-1.5 rounded-md transition ${
                isCycleBased
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Por Ciclos de Lavado / Secado (kWh/ciclo)
            </button>
          </div>

          {/* Continuous Power Inputs */}
          {!isCycleBased ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Potencia Nominal (W) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  placeholder="ej. 1200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Horas de Uso Diario *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="24"
                  required
                  value={usageHoursPerDay}
                  onChange={(e) => setUsageHoursPerDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  placeholder="ej. 4"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Días de Uso / Mes
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={usageDaysPerMonth}
                  onChange={(e) => setUsageDaysPerMonth(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" title="Para refrigeradores y aires que modulan el compresor">
                  Factor de Ciclo (0.1 - 1.0)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.0"
                  value={dutyCycle}
                  onChange={(e) => setDutyCycle(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Energía por Ciclo (kWh) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={energyPerCycleKwh}
                  onChange={(e) => setEnergyPerCycleKwh(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                  placeholder="ej. 0.45"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ciclos al Mes *
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  required
                  value={cyclesPerMonth}
                  onChange={(e) => setCyclesPerMonth(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  placeholder="ej. 16"
                />
              </div>
            </div>
          )}

          {/* Standby Power Input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Potencia en Reposo (Standby Watts)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={standbyWatts}
                onChange={(e) => setStandbyWatts(e.target.value)}
                placeholder="ej. 2"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Origen de los Datos
              </label>
              <select
                value={dataOrigin}
                onChange={(e) => setDataOrigin(e.target.value as OriginLabel)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="MEDIDO">MEDIDO (con vatímetro/enchufe)</option>
                <option value="DECLARADO">DECLARADO (etiqueta fabricante)</option>
                <option value="ESTIMADO">ESTIMADO (catálogo orientativo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nivel de Confianza
              </label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="Alta">Alta (Medición o ficha técnica)</option>
                <option value="Media">Media (Aproximación de horas)</option>
                <option value="Baja">Baja (Supuesto preliminar)</option>
              </select>
            </div>
          </div>

          {/* Live Result Calculation Banner */}
          <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Calculator className="w-4 h-4" />
                <span>Resultado Calculado: {energyCalc.formulaDescription}</span>
              </span>
              <span className="font-mono text-slate-500">
                Tarifa: {tariff ? tariff.name : 'Tarifa Plana Estimada'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono pt-1">
              <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                <span className="text-slate-500 block text-[10px]">Consumo Mensual</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {energyCalc.monthlyKwh} kWh
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                <span className="text-slate-500 block text-[10px]">Costo Mensual Est.</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currencySymbol} {monthlyCost.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                <span className="text-slate-500 block text-[10px]">Costo Anual Proyectado</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currencySymbol} {annualCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Calculation step list */}
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5 pt-1">
              {energyCalc.numericalSteps.map((step, i) => (
                <div key={i}>• {step}</div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
            >
              Guardar en Inventario
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
