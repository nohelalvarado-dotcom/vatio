import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  Search,
  Filter,
  GitCompare,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Eye,
  Trash2,
} from 'lucide-react';
import { Invoice } from '../../types/invoice';
import { Tariff } from '../../types/tariff';
import { OriginBadge } from '../../components/ui/OriginBadge';
import { exportInvoicesToCsv } from '../../services/export-service';
import { InvoiceFormModal } from './InvoiceFormModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { InvoiceCompareModal } from './InvoiceCompareModal';

interface InvoicesViewProps {
  invoices: Invoice[];
  tariffs: Tariff[];
  householdId: string;
  currency: string;
  distributor: string;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  tariffs,
  householdId,
  currency,
  distributor,
  onSaveInvoice,
  onDeleteInvoice,
}) => {
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [auditFilter, setAuditFilter] = useState<string>('all');

  // Available years from invoices
  const years = Array.from(
    new Set(invoices.map(inv => inv.periodStart.slice(0, 4)).filter(Boolean))
  ).sort().reverse();

  // Filtered invoices
  const filtered = invoices.filter(inv => {
    const matchesSearch =
      inv.distributor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inv.periodStart.includes(searchTerm);

    const matchesYear = yearFilter === 'all' || inv.periodStart.startsWith(yearFilter);
    const matchesAudit = auditFilter === 'all' || inv.auditStatus === auditFilter;

    return matchesSearch && matchesYear && matchesAudit;
  });

  // Aggregated metrics
  const totalCost = invoices.reduce((sum, i) => sum + i.declaredTotal, 0);
  const totalKwh = invoices.reduce((sum, i) => sum + i.consumptionKwh, 0);
  const avgCostPerKwh = totalKwh > 0 ? (totalCost / totalKwh).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Centro de Facturas Eléctricas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registro, auditoría aritmética independiente, desglose y comprobación tarifaria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoices.length >= 2 && (
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-500" />
              <span>Comparar Periodos</span>
            </button>
          )}

          {invoices.length > 0 && (
            <button
              type="button"
              onClick={() => exportInvoicesToCsv(invoices)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingInvoice(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Factura</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Facturas Registradas</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {invoices.length}
          </span>
          <span className="text-[10px] text-slate-400">Total en el historial</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Gasto Acumulado</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {currency}{totalCost.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Suma total declarada</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Consumo Acumulado</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {totalKwh.toLocaleString()} kWh
          </span>
          <span className="text-[10px] text-slate-400">Total energía</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Costo Medio Global</span>
          <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
            {currency}{avgCostPerKwh}
          </span>
          <span className="text-[10px] text-slate-400">Por kWh consumido</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por fecha, distribuidora o folio..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          >
            <option value="all">Todos los años</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          >
            <option value="all">Todas las auditorías</option>
            <option value="verified_exact">Aritmética Exacta</option>
            <option value="arithmetic_difference">Con Diferencia Aritmética</option>
            <option value="reading_inconsistent">Discrepancia en Lectura</option>
          </select>
        </div>
      </div>

      {/* Invoices List / Grid */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    {inv.distributor} {inv.invoiceNumber ? `(#${inv.invoiceNumber})` : ''}
                  </span>
                  <OriginBadge origin={inv.dataOrigin} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inv.auditStatus === 'verified_exact'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {inv.auditStatus === 'verified_exact' ? 'Aritmética Exacta' : 'Diferencia Aritmética'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {inv.periodStart} al {inv.periodEnd} ({inv.billingDays} días)
                  </span>
                  {inv.previousReading !== undefined && inv.currentReading !== undefined && (
                    <span>• Lecturas: {inv.previousReading} → {inv.currentReading}</span>
                  )}
                </div>
              </div>

              {/* Cost & Consumption values + actions */}
              <div className="flex items-center justify-between sm:justify-end gap-5">
                <div className="text-left sm:text-right font-mono">
                  <span className="text-lg font-black text-slate-900 dark:text-white block">
                    {inv.currency} {inv.declaredTotal.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                    {inv.consumptionKwh} kWh
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Ver desglose y auditoría"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar esta factura permanentemente?')) {
                        onDeleteInvoice(inv.id);
                      }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111C2C] p-6 space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {invoices.length === 0 ? 'Sin facturas registradas' : 'No se encontraron facturas con los filtros seleccionados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {invoices.length === 0
              ? 'Registra tu primera factura para comenzar a auditar lecturas, conceptos y cobros de tu distribuidora.'
              : 'Intenta limpiar el término de búsqueda o restablecer los filtros de año y auditoría.'}
          </p>
          {invoices.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingInvoice(null);
                setIsFormOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar primera factura</span>
            </button>
          )}
        </div>
      )}

      {/* Form Modal */}
      <InvoiceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingInvoice(null);
        }}
        onSave={onSaveInvoice}
        householdId={householdId}
        defaultCurrency={currency}
        defaultDistributor={distributor}
        tariffs={tariffs}
        initialData={editingInvoice}
      />

      {/* Detail Modal */}
      <InvoiceDetailModal
        isOpen={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        tariffs={tariffs}
        onEdit={(inv) => {
          setEditingInvoice(inv);
          setIsFormOpen(true);
        }}
        onDelete={onDeleteInvoice}
      />

      {/* Compare Modal */}
      <InvoiceCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        invoices={invoices}
      />
    </div>
  );
};
