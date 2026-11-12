import React, { useState } from 'react';
import { Home, Plus, Check, X, Building, Zap, Edit2 } from 'lucide-react';
import { Household } from '../../types/household';
import { Tariff } from '../../types/tariff';
import { useI18n } from '../../i18n/I18nContext';

interface InstallationModalProps {
  isOpen: boolean;
  onClose: () => void;
  households: Household[];
  activeHouseholdId: string;
  onSelectHousehold: (id: string) => void;
  onSaveHousehold: (household: Household) => void;
  tariffs: Tariff[];
}

export function InstallationModal({
  isOpen,
  onClose,
  households,
  activeHouseholdId,
  onSelectHousehold,
  onSaveHousehold,
  tariffs,
}: InstallationModalProps) {
  const { t } = useI18n();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [distributor, setDistributor] = useState('ICE');
  const [tariffId, setTariffId] = useState(tariffs[0]?.id || 'tariff-cr-ice-tre-2024');
  const [voltage, setVoltage] = useState<'120V' | '240V' | '120/240V'>('120/240V');
  const [currency, setCurrency] = useState('CRC');
  const [currencySymbol, setCurrencySymbol] = useState('₡');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newHh: Household = {
      id: `household-${Date.now()}`,
      name: name.trim(),
      country: 'Costa Rica',
      currency,
      currencySymbol,
      currencyDecimals: currency === 'CRC' ? 0 : 2,
      distributor,
      defaultTariffId: tariffId,
      voltageSystem: voltage,
      timezone: 'America/Costa_Rica',
      installationType: 'home',
      usageCategory: 'residential',
      address: address.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveHousehold(newHh);
    onSelectHousehold(newHh.id);
    setIsCreating(false);
    setName('');
    setAddress('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#35D39A]/15 text-[#35D39A] flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t('manageInstallations')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#A7B6CA]">
              Gestiona múltiples medidores y ubicaciones
            </p>
          </div>
        </div>

        {!isCreating ? (
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {households.map(hh => {
                const isActive = hh.id === activeHouseholdId;
                return (
                  <div
                    key={hh.id}
                    onClick={() => {
                      onSelectHousehold(hh.id);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isActive
                        ? 'border-[#35D39A] bg-[#35D39A]/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-[#19273B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-[#35D39A] text-slate-950 font-bold'
                            : 'bg-slate-200 dark:bg-[#0B1220] text-slate-500'
                        }`}
                      >
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                          {hh.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-[#A7B6CA]">
                          {hh.distributor} · {hh.voltageSystem} · {hh.currencySymbol}
                        </p>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-[#35D39A]" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-white/20 hover:border-[#35D39A] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#35D39A] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addInstallation')}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la instalación *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Casa de Playa, Taller, Local 2..."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Distribuidora
                </label>
                <input
                  type="text"
                  value={distributor}
                  onChange={e => setDistributor(e.target.value)}
                  placeholder="ICE, CNFL, ESPH, CFE..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Voltaje
                </label>
                <select
                  value={voltage}
                  onChange={e => setVoltage(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
                >
                  <option value="120V">120V Monofásico</option>
                  <option value="120/240V">120/240V Bifásico</option>
                  <option value="240V">240V Trifásico</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Moneda Código
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value.toUpperCase())}
                  placeholder="CRC, USD, EUR..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Símbolo
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={e => setCurrencySymbol(e.target.value)}
                  placeholder="₡, $, €..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#35D39A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-white"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-[#35D39A] hover:bg-[#45e3aa] rounded-lg transition-all shadow-xs"
              >
                {t('save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
