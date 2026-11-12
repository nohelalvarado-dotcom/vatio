import React, { useState } from 'react';
import {
  Calculator,
  BookOpen,
  HelpCircle,
  ArrowRightLeft,
  Sparkles,
  Info,
  Check,
  Copy,
} from 'lucide-react';
import { ENERGY_GLOSSARY, GlossaryItem } from '../../database/seed';
import {
  calculateEnergyKwhFromPower,
  calculateHoursFromEnergyAndPower,
  calculatePowerWattsFromEnergy,
  kilowattsToWatts,
  kilowattHoursToWattHours,
  wattsToKilowatts,
  wattHoursToKilowattHours,
} from '../../core/units/unit-converter';

interface ToolsViewProps {
  currencySymbol: string;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ currencySymbol }) => {
  const [tab, setTab] = useState<'calculator' | 'glossary' | 'help'>('calculator');

  // Tool 1: Energy from Power & Time
  const [p1Watts, setP1Watts] = useState('1500');
  const [p1Hours, setP1Hours] = useState('3');
  const [p1Price, setP1Price] = useState('95');

  const p1Energy = calculateEnergyKwhFromPower(parseFloat(p1Watts) || 0, parseFloat(p1Hours) || 0);
  const p1CostDay = Math.round(p1Energy * (parseFloat(p1Price) || 0) * 100) / 100;
  const p1CostMonth = Math.round(p1CostDay * 30);

  // Tool 2: Power from Energy & Time
  const [p2Kwh, setP2Kwh] = useState('4.5');
  const [p2Hours, setP2Hours] = useState('3');
  const p2Watts = parseFloat(p2Hours) > 0 ? calculatePowerWattsFromEnergy(parseFloat(p2Kwh) || 0, parseFloat(p2Hours) || 1) : 0;

  // Tool 3: Time from Energy & Power
  const [p3Kwh, setP3Kwh] = useState('10');
  const [p3Watts, setP3Watts] = useState('2000');
  const p3Hours = parseFloat(p3Watts) > 0 ? calculateHoursFromEnergyAndPower(parseFloat(p3Kwh) || 0, parseFloat(p3Watts) || 1) : 0;

  // Unit Converter Quick Box
  const [convVal, setConvVal] = useState('1500');
  const [convType, setConvType] = useState<'w_to_kw' | 'kw_to_w' | 'wh_to_kwh' | 'kwh_to_wh'>('w_to_kw');
  const convNum = parseFloat(convVal) || 0;
  let convResult = 0;
  let convUnitFrom = '';
  let convUnitTo = '';

  if (convType === 'w_to_kw') {
    convResult = wattsToKilowatts(convNum);
    convUnitFrom = 'W';
    convUnitTo = 'kW';
  } else if (convType === 'kw_to_w') {
    convResult = kilowattsToWatts(convNum);
    convUnitFrom = 'kW';
    convUnitTo = 'W';
  } else if (convType === 'wh_to_kwh') {
    convResult = wattHoursToKilowattHours(convNum);
    convUnitFrom = 'Wh';
    convUnitTo = 'kWh';
  } else {
    convResult = kilowattHoursToWattHours(convNum);
    convUnitFrom = 'kWh';
    convUnitTo = 'Wh';
  }

  // Glossary search & filter
  const [glossarySearch, setGlossarySearch] = useState('');
  const filteredGlossary = ENERGY_GLOSSARY.filter(item =>
    item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    item.definitionSimple.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-500" />
          <span>Herramientas, Fórmulas y Glosario</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Calculadoras de física eléctrica, conversor de unidades dimensionales y centro educativo de energía.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('calculator')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'calculator'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculadora Eléctrica y Conversores</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('glossary')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'glossary'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Glosario Didáctico ({ENERGY_GLOSSARY.length} conceptos)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('help')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'help'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Centro de Ayuda y Preguntas Frecuentes</span>
        </button>
      </div>

      {/* Tab 1: Calculator */}
      {tab === 'calculator' && (
        <div className="space-y-6">
          {/* Quick Unit Converter Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-500" />
              <span>Conversor Rápido de Unidades Energéticas</span>
            </span>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <input
                type="number"
                value={convVal}
                onChange={(e) => setConvVal(e.target.value)}
                className="w-32 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-sm font-bold"
              />

              <select
                value={convType}
                onChange={(e) => setConvType(e.target.value as any)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="w_to_kw">Vatios (W) → Kilovatios (kW)</option>
                <option value="kw_to_w">Kilovatios (kW) → Vatios (W)</option>
                <option value="wh_to_kwh">Vatios-hora (Wh) → Kilovatios-hora (kWh)</option>
                <option value="kwh_to_wh">Kilovatios-hora (kWh) → Vatios-hora (Wh)</option>
              </select>

              <span className="text-slate-400 font-bold">=</span>

              <div className="p-2 px-4 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-sm font-black">
                {convResult} {convUnitTo}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Calculator 1: E = P * t */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    E = (P × t) / 1000
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    Energía y Costo por Potencia y Tiempo
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Potencia eléctrica (W)</label>
                    <input
                      type="number"
                      value={p1Watts}
                      onChange={(e) => setP1Watts(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Horas de uso diario</label>
                    <input
                      type="number"
                      value={p1Hours}
                      onChange={(e) => setP1Hours(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Precio por kWh ({currencySymbol})</label>
                    <input
                      type="number"
                      value={p1Price}
                      onChange={(e) => setP1Price(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Energía consumida:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{p1Energy} kWh/día</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Costo diario:</span>
                  <strong className="text-slate-900 dark:text-white">{currencySymbol} {p1CostDay}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1">
                  <span className="text-slate-400">Costo mensual (30d):</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{currencySymbol} {p1CostMonth}</strong>
                </div>
              </div>
            </div>

            {/* Calculator 2: P = E / t */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                    P = (E × 1000) / t
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    Calcular Potencia desde Consumo y Tiempo
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Energía consumida (kWh)</label>
                    <input
                      type="number"
                      value={p2Kwh}
                      onChange={(e) => setP2Kwh(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Horas transcurridas</label>
                    <input
                      type="number"
                      value={p2Hours}
                      onChange={(e) => setP2Hours(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
                <span className="text-slate-400 block text-[10px]">Potencia media equivalente:</span>
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 block mt-0.5">
                  {p2Watts} W
                </span>
                <span className="text-[10px] text-slate-400">({(p2Watts / 1000).toFixed(2)} kW)</span>
              </div>
            </div>

            {/* Calculator 3: t = E / P */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                    t = (E × 1000) / P
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    Tiempo de Operación por Energía y Potencia
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-500 block mb-1">Presupuesto de Energía (kWh)</label>
                    <input
                      type="number"
                      value={p3Kwh}
                      onChange={(e) => setP3Kwh(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Potencia del equipo (W)</label>
                    <input
                      type="number"
                      value={p3Watts}
                      onChange={(e) => setP3Watts(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs">
                <span className="text-slate-400 block text-[10px]">Tiempo máximo de funcionamiento:</span>
                <span className="text-2xl font-black text-amber-500 block mt-0.5">
                  {p3Hours} horas
                </span>
                <span className="text-[10px] text-slate-400">({(p3Hours * 60).toFixed(0)} minutos de uso)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Glossary */}
      {tab === 'glossary' && (
        <div className="space-y-4">
          <input
            type="text"
            value={glossarySearch}
            onChange={(e) => setGlossarySearch(e.target.value)}
            placeholder="Buscar término (p. ej. Potencia, Kilovatio-hora, Vampiro, Tarifa)..."
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C2C] text-xs font-medium"
          />

          <div className="space-y-4">
            {filteredGlossary.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {item.term}
                    </h3>
                    {item.symbol && (
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400">
                        {item.symbol}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Unidad: {item.unit}
                  </span>
                </div>

                <div className="text-xs space-y-2">
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {item.definitionSimple}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                    <strong className="text-slate-700 dark:text-slate-300">Definición técnica:</strong> {item.definitionTechnical}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  {item.formula && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">
                        Fórmula:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.formula}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Ejemplo numérico:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">{item.numericalExample}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Consejo práctico:</strong> {item.practicalTip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Help & FAQ */}
      {tab === 'help' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 text-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Centro de Ayuda y Preguntas Frecuentes
          </h2>

          <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                ¿Cómo audita VATIO mis facturas?
              </h3>
              <p>
                VATIO suma aritméticamente cada concepto (energía, cargos fijos, alumbrado, impuestos) y contrasta el total con el monto declarado. Además, resta la lectura actual de la lectura anterior para verificar que el consumo facturado sea exactamente congruente con el medidor.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                ¿Por qué hay diferencia entre mis aparatos y la factura?
              </h3>
              <p>
                El inventario de aparatos se basa en potencias nominales y horas estimadas declaradas. En el uso diario, la temperatura ambiente, las pérdidas eléctricas en cables y los pequeños consumos no registrados (cargadores, focos secundarios) generan variaciones naturales.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                ¿Mis facturas y fotos se envían a algún servidor?
              </h3>
              <p>
                No. VATIO aplica privacidad desde el diseño: todos los datos se almacenan exclusivamente en la base de datos IndexedDB local de tu navegador o dispositivo. Nada se transmite a la nube sin tu expresa exportación.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
