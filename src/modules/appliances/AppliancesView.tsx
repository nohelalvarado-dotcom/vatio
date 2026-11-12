import React, { useState } from 'react';
import {
  Plus,
  Tv,
  Search,
  Filter,
  Download,
  GitCompare,
  Eye,
  Trash2,
  Power,
  PowerOff,
  Flame,
  Wind,
  Sparkles,
} from 'lucide-react';
import { Appliance, ApplianceCategory } from '../../types/appliance';
import { Tariff } from '../../types/tariff';
import { OriginBadge } from '../../components/ui/OriginBadge';
import { exportAppliancesToCsv } from '../../services/export-service';
import { ApplianceFormModal } from './ApplianceFormModal';
import { ApplianceDetailModal } from './ApplianceDetailModal';
import { ApplianceCompareModal } from './ApplianceCompareModal';

interface AppliancesViewProps {
  appliances: Appliance[];
  tariff?: Tariff;
  householdId: string;
  currencySymbol: string;
  onSaveAppliance: (appliance: Appliance) => void;
  onDeleteAppliance: (id: string) => void;
  onToggleActive: (id: string) => void;
}

const CATEGORY_NAMES: Record<ApplianceCategory, string> = {
  climatizacion: 'Climatización',
  cocina: 'Cocina',
  lavanderia: 'Lavandería',
  agua_caliente: 'Agua Caliente',
  entretenimiento: 'Entretenimiento',
  informatica: 'Informática',
  iluminacion: 'Iluminación',
  otros: 'Otros',
};

export const AppliancesView: React.FC<AppliancesViewProps> = ({
  appliances,
  tariff,
  householdId,
  currencySymbol,
  onSaveAppliance,
  onDeleteAppliance,
  onToggleActive,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'consumption' | 'cost' | 'name'>('consumption');

  // Aggregated totals
  const activeAppliances = appliances.filter(a => a.active);
  const totalMonthlyKwh = Math.round(
    activeAppliances.reduce((sum, a) => sum + a.calculatedMonthlyKwh, 0) * 10
  ) / 10;
  const totalMonthlyCost = Math.round(
    activeAppliances.reduce((sum, a) => sum + a.calculatedMonthlyCost, 0)
  );

  // Filter and sort
  const filtered = appliances
    .filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.brand && app.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'consumption') return b.calculatedMonthlyKwh - a.calculatedMonthlyKwh;
      if (sortBy === 'cost') return b.calculatedMonthlyCost - a.calculatedMonthlyCost;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Inventario Energético del Hogar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conoce el costo y consumo de cada aparato con modelos de ciclo de trabajo y potencia en espera.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {appliances.length >= 2 && (
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5 text-cyan-500" />
              <span>Comparar Aparatos</span>
            </button>
          )}

          {appliances.length > 0 && (
            <button
              type="button"
              onClick={() => exportAppliancesToCsv(appliances)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingAppliance(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Aparato</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Aparatos Registrados</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {appliances.length}
          </span>
          <span className="text-[10px] text-slate-400">{activeAppliances.length} activos contabilizados</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Consumo Mensual Estimado</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {totalMonthlyKwh} kWh
          </span>
          <span className="text-[10px] text-slate-400">Total suma de inventario</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Gasto Mensual Estimado</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {currencySymbol} {totalMonthlyCost.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Según tarifa vigente</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Gasto Anual Proyectado</span>
          <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
            {currencySymbol} {(totalMonthlyCost * 12).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">Proyección 12 meses</span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar aparato por nombre o marca..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(CATEGORY_NAMES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
          >
            <option value="consumption">Mayor consumo (kWh)</option>
            <option value="cost">Mayor costo ($/₡)</option>
            <option value="name">Nombre alfabético</option>
          </select>
        </div>
      </div>

      {/* Appliances List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111C2C] border transition shadow-xs flex flex-col justify-between ${
                app.active
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-slate-200/60 dark:border-slate-800/40 opacity-60 bg-slate-50/50 dark:bg-slate-950/20'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {CATEGORY_NAMES[app.category] || app.category}
                      {app.quantity > 1 ? ` • ${app.quantity} unidades` : ''}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                      {app.name}
                    </h3>
                    {(app.brand || app.model) && (
                      <span className="text-xs text-slate-500 block">
                        {[app.brand, app.model].filter(Boolean).join(' • ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleActive(app.id)}
                      className={`p-1.5 rounded-lg transition ${
                        app.active
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                      }`}
                      title={app.active ? 'Desactivar aparato' : 'Activar aparato'}
                    >
                      {app.active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                    </button>
                    <OriginBadge origin={app.dataOrigin} />
                  </div>
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Potencia</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {app.powerWatts ? `${app.powerWatts} W` : `${app.energyPerCycleKwh} kWh/c`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Uso</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {app.usageHoursPerDay ? `${app.usageHoursPerDay} h/día` : `${app.cyclesPerMonth} c/mes`}
                    </span>
                  </div>
                </div>

                {/* Consumption and cost */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Consumo Mensual</span>
                    <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {app.calculatedMonthlyKwh} <span className="text-xs font-normal">kWh</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Costo Estimado</span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {currencySymbol} {app.calculatedMonthlyCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedAppliance(app)}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAppliance(app);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                    title="Editar"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar ${app.name}?`)) {
                        onDeleteAppliance(app.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#111C2C] p-6 space-y-3">
          <Tv className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {appliances.length === 0 ? 'Sin aparatos en el inventario' : 'No hay aparatos con los filtros aplicados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {appliances.length === 0
              ? 'Agrega tus electrodomésticos para saber con precisión científica cuánto consume y cuánto te cuesta cada uno al mes.'
              : 'Intenta limpiar el filtro de categoría o el texto de búsqueda.'}
          </p>
          {appliances.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingAppliance(null);
                setIsFormOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar primer aparato</span>
            </button>
          )}
        </div>
      )}

      {/* Form Modal */}
      <ApplianceFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAppliance(null);
        }}
        onSave={onSaveAppliance}
        householdId={householdId}
        tariff={tariff}
        currencySymbol={currencySymbol}
        initialData={editingAppliance}
      />

      {/* Detail Modal */}
      <ApplianceDetailModal
        isOpen={selectedAppliance !== null}
        onClose={() => setSelectedAppliance(null)}
        appliance={selectedAppliance}
        currencySymbol={currencySymbol}
        totalHouseholdKwh={totalMonthlyKwh}
        onEdit={(app) => {
          setEditingAppliance(app);
          setIsFormOpen(true);
        }}
        onDelete={onDeleteAppliance}
      />

      {/* Compare Modal */}
      <ApplianceCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        appliances={appliances}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};
