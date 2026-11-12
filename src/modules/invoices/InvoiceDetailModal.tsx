import React, { useState } from 'react';
import {
  Receipt,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  Gauge,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Invoice } from '../../types/invoice';
import { Tariff } from '../../types/tariff';
import { OriginBadge } from '../../components/ui/OriginBadge';
import { FormulaDialog } from '../../components/ui/FormulaDialog';
import { calculateTariffCost } from '../../core/tariff-engine/tariff-engine';
import { useI18n } from '../../i18n/I18nContext';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  tariffs: Tariff[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  tariffs,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t, formatCurrency, formatNumber } = useI18n();
  const [activeTab, setActiveTab] = useState<'summary' | 'breakdown' | 'audit' | 'blocks' | 'original'>('summary');

  if (!invoice) return null;

  const appliedTariff = tariffs.find(t => t.id === invoice.tariffId) || tariffs[0];
  const tariffCalc = appliedTariff ? calculateTariffCost(appliedTariff, invoice.consumptionKwh) : null;
  const tariffDiff = tariffCalc ? Math.round((invoice.declaredTotal - tariffCalc.totalCalculated) * 100) / 100 : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Factura ${invoice.distributor} — ${invoice.periodStart}`}
      subtitle={`Registrada el ${new Date(invoice.createdAt).toLocaleDateString()}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-xl bg-slate-900 dark:bg-[#0B1220] border border-white/10 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#35D39A]">
              {t('kpiSpendTitle')}
            </span>
            <div className="text-3xl font-black font-mono mt-0.5 tabular-nums">
              {formatCurrency(invoice.declaredTotal, invoice.currency)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
              <span className="font-mono">{invoice.consumptionKwh} kWh</span>
              <span>•</span>
              <span>{invoice.billingDays} días facturados</span>
              <span>•</span>
              <OriginBadge origin={invoice.dataOrigin} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Editar factura"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
                  onDelete(invoice.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition"
              title="Eliminar factura"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#19273B] rounded-xl border border-slate-200 dark:border-white/10 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-[#141F32] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('invoiceTabSummary')}
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'breakdown'
                ? 'bg-white dark:bg-[#141F32] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('invoiceTabBreakdown')}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-[#141F32] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('invoiceTabAudit')}
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'blocks'
                ? 'bg-white dark:bg-[#141F32] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('blockPricing')}
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'original'
                ? 'bg-white dark:bg-[#141F32] text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('invoiceTabOriginal')}
          </button>
        </div>

        {/* Tab 1: Summary */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 block mb-0.5">Inicio Periodo</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{invoice.periodStart}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 block mb-0.5">Fin Periodo</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{invoice.periodEnd}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 block mb-0.5">Lectura Anterior</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {invoice.previousReading !== undefined ? `${invoice.previousReading} kWh` : 'No indicada'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 block mb-0.5">Lectura Actual</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {invoice.currentReading !== undefined ? `${invoice.currentReading} kWh` : 'No indicada'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] space-y-2 text-xs">
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Métricas Calculadas del Periodo
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 text-[11px] block">Consumo Diario Promedio:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatNumber(invoice.consumptionKwh / Math.max(1, invoice.billingDays), 2)} kWh/día
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Costo Efectivo por kWh:</span>
                  <span className="font-mono font-bold text-[#42C7D9]">
                    {formatCurrency(invoice.declaredTotal / Math.max(1, invoice.consumptionKwh), invoice.currency)}/kWh
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Tarifa Aplicada:</span>
                  <span className="font-mono font-bold text-[#35D39A]">
                    {appliedTariff?.distributor || 'ICE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Desglose Económico de Conceptos
            </h4>
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-[#19273B] text-slate-500 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="p-2.5">Concepto</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                  {invoice.charges && invoice.charges.length > 0 ? (
                    invoice.charges.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#19273B]/50">
                        <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {c.name}
                        </td>
                        <td className="p-2.5 font-sans text-slate-400 capitalize text-[11px]">
                          {c.category.replace('_', ' ')}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(c.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400 font-sans">
                        No se detallaron conceptos individuales. El monto total registrado es de {formatCurrency(invoice.declaredTotal, invoice.currency)}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Mathematical Audit */}
        {activeTab === 'audit' && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#35D39A]" />
                <span>Auditoría Aritmética Independiente</span>
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  invoice.auditStatus === 'verified_exact'
                    ? 'bg-[#35D39A]/15 text-[#35D39A] border border-[#35D39A]/30'
                    : 'bg-[#F1B653]/15 text-[#F1B653] border border-[#F1B653]/30'
                }`}
              >
                {invoice.auditStatus === 'verified_exact' ? 'Aritmética Verificada' : 'Diferencias Detectadas'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#A7B6CA] leading-relaxed">
              {invoice.auditExplanation || 'Todas las partidas ariméticas han sido comprobadas contra las sumas de conceptos.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 block text-[10px]">Total Declarado</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(invoice.declaredTotal, invoice.currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 block text-[10px]">Suma de Conceptos</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(invoice.calculatedTotal || invoice.declaredTotal, invoice.currency)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10">
                <span className="text-slate-400 block text-[10px]">Diferencia Neta</span>
                <span className={`font-mono font-bold ${Math.abs(invoice.arithmeticDifference || 0) > 0 ? 'text-[#F1B653]' : 'text-[#35D39A]'}`}>
                  {formatCurrency(Math.abs(invoice.arithmeticDifference || 0), invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Block Pricing Verification */}
        {activeTab === 'blocks' && appliedTariff && tariffCalc && (
          <div className="p-4 rounded-xl border border-[#42C7D9]/20 bg-[#42C7D9]/5 dark:bg-[#42C7D9]/10 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#42C7D9]">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Comprobación con Tarifa {appliedTariff.name}</span>
              </div>
              <FormulaDialog
                data={{
                  title: `Cálculo de Factura según ${appliedTariff.name}`,
                  formula: 'Total = Subtotal_Energía + Cargo_Fijo + Alumbrado + Bomberos + IVA',
                  variables: [
                    { symbol: 'E', name: 'Consumo kWh', value: invoice.consumptionKwh, unit: 'kWh' },
                    { symbol: 'Método', name: 'Esquema de cobro', value: appliedTariff.calculationMethod, unit: '-' },
                  ],
                  substitution: tariffCalc.formulaSteps.join('\n'),
                  result: String(tariffCalc.totalCalculated),
                  units: invoice.currency,
                  assumptions: [
                    `Pliego tarifario oficial de ${appliedTariff.distributor} registrado en el catálogo.`,
                    'El IVA del 13% aplica en Costa Rica sobre facturas residenciales únicamente si el consumo supera 280 kWh mensuales.',
                  ],
                  limitations: [
                    'Si la distribuidora aplicó ajustes por redondeo, cargos por mora o cobros municipales adicionales no reflejados en el pliego, puede existir una ligera diferencia.',
                  ],
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
              <div>
                <span className="text-slate-500">Energía calculada:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{formatCurrency(tariffCalc.energyCost, invoice.currency)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Total según tarifa:</span>{' '}
                <strong className="text-[#42C7D9]">{formatCurrency(tariffCalc.totalCalculated, invoice.currency)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Diferencia vs recibo:</span>{' '}
                <strong className={Math.abs(tariffDiff || 0) > 5 ? 'text-[#F1B653]' : 'text-[#35D39A]'}>
                  {formatCurrency(tariffDiff || 0, invoice.currency)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Original Document */}
        {activeTab === 'original' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {t('invoiceTabOriginal')}
            </h4>
            {invoice.imageUri ? (
              <img
                src={invoice.imageUri}
                alt="Comprobante físico de la factura"
                className="max-h-80 rounded-xl border border-slate-200 dark:border-white/10 object-contain bg-slate-950 p-2"
              />
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-[#19273B] rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                No se adjuntó archivo de imagen escaneada para esta factura.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
