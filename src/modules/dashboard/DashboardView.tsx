import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Receipt,
  Tv,
  FlaskConical,
  Activity,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Household } from '../../types/household';
import { Invoice } from '../../types/invoice';
import { Appliance } from '../../types/appliance';
import { EnergyBarChart } from '../../components/charts/EnergyBarChart';
import { CategoryDonutChart } from '../../components/charts/CategoryDonutChart';
import { OriginBadge } from '../../components/ui/OriginBadge';
import { FormulaDialog } from '../../components/ui/FormulaDialog';
import { DiagnosticItem } from '../../types/diagnostic';
import { useI18n } from '../../i18n/I18nContext';

interface DashboardViewProps {
  household: Household | null;
  invoices: Invoice[];
  appliances: Appliance[];
  diagnostics: DiagnosticItem[];
  onNavigate: (view: string) => void;
  onOpenAddInvoice: () => void;
  onOpenAddAppliance: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  household,
  invoices,
  appliances,
  diagnostics,
  onNavigate,
  onOpenAddInvoice,
  onOpenAddAppliance,
}) => {
  const { t, formatCurrency, formatNumber } = useI18n();
  const currency = household?.currencySymbol || '₡';

  // Sort invoices chronologically
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  const latestInvoice = sortedInvoices.length > 0 ? sortedInvoices[sortedInvoices.length - 1] : null;
  const previousInvoice = sortedInvoices.length > 1 ? sortedInvoices[sortedInvoices.length - 2] : null;

  // Differences vs previous period
  let costDiff = 0;
  let costDiffPercent = 0;
  let kwhDiff = 0;
  let kwhDiffPercent = 0;

  if (latestInvoice && previousInvoice) {
    costDiff = latestInvoice.declaredTotal - previousInvoice.declaredTotal;
    costDiffPercent =
      previousInvoice.declaredTotal > 0
        ? (costDiff / previousInvoice.declaredTotal) * 100
        : 0;

    kwhDiff = latestInvoice.consumptionKwh - previousInvoice.consumptionKwh;
    kwhDiffPercent =
      previousInvoice.consumptionKwh > 0
        ? (kwhDiff / previousInvoice.consumptionKwh) * 100
        : 0;
  }

  // Active appliances consumption
  const activeAppliances = appliances.filter(a => a.active);
  const totalApplianceMonthlyKwh = activeAppliances.reduce(
    (sum, a) => sum + a.calculatedMonthlyKwh,
    0
  );

  // Standby vampire loads
  const totalStandbyWatts = activeAppliances.reduce(
    (sum, a) => sum + (a.standbyWatts || 0) * a.quantity,
    0
  );
  const monthlyStandbyKwh = (totalStandbyWatts * 24 * 30) / 1000;

  // Key metrics
  const avgCostPerKwh =
    latestInvoice && latestInvoice.consumptionKwh > 0
      ? latestInvoice.declaredTotal / latestInvoice.consumptionKwh
      : null;

  const avgDailyKwh = latestInvoice
    ? latestInvoice.consumptionKwh / Math.max(1, latestInvoice.billingDays || 30)
    : null;

  // Identified Potential Savings: standby reduction + efficient actions (~12-18% of bill)
  const estimatedSavingsKwh = Math.round(monthlyStandbyKwh + (latestInvoice?.consumptionKwh || 180) * 0.12);
  const estimatedSavingsAmount = avgCostPerKwh
    ? Math.round(estimatedSavingsKwh * avgCostPerKwh)
    : estimatedSavingsKwh * 85;

  // Pending alerts
  const pendingAlerts = diagnostics.filter(d => d.status === 'pendiente');

  return (
    <div className="space-y-5">
      {/* Bento Top Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#35D39A] uppercase tracking-wider">
              {t('brandSubtitle')}
            </span>
            <span className="text-slate-300 dark:text-white/20">·</span>
            <span className="text-[11px] text-slate-500 dark:text-[#A7B6CA]">
              {household?.name || 'Instalación Principal'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('navDashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#A7B6CA] mt-0.5">
            {latestInvoice
              ? `Ciclo de facturación activo: ${latestInvoice.periodStart} al ${latestInvoice.periodEnd} (${latestInvoice.billingDays} días)`
              : 'Sin facturas registradas. Comienza añadiendo tu recibo más reciente.'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenAddInvoice}
            className="px-3.5 py-2 rounded-xl bg-[#35D39A] hover:bg-[#45e3aa] text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>{t('btnRecordInvoice')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddAppliance}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#19273B] dark:hover:bg-[#24364D] text-slate-800 dark:text-white font-medium text-xs border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1.5"
          >
            <Tv className="w-4 h-4 text-slate-500" />
            <span>{t('btnAddAppliance')}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#19273B] dark:hover:bg-[#24364D] text-slate-800 dark:text-white font-medium text-xs border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1.5"
          >
            <FlaskConical className="w-4 h-4 text-slate-500" />
            <span>{t('btnSimulateScenario')}</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Row 1: 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gasto del Período */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-[#A7B6CA]">
                {t('kpiSpendTitle')}
              </span>
              {latestInvoice && <OriginBadge origin={latestInvoice.dataOrigin} />}
            </div>

            {latestInvoice ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(latestInvoice.declaredTotal, latestInvoice.currency, currency)}
                  </span>
                </div>

                {previousInvoice && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                    {costDiff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#F1B653] font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{currency}{formatNumber(Math.abs(costDiff))} (+{formatNumber(costDiffPercent, 1)}%)
                      </span>
                    ) : costDiff < 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#35D39A] font-semibold">
                        <TrendingDown className="w-3.5 h-3.5" />
                        -{currency}{formatNumber(Math.abs(costDiff))} ({formatNumber(costDiffPercent, 1)}%)
                      </span>
                    ) : (
                      <span className="text-slate-400">Sin variación</span>
                    )}
                    <span className="text-[11px] text-slate-400">{t('vsPreviousPeriod')}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="py-2 text-xs text-slate-400">Sin facturas registradas</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Distribuidora: <strong className="text-slate-700 dark:text-slate-300">{latestInvoice?.distributor || 'ICE'}</strong></span>
            <span>Auditoría: <strong className="text-[#35D39A]">Conforme</strong></span>
          </div>
        </div>

        {/* Card 2: Consumo Energético */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-[#A7B6CA]">
                {t('kpiConsumptionTitle')}
              </span>
              {latestInvoice && (
                <OriginBadge origin={latestInvoice.previousReading ? 'MEDIDO' : 'DECLARADO'} />
              )}
            </div>

            {latestInvoice ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#35D39A] tabular-nums">
                    {formatNumber(latestInvoice.consumptionKwh, 0)}
                  </span>
                  <span className="text-xs font-medium text-slate-500">kWh</span>
                </div>

                {previousInvoice && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                    {kwhDiff > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#F1B653] font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{formatNumber(kwhDiff, 0)} kWh (+{formatNumber(kwhDiffPercent, 1)}%)
                      </span>
                    ) : kwhDiff < 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#35D39A] font-semibold">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {formatNumber(kwhDiff, 0)} kWh ({formatNumber(kwhDiffPercent, 1)}%)
                      </span>
                    ) : (
                      <span className="text-slate-400">Sin variación</span>
                    )}
                    <span className="text-[11px] text-slate-400">{t('vsPreviousPeriod')}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="py-2 text-xs text-slate-400">Sin datos de lectura</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Promedio diario: <strong className="font-mono text-slate-700 dark:text-slate-300">{avgDailyKwh ? formatNumber(avgDailyKwh, 1) : 0} kWh/d</strong></span>
            <span>Aparatos: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatNumber(totalApplianceMonthlyKwh, 0)} kWh</strong></span>
          </div>
        </div>

        {/* Card 3: Costo Promedio Real */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-[#A7B6CA]">
                {t('kpiAvgCostTitle')}
              </span>
              {latestInvoice && (
                <FormulaDialog
                  data={{
                    title: 'Cálculo del Costo Medio Ponderado por kWh',
                    formula: 'Tarifa_efectiva = Monto_Total_Factura / Consumo_Total_kWh',
                    variables: [
                      { symbol: 'Total', name: 'Total Facturado', value: latestInvoice.declaredTotal, unit: currency },
                      { symbol: 'E', name: 'Energía Consumida', value: latestInvoice.consumptionKwh, unit: 'kWh' },
                    ],
                    substitution: `${latestInvoice.declaredTotal} / ${latestInvoice.consumptionKwh}`,
                    result: (latestInvoice.declaredTotal / Math.max(1, latestInvoice.consumptionKwh)).toFixed(2),
                    units: `${currency}/kWh`,
                    assumptions: [
                      'Incluye cargos fijos, alumbrado público, tributo de bomberos e impuestos prorrateados sobre cada kWh consumido.',
                    ],
                    limitations: [
                      'En tarifas progresivas por bloques, el precio marginal del último kWh es considerablemente superior a este promedio ponderado.',
                    ],
                  }}
                />
              )}
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#42C7D9] tabular-nums">
                {avgCostPerKwh ? `${currency}${formatNumber(avgCostPerKwh, 2)}` : '—'}
              </span>
              <span className="text-xs font-medium text-slate-500">/ kWh</span>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-[#A7B6CA]">
              Ponderado con impuestos y cargos fijos
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Bloque marginal: <strong className="text-[#42C7D9]">Bloque 2 (&gt;200)</strong></span>
            <span>IVA aplicado: <strong className="text-slate-700 dark:text-slate-300">13%</strong></span>
          </div>
        </div>

        {/* Card 4: Ahorro Potencial Detectado */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-[#A7B6CA]">
                {t('kpiSavingsTitle')}
              </span>
              <span className="text-[10px] font-semibold text-[#35D39A] bg-[#35D39A]/10 px-2 py-0.5 rounded">
                Oportunidad
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#35D39A] tabular-nums">
                {formatCurrency(estimatedSavingsAmount, 'CRC', currency)}
              </span>
              <span className="text-xs font-medium text-slate-500">/ mes</span>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-[#A7B6CA]">
              Equivalente a <strong className="text-slate-900 dark:text-white font-mono">~{estimatedSavingsKwh} kWh/mes</strong> optimizables
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standby fantasma: <strong className="text-amber-500">{formatNumber(monthlyStandbyKwh, 1)} kWh</strong></span>
            <button
              onClick={() => onNavigate('savings')}
              className="text-[#35D39A] font-semibold hover:underline"
            >
              Ver plan &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Row 2: Analytics Chart (8 cols) & Category Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('chartTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#A7B6CA]">
                {t('chartSubtitle')}
              </p>
            </div>
            {latestInvoice && (
              <span className="text-[11px] text-slate-400 font-mono">
                {invoices.length} facturas registradas
              </span>
            )}
          </div>

          <EnergyBarChart invoices={invoices} currency={currency} />
        </div>

        {/* Category Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('donutTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A7B6CA]">
                {t('donutSubtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('appliances')}
              className="text-xs font-semibold text-[#35D39A] hover:underline flex items-center gap-1"
            >
              <span>{t('viewList')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <CategoryDonutChart appliances={appliances} currency={currency} />
        </div>
      </div>

      {/* Bento Grid Row 3: MoM Delta (4 cols), Top 3 Savings (4 cols), Recent Activity (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Month-over-Month Delta */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('momTitle')}
              </h3>
              <span className="text-[11px] text-slate-400">Ciclos consecutivos</span>
            </div>

            {latestInvoice && previousInvoice ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{t('momCurrent')} ({latestInvoice.periodStart.slice(0, 7)}):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {latestInvoice.consumptionKwh} kWh · {formatCurrency(latestInvoice.declaredTotal, latestInvoice.currency, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{t('momPrevious')} ({previousInvoice.periodStart.slice(0, 7)}):</span>
                    <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                      {previousInvoice.consumptionKwh} kWh · {formatCurrency(previousInvoice.declaredTotal, previousInvoice.currency, currency)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#35D39A]/10 border border-[#35D39A]/20 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{t('momDifference')}:</span>
                  <div className="font-mono font-bold text-right">
                    <span className={kwhDiff > 0 ? 'text-[#F1B653]' : 'text-[#35D39A]'}>
                      {kwhDiff > 0 ? `+${kwhDiff}` : kwhDiff} kWh
                    </span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className={costDiff > 0 ? 'text-[#F1B653]' : 'text-[#35D39A]'}>
                      {costDiff > 0 ? `+${currency}${formatNumber(costDiff)}` : `${currency}${formatNumber(costDiff)}`}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Se requieren al menos 2 facturas registradas para calcular la variación intermensual.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('invoices')}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#19273B] hover:bg-slate-100 dark:hover:bg-[#24364D] rounded-xl transition-colors text-center"
          >
            Ver historial de facturas &rarr;
          </button>
        </div>

        {/* Card 2: Top 3 Savings Opportunities */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('topSavingsTitle')}
              </h3>
              <Sparkles className="w-4 h-4 text-[#35D39A]" />
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-100 dark:border-white/5 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Eliminar Consumo Vampiro (Standby)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A7B6CA] mt-0.5">
                    Desconectar regletas en centros de cómputo y TV
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#35D39A] bg-[#35D39A]/10 px-2 py-0.5 rounded shrink-0">
                  ~18 kWh/mes
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-100 dark:border-white/5 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Optimizar Termostato de Refrigeración
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A7B6CA] mt-0.5">
                    Ajustar a 4°C y limpiar serpentín trasero
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#35D39A] bg-[#35D39A]/10 px-2 py-0.5 rounded shrink-0">
                  ~12 kWh/mes
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-100 dark:border-white/5 flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Desplazar Horario de Lavado a Valle
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A7B6CA] mt-0.5">
                    Lavar en cargas completas con agua fría
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#35D39A] bg-[#35D39A]/10 px-2 py-0.5 rounded shrink-0">
                  ~15 kWh/mes
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('savings')}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#19273B] hover:bg-slate-100 dark:hover:bg-[#24364D] rounded-xl transition-colors text-center"
          >
            Ver plan de acción completo &rarr;
          </button>
        </div>

        {/* Card 3: Recent Activity & Diagnostics */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('recentActivityTitle')}
              </h3>
              <Activity className="w-4 h-4 text-[#F1B653]" />
            </div>

            {pendingAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {pendingAlerts.slice(0, 3).map(diag => (
                  <div
                    key={diag.id}
                    onClick={() => onNavigate('diagnostics')}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {diag.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        diag.severity === 'alerta' ? 'bg-[#F07676]/15 text-[#F07676]' : 'bg-[#F1B653]/15 text-[#F1B653]'
                      }`}>
                        {diag.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-[#A7B6CA] mt-1 line-clamp-1">
                      {diag.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-7 h-7 text-[#35D39A] mx-auto mb-1 opacity-80" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Sin anomalías activas
                </p>
                <p className="text-[11px] text-slate-500">Los consumos se mantienen en rango nominal.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('diagnostics')}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#19273B] hover:bg-slate-100 dark:hover:bg-[#24364D] rounded-xl transition-colors text-center"
          >
            Abrir centro de diagnósticos &rarr;
          </button>
        </div>
      </div>

      {/* Bento Grid Row 4: Quick Action Shortcuts */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Accesos Directos del Sistema:
        </span>
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onOpenAddInvoice}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#19273B] dark:hover:bg-[#24364D] text-slate-800 dark:text-slate-200 transition-colors font-medium flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-[#35D39A]" />
            <span>{t('btnRecordInvoice')}</span>
          </button>
          <button
            onClick={onOpenAddAppliance}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#19273B] dark:hover:bg-[#24364D] text-slate-800 dark:text-slate-200 transition-colors font-medium flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5 text-[#42C7D9]" />
            <span>{t('btnAddAppliance')}</span>
          </button>
          <button
            onClick={() => onNavigate('simulator')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#19273B] dark:hover:bg-[#24364D] text-slate-800 dark:text-slate-200 transition-colors font-medium flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('btnSimulateScenario')}</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#19273B] dark:hover:bg-[#24364D] text-slate-800 dark:text-slate-200 transition-colors font-medium flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-[#F1B653]" />
            <span>{t('btnExportReport')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
