import React, { useState } from 'react';
import { Zap, MapPin, Home, FileText, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Household } from '../../types/household';
import { Tariff } from '../../types/tariff';
import { db } from '../../database/db';
import { STORES } from '../../database/schema';

interface OnboardingWizardProps {
  onComplete: (household: Household) => void;
  availableTariffs: Tariff[];
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  availableTariffs,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form state initialized for Costa Rica (primary market)
  const [name, setName] = useState('Mi Hogar');
  const [country, setCountry] = useState('Costa Rica');
  const [region, setRegion] = useState('San José');
  const [city, setCity] = useState('San José');
  const [distributor, setDistributor] = useState('ICE');
  const [currency, setCurrency] = useState('CRC');
  const [currencySymbol, setCurrencySymbol] = useState('₡');
  const [installationType, setInstallationType] = useState<Household['installationType']>('home');
  const [occupants, setOccupants] = useState<number>(3);
  const [areaSquareMeters, setAreaSquareMeters] = useState<number>(110);
  const [selectedTariffId, setSelectedTariffId] = useState(
    availableTariffs[0]?.id || 'tariff-cr-ice-tre-2024'
  );

  const distributorsByCountry: Record<string, string[]> = {
    'Costa Rica': ['ICE', 'CNFL', 'ESPH', 'JASEC', 'COOPELESCA', 'COOPEGUANACASTE', 'COOPESANTOS', 'Otra / Personalizada'],
    'México': ['CFE', 'Otra / Personalizada'],
    'Colombia': ['Enel Colombia', 'EPM', 'Celsia', 'Otra / Personalizada'],
    'España': ['Endesa', 'Iberdrola', 'Naturgy', 'PVPC', 'Otra / Personalizada'],
    'Estados Unidos': ['PG&E', 'FPL', 'ConEdison', 'Otra / Personalizada'],
  };

  const handleFinish = async () => {
    const newHousehold: Household = {
      id: 'household-primary',
      name: name || 'Mi Instalación',
      country,
      region,
      city,
      distributor,
      currency,
      currencySymbol,
      currencyDecimals: currency === 'CRC' ? 0 : 2,
      timezone: country === 'Costa Rica' ? 'America/Costa_Rica' : 'UTC',
      installationType,
      occupants,
      areaSquareMeters,
      usageCategory: 'residential',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.put(STORES.HOUSEHOLDS, newHousehold);
    await db.put(STORES.APP_SETTINGS, { key: 'onboarding_completed', value: true });
    onComplete(newHousehold);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100">
        
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              {step}/5
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Configuración Inicial
            </span>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`w-6 h-1.5 rounded-full transition-colors ${
                  step >= i ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Screen 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-xl border border-emerald-500/40 bg-slate-950">
              <img src="/vatio-logo.png" alt="VATIO Logo" className="w-full h-full object-cover" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Conoce mejor tu consumo eléctrico
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                VATIO transforma tus facturas y tus hábitos de consumo en información útil para tomar mejores decisiones.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-left text-slate-600 dark:text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                🔒 Principios de Privacidad y Rigor:
              </p>
              <p>• Todos tus datos y facturas permanecen 100% locales en tu dispositivo.</p>
              <p>• Cálculos basados en física eléctrica y tarifas oficiales, sin estimaciones opacas.</p>
              <p>• Funciona sin conexión a Internet.</p>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Comenzar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Screen 2: Location & Currency */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Ubicación Energética
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configura tu país y empresa distribuidora para aplicar la estructura tarifaria adecuada.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la instalación o vivienda
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="Mi Hogar / Casa / Apartamento"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    País
                  </label>
                  <select
                    value={country}
                    onChange={(e) => {
                      const c = e.target.value;
                      setCountry(c);
                      if (c === 'Costa Rica') {
                        setCurrency('CRC');
                        setCurrencySymbol('₡');
                        setDistributor('ICE');
                      } else {
                        setCurrency('USD');
                        setCurrencySymbol('$');
                        setDistributor('Otra / Personalizada');
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="México">México</option>
                    <option value="Colombia">Colombia</option>
                    <option value="España">España</option>
                    <option value="Estados Unidos">Estados Unidos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Empresa Distribuidora
                  </label>
                  <select
                    value={distributor}
                    onChange={(e) => setDistributor(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    {(distributorsByCountry[country] || ['General / Otra']).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Provincia / Región
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Moneda y Símbolo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-2/3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                    />
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-1/3 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-1.5"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: Installation Type */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <Home className="w-5 h-5" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tipo de Instalación
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Los datos opcionales ayudan a contextualizar los indicadores de intensidad energética (kWh/persona y kWh/m²).
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'home', label: 'Vivienda Familiar' },
                { id: 'apartment', label: 'Apartamento' },
                { id: 'detached_house', label: 'Casa Independiente' },
                { id: 'small_business', label: 'Comercio Pequeño' },
                { id: 'office', label: 'Oficina' },
                { id: 'other', label: 'Otro' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setInstallationType(type.id as any)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                    installationType === type.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de ocupantes (opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={occupants}
                  onChange={(e) => setOccupants(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Área aproximada (m², opcional)
                </label>
                <input
                  type="number"
                  min="10"
                  value={areaSquareMeters}
                  onChange={(e) => setAreaSquareMeters(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-1.5"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Screen 4: Tariff Selection */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Información Tarifaria
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona la tarifa de referencia para comprobar facturas y calcular el costo de tus aparatos.
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {availableTariffs.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTariffId(t.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedTariffId === t.id
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {t.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {t.distributor} • {t.country} • {t.calculationMethod === 'tiered_marginal' ? 'Bloques Progresivos Marginales' : 'Tarifa Plana'}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {t.validationStatus === 'verified_official' ? 'Oficial ARESEP' : 'Estimada'}
                    </span>
                  </div>
                  {t.notes && (
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                      {t.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-1.5"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Screen 5: Finalization */}
        {step === 5 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Tu espacio energético está listo
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Has configurado <strong className="text-slate-900 dark:text-white">{name}</strong> ({country}, distribuidora {distributor}).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-left text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Siguientes pasos recomendados:
              </p>
              <p>1. Registra tu última factura para auditar los cobros y lecturas.</p>
              <p>2. Agrega los aparatos principales de tu hogar para conocer el desglose de consumo.</p>
              <p>3. Experimenta en el Laboratorio para simular escenarios de ahorro.</p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Entrar a VATIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
