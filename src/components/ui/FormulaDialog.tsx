import React, { useState } from 'react';
import { HelpCircle, Calculator, Info } from 'lucide-react';
import { Modal } from './Modal';

export interface FormulaExplanationData {
  title: string;
  formula: string;
  variables: Array<{ symbol: string; name: string; value: string | number; unit: string }>;
  substitution: string;
  result: string;
  units: string;
  assumptions: string[];
  limitations: string[];
}

interface FormulaDialogProps {
  data: FormulaExplanationData;
  buttonLabel?: string;
  buttonSize?: 'sm' | 'xs';
}

export const FormulaDialog: React.FC<FormulaDialogProps> = ({
  data,
  buttonLabel = '¿Cómo se calculó?',
  buttonSize = 'xs',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline transition ${
          buttonSize === 'xs' ? 'text-xs' : 'text-sm'
        }`}
        title="Ver desglose matemático y fórmula"
      >
        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{buttonLabel}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={data.title}
        subtitle="Rigor matemático y desglose reproducible"
        maxWidth="lg"
      >
        <div className="space-y-4 text-sm">
          {/* Formula box */}
          <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Fórmula Teórica
            </span>
            <div className="font-mono text-base font-bold text-slate-900 dark:text-emerald-400">
              {data.formula}
            </div>
          </div>

          {/* Variables and values table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Variables y Parámetros Introducidos
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Símbolo</th>
                    <th className="py-2 px-3">Variable</th>
                    <th className="py-2 px-3">Valor</th>
                    <th className="py-2 px-3">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {data.variables.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">{v.symbol}</td>
                      <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">{v.name}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{v.value}</td>
                      <td className="py-2 px-3 text-slate-500">{v.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Numerical substitution */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Sustitución Numérica
            </span>
            <div className="font-mono text-sm text-slate-800 dark:text-slate-200">
              {data.substitution}
            </div>
            <div className="pt-2 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-800 mt-2">
              Resultado = {data.result} {data.units}
            </div>
          </div>

          {/* Assumptions */}
          {data.assumptions && data.assumptions.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-800 dark:text-blue-300">
                <Calculator className="w-3.5 h-3.5" />
                <span>Supuestos del modelo</span>
              </div>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 pl-1">
                {data.assumptions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Limitations */}
          {data.limitations && data.limitations.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                <Info className="w-3.5 h-3.5" />
                <span>Limitaciones e Incertidumbre</span>
              </div>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5 pl-1">
                {data.limitations.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
