import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Calculator,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Tariff } from '../../types/tariff';
import { calculateTariffCost } from '../../core/tariff-engine/tariff-engine';
import { Modal } from '../../components/ui/Modal';
import { FormulaDialog } from '../../components/ui/FormulaDialog';

interface TariffsViewProps {
  tariffs: Tariff[];
  activeTariffId?: string;
  onSelectActiveTariff: (id: string) => void;
  onSaveTariff: (tariff: Tariff) => void;
  currencySymbol: string;
}

export const TariffsView: React.FC<TariffsViewProps> = ({
  tariffs,
  activeTariffId,
  onSelectActiveTariff,
  onSaveTariff,
  currencySymbol,
}) => {
  const [selectedTariff, setSelectedTariff] = useState<Tariff>(
    tariffs.find(t => t.id === activeTariffId) || tariffs[0]
  );
  const [testKwh, setTestKwh] = useState<string>('285');

  // Interactive tariff calculation
  const parsedKwh = Math.max(0, parseFloat(testKwh) || 0);
  const calcResult = selectedTariff ? calculateTariffCost(selectedTariff, parsedKwh) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
          <span>Administrador de Estructuras Tarifarias</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pliegos oficiales verificados, bloques de consumo progresivo marginal y calculadora de simulación tarifaria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tariffs List */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tarifas Disponibles ({tariffs.length})
          </span>

          <div className="space-y-2.5">
            {tariffs.map((t) => {
              const isSelected = selectedTariff?.id === t.id;
              const isActive = activeTariffId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTariff(t)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2C] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {t.name}
                      </h3>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {t.distributor} • {t.country}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {t.validationStatus === 'verified_official' ? 'Oficial ARESEP' : 'Estimada'}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          ✓ En Uso
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {t.calculationMethod === 'tiered_marginal'
                        ? 'Bloques Marginales'
                        : t.calculationMethod === 'tiered_integral'
                        ? 'Bloque Integral'
                        : 'Tarifa Fija'}
                    </span>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectActiveTariff(t.id);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Activar para mi hogar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Tariff Breakdown & Interactive Calculator */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTariff && (
            <>
              {/* Detailed Specs Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Ficha Técnica Tarifaria
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedTariff.name}
                    </h2>
                  </div>
                  {selectedTariff.sourceUrl && (
                    <a
                      href={selectedTariff.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{selectedTariff.sourceName}</span>
                    </a>
                  )}
                </div>

                {selectedTariff.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    {selectedTariff.notes}
                  </p>
                )}

                {/* Tier Blocks Grid */}
                {selectedTariff.components.tiers && selectedTariff.components.tiers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Escalones de Consumo y Precios por Bloque
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedTariff.components.tiers.map((tier) => (
                        <div
                          key={tier.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                        >
                          <span className="font-bold text-slate-900 dark:text-white block font-sans">
                            {tier.name}
                          </span>
                          <div className="flex items-center justify-between mt-1 text-slate-500">
                            <span>{tier.fromKwh} a {tier.toKwh !== null ? `${tier.toKwh} kWh` : 'Adelante'}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              {currencySymbol} {tier.pricePerKwh} / kWh
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Charges / Taxes */}
                {selectedTariff.components.additionalConcepts.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Cargos Adicionales y Tributos
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedTariff.components.additionalConcepts.map((c) => (
                        <span
                          key={c.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                        >
                          <strong>{c.name}:</strong> {c.conceptType === 'percentage' ? `${c.rate}%` : `${currencySymbol}${c.rate}/kWh`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Tariff Calculator (Part 9.4) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-emerald-500" />
                      <span>Calculadora Instantánea de Tarifa</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Introduce un consumo en kWh y observa el desglose aritmético exacto.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Consumo a probar:</span>
                    <div className="relative w-28">
                      <input
                        type="number"
                        min="0"
                        value={testKwh}
                        onChange={(e) => setTestKwh(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right pr-10"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono">
                        kWh
                      </span>
                    </div>
                  </div>
                </div>

                {calcResult && (
                  <div className="space-y-4 pt-2">
                    {/* Big Result Display */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 font-mono">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                          Total Calculado para {parsedKwh} kWh
                        </span>
                        <span className="text-3xl font-black text-emerald-400 block mt-0.5">
                          {currencySymbol} {calcResult.totalCalculated.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                          Precio Efectivo Promedio
                        </span>
                        <span className="text-xl font-bold text-cyan-300 block mt-0.5">
                          {currencySymbol} {calcResult.effectiveAveragePricePerKwh} / kWh
                        </span>
                      </div>
                    </div>

                    {/* Step-by-step breakdown */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans mb-1">
                        Desglose Paso a Paso:
                      </span>
                      {calcResult.formulaSteps.map((step, i) => (
                        <div key={i} className="text-slate-700 dark:text-slate-300">• {step}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
