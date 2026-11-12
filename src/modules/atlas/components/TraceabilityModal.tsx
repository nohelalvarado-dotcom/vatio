import React from 'react';
import { X, ShieldCheck, Database, Calculator, FileText, Info } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { OriginBadge } from '../../../components/ui/OriginBadge';
import { DataTraceabilityInfo } from '../../../types/atlas';

interface TraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DataTraceabilityInfo | null;
}

export const TraceabilityModal: React.FC<TraceabilityModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trazabilidad y Origen del Dato" maxWidth="lg">
      <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
        {/* Metric Header Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#141F32] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Variable Analizada
            </span>
            <OriginBadge origin={data.provenance} />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            {data.metricName}
          </h4>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {data.value} <span className="text-xs font-normal text-slate-400">{data.unit}</span>
          </div>
        </div>

        {/* Mathematical Formula if present */}
        {data.formula && (
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-cyan-200">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
              <Calculator className="w-3.5 h-3.5" />
              <span>Fórmula o Algoritmo Aplicado</span>
            </div>
            <code className="block p-2 rounded bg-cyan-950/60 font-mono text-xs text-cyan-300 border border-cyan-800/30">
              {data.formula}
            </code>
          </div>
        )}

        {/* Source Invoice & Date Reference */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F1728] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Documento de Origen</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Identificador Factura:</span>
              <span className="font-mono text-slate-900 dark:text-white font-medium">
                {data.sourceInvoiceNumber || data.sourceInvoiceId || 'Historial Agregado'}
              </span>
            </div>
            {data.periodDates && (
              <div>
                <span className="text-slate-400 block">Periodo de Facturación:</span>
                <span className="font-mono text-slate-900 dark:text-white font-medium">
                  {data.periodDates}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Underlying Inputs */}
        {data.underlyingInputs && data.underlyingInputs.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
              Parámetros de Entrada Registrados
            </span>
            <div className="space-y-1">
              {data.underlyingInputs.map((inp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/60 dark:bg-[#141F32]/50 border border-slate-200/50 dark:border-slate-800/50 text-[11px]"
                >
                  <span className="text-slate-500 dark:text-slate-400">{inp.label}:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{inp.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Methodological Context */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>{data.explanation}</p>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
};
