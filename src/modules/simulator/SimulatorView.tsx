import React, { useState } from 'react';
import {
  FlaskConical,
  TrendingDown,
  TrendingUp,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  DollarSign,
  Zap,
  Info,
} from 'lucide-react';
import { Appliance } from '../../types/appliance';
import { Tariff } from '../../types/tariff';
import { Scenario } from '../../types/scenario';
import { calculateApplianceEnergy, calculatePaybackPeriod, roundPrecision } from '../../core/calculations/energy-math';
import { calculateTariffCost } from '../../core/tariff-engine/tariff-engine';

interface SimulatorViewProps {
  appliances: Appliance[];
  tariff?: Tariff;
  householdId: string;
  currencySymbol: string;
  savedScenarios: Scenario[];
  onSaveScenario: (scenario: Scenario) => void;
  onDeleteScenario: (id: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  appliances,
  tariff,
  householdId,
  currencySymbol,
  savedScenarios,
  onSaveScenario,
  onDeleteScenario,
}) => {
  const activeAppliances = appliances.filter(a => a.active);

  // Baseline calculation from active appliances
  const baselineMonthlyKwh = roundPrecision(
    activeAppliances.reduce((sum, a) => sum + a.calculatedMonthlyKwh, 0),
    1
  );

  const baselineCostResult = tariff
    ? calculateTariffCost(tariff, baselineMonthlyKwh)
    : { totalCalculated: roundPrecision(baselineMonthlyKwh * 95, 2) };
  const baselineMonthlyCost = baselineCostResult.totalCalculated;

  // Simulator modification state
  // Map of applianceId -> { simHours: number, simWatts: number, isReplaced: boolean, replacementName: string, replacementCost: number }
  const [mods, setMods] = useState<Record<string, {
    simHours: number;
    simWatts: number;
    isReplaced: boolean;
    replacementName: string;
    replacementCost: number;
  }>>(() => {
    const initial: Record<string, any> = {};
    for (const a of activeAppliances) {
      initial[a.id] = {
        simHours: a.usageHoursPerDay || (a.cyclesPerMonth ? a.cyclesPerMonth / 30 : 2),
        simWatts: a.powerWatts || 100,
        isReplaced: false,
        replacementName: '',
        replacementCost: 0,
      };
    }
    return initial;
  });

  const [scenarioName, setScenarioName] = useState('Escenario Reducción Climatización e Iluminación');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Sensitivity tool: user chooses 1 appliance and tests hours range from 1 to 12
  const [sensitivityAppId, setSensitivityAppId] = useState<string>(activeAppliances[0]?.id || '');
  const [sensitivityHours, setSensitivityHours] = useState<number>(4);

  // Calculate simulated monthly kWh
  let simulatedMonthlyKwh = 0;
  let totalReplacementCost = 0;

  for (const a of activeAppliances) {
    const mod = mods[a.id] || {
      simHours: a.usageHoursPerDay || 2,
      simWatts: a.powerWatts || 100,
      isReplaced: false,
      replacementName: '',
      replacementCost: 0,
    };

    if (mod.isReplaced) {
      totalReplacementCost += mod.replacementCost;
    }

    const calc = calculateApplianceEnergy({
      powerWatts: mod.simWatts,
      standbyWatts: a.standbyWatts,
      usageHoursPerDay: mod.simHours,
      usageDaysPerMonth: a.usageDaysPerMonth || 30,
      quantity: a.quantity,
      dutyCycle: a.dutyCycle,
      isCycleBased: a.isCycleBased,
      energyPerCycleKwh: a.energyPerCycleKwh,
      cyclesPerMonth: Math.round(mod.simHours * 30),
    });

    simulatedMonthlyKwh += calc.monthlyKwh;
  }

  simulatedMonthlyKwh = roundPrecision(simulatedMonthlyKwh, 1);

  // Simulated cost based on active tariff
  const simCostResult = tariff
    ? calculateTariffCost(tariff, simulatedMonthlyKwh)
    : { totalCalculated: roundPrecision(simulatedMonthlyKwh * 95, 2) };
  const simulatedMonthlyCost = simCostResult.totalCalculated;

  // Differences & Savings
  const deltaMonthlyKwh = roundPrecision(baselineMonthlyKwh - simulatedMonthlyKwh, 1);
  const monthlySavingsCost = roundPrecision(baselineMonthlyCost - simulatedMonthlyCost, 2);
  const annualSavingsCost = roundPrecision(monthlySavingsCost * 12, 2);

  const payback = totalReplacementCost > 0 && annualSavingsCost > 0
    ? calculatePaybackPeriod(totalReplacementCost, annualSavingsCost)
    : null;

  // Sensitivity curve for the chosen appliance
  const targetSensitivityApp = activeAppliances.find(a => a.id === sensitivityAppId) || activeAppliances[0];
  const sensitivitySteps = [1, 2, 3, 4, 6, 8, 10, 12];
  const sensitivityCurve = sensitivitySteps.map(h => {
    if (!targetSensitivityApp) return { hours: h, kwh: 0, cost: 0 };
    const simulatedAppCalc = calculateApplianceEnergy({
      powerWatts: targetSensitivityApp.powerWatts,
      usageHoursPerDay: h,
      usageDaysPerMonth: targetSensitivityApp.usageDaysPerMonth || 30,
      quantity: targetSensitivityApp.quantity,
      dutyCycle: targetSensitivityApp.dutyCycle,
    });
    const totalSimKwh = roundPrecision(baselineMonthlyKwh - targetSensitivityApp.calculatedMonthlyKwh + simulatedAppCalc.monthlyKwh, 1);
    const cost = tariff ? calculateTariffCost(tariff, totalSimKwh).totalCalculated : totalSimKwh * 95;
    return {
      hours: h,
      kwh: totalSimKwh,
      cost: Math.round(cost),
    };
  });

  const handleUpdateMod = (appId: string, field: string, val: any) => {
    setMods(prev => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {}),
        [field]: val,
      },
    }));
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;

    const newScenario: Scenario = {
      id: `scen-${Date.now()}`,
      householdId,
      name: scenarioName.trim(),
      description: `Ahorro estimado de ${deltaMonthlyKwh} kWh/mes (${currencySymbol}${monthlySavingsCost.toLocaleString()}/mes)`,
      modifications: activeAppliances.map(a => {
        const m = mods[a.id];
        return {
          applianceId: a.id,
          name: a.name,
          originalHours: a.usageHoursPerDay || 2,
          simulatedHours: m?.simHours || 2,
          originalWatts: a.powerWatts,
          simulatedWatts: m?.simWatts,
          isReplaced: m?.isReplaced,
          replacementName: m?.replacementName,
          replacementCost: m?.replacementCost,
        };
      }),
      baselineMonthlyKwh,
      simulatedMonthlyKwh,
      deltaMonthlyKwh,
      baselineMonthlyCost,
      simulatedMonthlyCost,
      monthlySavingsCost,
      annualSavingsCost,
      assumptions: [
        'Las horas de uso simuladas se mantienen de forma continua mes a mes.',
        `Cálculo tarifario con ${tariff ? tariff.name : 'Tarifa Plana Estimada'}.`,
      ],
      totalInvestmentCost: totalReplacementCost > 0 ? totalReplacementCost : undefined,
      paybackMonths: payback?.paybackMonths || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveScenario(newScenario);
    setSaveSuccessMsg('¡Escenario guardado exitosamente en el historial local!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-emerald-500" />
            <span>Laboratorio de Ahorro y Simulación</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Modifica hábitos, compara reemplazos por aparatos inverter y descubre cómo cambiarían tus facturas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Nombre del escenario..."
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium w-64"
          />
          <button
            type="button"
            onClick={handleSaveScenario}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Escenario</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
          {saveSuccessMsg}
        </div>
      )}

      {/* Delta Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Consumo Actual (Base)</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {baselineMonthlyKwh} kWh
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {currencySymbol} {Math.round(baselineMonthlyCost).toLocaleString()}/mes
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Consumo Simulado</span>
          <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
            {simulatedMonthlyKwh} kWh
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {currencySymbol} {Math.round(simulatedMonthlyCost).toLocaleString()}/mes
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Ahorro Mensual Estimado</span>
          <div className="flex items-center gap-1 mt-1">
            {monthlySavingsCost >= 0 ? (
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-500" />
            )}
            <span className={`text-2xl font-bold font-mono ${monthlySavingsCost >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {currencySymbol} {Math.abs(Math.round(monthlySavingsCost)).toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {deltaMonthlyKwh >= 0 ? `-${deltaMonthlyKwh}` : `+${Math.abs(deltaMonthlyKwh)}`} kWh al mes
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Ahorro Anual Proyectado</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {currencySymbol} {Math.round(annualSavingsCost).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">
            {payback?.paybackMonths ? `Retorno: ${payback.paybackMonths} meses` : 'En 12 periodos equivalentes'}
          </span>
        </div>
      </div>

      {/* Main Interactive Controls: Habit and Replacement Sliders */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ajuste de Hábitos y Simulación por Aparato
          </h2>
          <p className="text-xs text-slate-500">
            Mueve los controles para variar horas diarias de uso o probar equipos de reemplazo más eficientes.
          </p>
        </div>

        {activeAppliances.length > 0 ? (
          <div className="space-y-4">
            {activeAppliances.map((app) => {
              const mod = mods[app.id] || {
                simHours: app.usageHoursPerDay || 2,
                simWatts: app.powerWatts || 100,
                isReplaced: false,
                replacementName: '',
                replacementCost: 0,
              };

              const originalHours = app.usageHoursPerDay || 2;
              const hoursDelta = roundPrecision(mod.simHours - originalHours, 1);

              return (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {app.name}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        ({app.powerWatts || 'N/A'} W nominal • Original: {originalHours} h/d)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span>Simulado: <strong className="text-emerald-600 dark:text-emerald-400">{mod.simHours} h/día</strong></span>
                      {hoursDelta !== 0 && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${hoursDelta < 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {hoursDelta > 0 ? `+${hoursDelta} h` : `${hoursDelta} h`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono w-8">0 h</span>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      step="0.5"
                      value={mod.simHours}
                      onChange={(e) => handleUpdateMod(app.id, 'simHours', parseFloat(e.target.value) || 0)}
                      className="flex-1 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400 font-mono w-8 text-right">24 h</span>
                  </div>

                  {/* Replacement toggle */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={mod.isReplaced}
                        onChange={(e) => handleUpdateMod(app.id, 'isReplaced', e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>Simular sustitución por modelo eficiente (Inverter / A+++)</span>
                    </label>

                    {mod.isReplaced && (
                      <div className="flex flex-wrap items-center gap-2 w-full pt-1">
                        <input
                          type="text"
                          value={mod.replacementName}
                          onChange={(e) => handleUpdateMod(app.id, 'replacementName', e.target.value)}
                          placeholder="Nombre del modelo eficiente..."
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex-1 min-w-[180px]"
                        />
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-slate-400 text-[11px]">Potencia nueva:</span>
                          <input
                            type="number"
                            value={mod.simWatts}
                            onChange={(e) => handleUpdateMod(app.id, 'simWatts', parseFloat(e.target.value) || 50)}
                            className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-right"
                          />
                          <span className="text-slate-400 text-[11px]">W</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-slate-400 text-[11px]">Costo compra:</span>
                          <input
                            type="number"
                            value={mod.replacementCost}
                            onChange={(e) => handleUpdateMod(app.id, 'replacementCost', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-right"
                            placeholder="0"
                          />
                          <span className="text-slate-400 text-[11px]">{currencySymbol}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No hay aparatos activos en el inventario para simular. Agrega aparatos primero.
          </div>
        )}
      </div>

      {/* Sensitivity Curve Analysis (Part 11.7) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-500" />
              <span>Análisis de Sensibilidad: Curva de Impacto</span>
            </h2>
            <p className="text-xs text-slate-500">
              ¿Cómo cambia mi factura total si varío gradualmente las horas de un aparato clave?
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Aparato a analizar:</span>
            <select
              value={sensitivityAppId}
              onChange={(e) => setSensitivityAppId(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              {activeAppliances.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sensitivity curve table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left font-mono">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-sans">
              <tr>
                <th className="p-2.5">Horas diarias de uso</th>
                <th className="p-2.5">Consumo Total del Hogar</th>
                <th className="p-2.5">Factura Total Mensual Estimada</th>
                <th className="p-2.5 text-right">Diferencia vs Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sensitivityCurve.map((point) => {
                const diffCost = Math.round(point.cost - baselineMonthlyCost);
                return (
                  <tr key={point.hours} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                      {point.hours} horas / día
                    </td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      {point.kwh} kWh/mes
                    </td>
                    <td className="p-2.5 text-slate-900 dark:text-white font-bold">
                      {currencySymbol} {point.cost.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right">
                      <span className={`font-bold ${diffCost <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                        {diffCost > 0 ? `+${currencySymbol}${diffCost.toLocaleString()}` : `${currencySymbol}${diffCost.toLocaleString()}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Scenarios List */}
      {savedScenarios.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Escenarios Guardados en el Historial
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedScenarios.map((scen) => (
              <div
                key={scen.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {scen.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {scen.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      -{scen.deltaMonthlyKwh} kWh/m
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      +{currencySymbol}{Math.round(scen.monthlySavingsCost).toLocaleString()}/mes
                    </span>
                    {scen.paybackMonths && (
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                        Retorno: {scen.paybackMonths} m
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteScenario(scen.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                  title="Eliminar escenario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
