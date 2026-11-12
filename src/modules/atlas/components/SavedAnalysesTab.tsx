import React, { useState } from 'react';
import {
  Bookmark,
  Star,
  Clock,
  Eye,
  Trash2,
  Copy,
  Download,
  Plus,
  Layers,
  Calendar,
  BarChart2,
  Share2,
} from 'lucide-react';
import { SavedVisualization, AnalyticsSnapshot, ThreeChartType, TimeRangeFilter } from '../../../types/atlas';
import { Modal } from '../../../components/ui/Modal';

interface SavedAnalysesTabProps {
  savedList: SavedVisualization[];
  snapshots: AnalyticsSnapshot[];
  onOpenVisualization: (viz: SavedVisualization) => void;
  onSaveCurrentVisualization: (name: string, description: string) => Promise<void>;
  onDeleteVisualization: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  currentChartType: ThreeChartType;
}

export const SavedAnalysesTab: React.FC<SavedAnalysesTabProps> = ({
  savedList,
  snapshots,
  onOpenVisualization,
  onSaveCurrentVisualization,
  onDeleteVisualization,
  onToggleFavorite,
  currentChartType,
}) => {
  const [subTab, setSubTab] = useState<'saved' | 'snapshots'>('saved');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    setIsSaving(true);
    try {
      await onSaveCurrentVisualization(saveTitle.trim(), saveDesc.trim());
      setSaveTitle('');
      setSaveDesc('');
      setIsSaveModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = (viz: SavedVisualization) => {
    const dataStr = JSON.stringify(viz, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisis-vatio-${viz.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Switcher and New Analysis button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('saved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              subTab === 'saved'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Mis Análisis Personalizados ({savedList.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('snapshots')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              subTab === 'snapshots'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Registros Automáticos por Factura ({snapshots.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsSaveModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Guardar Vista Actual</span>
        </button>
      </div>

      {/* SubTab 1: Saved Visualizations Cards */}
      {subTab === 'saved' && (
        <>
          {savedList.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-slate-500">
              <Bookmark className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No tienes análisis guardados todavía
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Configura cualquier visualización 3D, matriz o comparador y pulsa «Guardar Vista Actual» para conservarlo permanentemente en tu biblioteca.
              </p>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-white transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guardar análisis actual</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedList.map((viz) => (
                <div
                  key={viz.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-cyan-500 uppercase tracking-wider">
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>{viz.chartType}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(viz.id)}
                        className={`p-1 rounded-md transition ${
                          viz.isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={viz.isFavorite ? 'Quitar de favoritos' : 'Marcar favorito'}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {viz.title}
                    </h4>

                    {viz.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {viz.description}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                      <span>Rango: <strong className="font-mono text-slate-600 dark:text-slate-300">{viz.dateRange}</strong></span>
                      <span>Modo: <strong className="font-mono text-slate-600 dark:text-slate-300 uppercase">{viz.renderMode}</strong></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenVisualization(viz)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleExportJson(viz)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title="Exportar configuración JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteVisualization(viz.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 transition"
                        title="Eliminar análisis"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SubTab 2: Auto-Snapshots per Invoice */}
      {subTab === 'snapshots' && (
        <div className="space-y-3">
          {snapshots.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              Los registros analíticos se generan y asocian automáticamente conforme se registran y auditan facturas.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1728] overflow-hidden">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#141F32]/50 transition text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {snap.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        v{snap.methodologyVersion}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      Periodo: {snap.periodStart} al {snap.periodEnd}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-[11px] text-right">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Consumo</span>
                      <strong className="text-emerald-400">{snap.metricsSummary.consumptionKwh} kWh</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Costo/kWh</span>
                      <strong className="text-cyan-400">{snap.metricsSummary.effectiveCostPerKwh}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Guardar Nuevo Análisis */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Guardar Análisis en la Biblioteca de Atlas"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Título del Análisis *
            </label>
            <input
              type="text"
              required
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Ej. Evolución Anual de Consumo y Tarifas 2024"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Notas o Hipótesis del Estudio (Opcional)
            </label>
            <textarea
              rows={3}
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
              placeholder="Comentarios sobre estacionalidad, cambio de electrodomésticos o auditoría tarifaria..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Tipo de Gráfico Actual:</span>
              <strong className="font-mono text-slate-700 dark:text-slate-200 uppercase">{currentChartType}</strong>
            </div>
            <div className="flex justify-between">
              <span>Almacenamiento:</span>
              <span>100% Cifrado Local IndexedDB</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !saveTitle.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition"
            >
              {isSaving ? 'Guardando...' : 'Guardar Análisis'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
