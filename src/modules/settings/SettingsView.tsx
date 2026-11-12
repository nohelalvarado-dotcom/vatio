import React, { useState } from 'react';
import {
  Settings,
  Home,
  Moon,
  Sun,
  Laptop,
  Globe2,
  Bell,
  ShieldAlert,
  Smartphone,
  Trash2,
  Sparkles,
  Save,
  Check,
  Eye,
  Sliders,
  Info,
  Lock,
  User,
  Globe,
} from 'lucide-react';
import { Household } from '../../types/household';
import { Tariff } from '../../types/tariff';
import { UserAccount } from '../../types/account';
import { useI18n } from '../../i18n/I18nContext';
import { LanguageCode } from '../../i18n/types';

interface SettingsViewProps {
  household: Household | null;
  tariffs: Tariff[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateHousehold: (household: Household) => void;
  onResetAllData: () => Promise<void>;
  onSeedSampleData: () => Promise<void>;
  userAccount?: UserAccount | null;
  onOpenAccountModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  household,
  tariffs,
  darkMode,
  onToggleDarkMode,
  onUpdateHousehold,
  onResetAllData,
  onSeedSampleData,
  userAccount,
  onOpenAccountModal,
}) => {
  const { t, language, setLanguage, supportedLanguages } = useI18n();
  const [activeTab, setActiveTab] = useState<
    'account' | 'appearance' | 'language' | 'installation' | 'notifications' | 'privacy' | 'accessibility' | 'about'
  >('account');

  // Installation form
  const [name, setName] = useState(household?.name || 'Mi Hogar');
  const [distributor, setDistributor] = useState(household?.distributor || 'ICE');
  const [occupants, setOccupants] = useState(household?.occupants || 3);
  const [areaSquareMeters, setAreaSquareMeters] = useState(household?.areaSquareMeters || 110);
  const [voltage, setVoltage] = useState(household?.voltageSystem || '120/240V');
  const [savedMsg, setSavedMsg] = useState(false);

  // Appearance & Accessibility preferences
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  // Notification preferences
  const [notifyHighConsumption, setNotifyHighConsumption] = useState(true);
  const [notifyInvoiceReminder, setNotifyInvoiceReminder] = useState(true);
  const [notifyVampireLoads, setNotifyVampireLoads] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!household) return;

    const updated: Household = {
      ...household,
      name: name.trim() || 'Mi Hogar',
      distributor,
      occupants,
      areaSquareMeters,
      voltageSystem: voltage as any,
      updatedAt: new Date().toISOString(),
    };

    onUpdateHousehold(updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#35D39A]" />
          <span>{t('settingsTitle')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-[#A7B6CA] mt-1">
          {t('settingsSubtitle')}
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-[#35D39A]/15 text-[#35D39A] border border-[#35D39A]/30 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Configuración guardada exitosamente en la base de datos local.</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#141F32] rounded-xl border border-slate-200 dark:border-white/10 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('account')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'account'
              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Cuenta & Google</span>
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-[#19273B] text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabAppearance')}
        </button>
        <button
          onClick={() => setActiveTab('language')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'language'
              ? 'bg-white dark:bg-[#19273B] text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabLanguageRegion')}
        </button>
        <button
          onClick={() => setActiveTab('installation')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'installation'
              ? 'bg-white dark:bg-[#19273B] text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabInstallation')}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-[#19273B] text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabNotifications')}
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-[#19273B] text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabPrivacy')}
        </button>
        <button
          onClick={() => setActiveTab('accessibility')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'accessibility'
              ? 'bg-white dark:bg-[#19273B] text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabAccessibility')}
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-white dark:bg-[#19273B] text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-[#A7B6CA] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('tabAbout')}
        </button>
      </div>

      {/* Tab 0: User Account & Google Hub */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/40 shadow-xs shrink-0">
                  <img src="/vatio-logo.png" alt="VATIO Logo" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {userAccount?.name || 'Usuario VATIO'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Cuenta Activa
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-[#A7B6CA] mt-0.5">
                    {userAccount?.email || 'Sin correo configurado'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Distribuidora: <strong className="text-slate-700 dark:text-slate-200">{userAccount?.distributor || household?.distributor || 'ICE'}</strong> · NIS: <strong className="text-slate-700 dark:text-slate-200">{userAccount?.meterNumber || 'NIS-849201'}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAccountModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Gestionar Cuenta & Google</span>
              </button>
            </div>

            {/* Google Services Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">Google Drive</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {userAccount?.google.connected ? '● Sincronizado' : 'Disponible'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Respaldos JSON en carpeta <span className="font-mono text-slate-300">VATIO_Energia_Respaldos</span>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">Google Sheets</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {userAccount?.google.connected ? '● Conectado' : 'Disponible'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Exportación instantánea de matriz de facturas y bloques tarifarios.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-[11px]">Google Calendar</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {userAccount?.google.connected ? '● Recordatorios' : 'Disponible'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Alertas de lectura de medidor y fechas de vencimiento de recibos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Appearance */}
      {activeTab === 'appearance' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Tema y Modo Visual
            </h3>
            <p className="text-slate-500 dark:text-[#A7B6CA] mt-0.5">
              Elige entre el tema oscuro de alta ingeniería o el tema claro refinado.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!darkMode) onToggleDarkMode();
              }}
              className={`p-4 rounded-xl border flex-1 text-center transition-all ${
                darkMode
                  ? 'border-[#35D39A] bg-[#35D39A]/10 text-white font-semibold'
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-2 text-[#35D39A]" />
              <span>Modo Oscuro (Deep Tech)</span>
            </button>

            <button
              onClick={() => {
                if (darkMode) onToggleDarkMode();
              }}
              className={`p-4 rounded-xl border flex-1 text-center transition-all ${
                !darkMode
                  ? 'border-emerald-600 bg-emerald-500/10 text-slate-900 font-semibold'
                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-2 text-amber-500" />
              <span>Modo Claro (Refined Light)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Densidad de Interfaz
                </span>
                <span className="text-slate-500">Ajusta el espaciado en tablas y cuadrículas</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#19273B] p-1 rounded-lg">
                <button
                  onClick={() => setDensity('comfortable')}
                  className={`px-3 py-1 rounded-md ${
                    density === 'comfortable' ? 'bg-white dark:bg-[#24364D] text-slate-900 dark:text-white font-medium shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Confortable
                </button>
                <button
                  onClick={() => setDensity('compact')}
                  className={`px-3 py-1 rounded-md ${
                    density === 'compact' ? 'bg-white dark:bg-[#24364D] text-slate-900 dark:text-white font-medium shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Compacta
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Animaciones y Transiciones Suaves
                </span>
                <span className="text-slate-500">Transiciones fluidas de 150ms en modales y gráficos</span>
              </div>
              <input
                type="checkbox"
                checked={animationsEnabled}
                onChange={e => setAnimationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#35D39A] focus:ring-[#35D39A]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Language & Region */}
      {activeTab === 'language' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('tabLanguageRegion')}
            </h3>
            <p className="text-slate-500 dark:text-[#A7B6CA] mt-0.5">
              15 idiomas admitidos con soporte nativo de derecha a izquierda (RTL) para árabe.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {supportedLanguages.map(l => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  language === l.code
                    ? 'border-[#35D39A] bg-[#35D39A]/10 text-slate-900 dark:text-white font-semibold'
                    : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{l.flag}</span>
                  <div>
                    <span className="block text-xs">{l.nativeName}</span>
                    <span className="block text-[10px] text-slate-400">{l.name}</span>
                  </div>
                </div>
                {language === l.code && <Check className="w-4 h-4 text-[#35D39A]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Installation */}
      {activeTab === 'installation' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-4 h-4 text-[#35D39A]" />
            <span>Perfil Técnico de la Instalación</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la vivienda o instalación
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Distribuidora eléctrica principal
                </label>
                <input
                  type="text"
                  value={distributor}
                  onChange={e => setDistributor(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Voltaje de suministro
                </label>
                <select
                  value={voltage}
                  onChange={e => setVoltage(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] text-slate-900 dark:text-white font-medium"
                >
                  <option value="120V">120V Monofásico</option>
                  <option value="120/240V">120/240V Bifásico Residencial</option>
                  <option value="240V">240V Trifásico</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de ocupantes
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={occupants}
                  onChange={e => setOccupants(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Área techada (m²)
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={areaSquareMeters}
                  onChange={e => setAreaSquareMeters(parseInt(e.target.value) || 50)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#19273B] text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#35D39A] hover:bg-[#45e3aa] text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('save')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#35D39A]" />
              <span>Preferencias de Alertas y Notificaciones Locales</span>
            </h3>
            <p className="text-slate-500 dark:text-[#A7B6CA] mt-0.5">
              Las alertas son procesadas 100% en tu navegador y no envían datos a servidores externos.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#19273B]">
              <div>
                <span className="font-semibold text-slate-800 dark:text-white block">
                  Alerta de Sobrecosto y Desviación Estadística
                </span>
                <span className="text-slate-500">Avisa si el consumo mensual supera el 15% del promedio histórico</span>
              </div>
              <input
                type="checkbox"
                checked={notifyHighConsumption}
                onChange={e => setNotifyHighConsumption(e.target.checked)}
                className="w-4 h-4 rounded text-[#35D39A]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#19273B]">
              <div>
                <span className="font-semibold text-slate-800 dark:text-white block">
                  Detección de Cargas Vampiro (Standby)
                </span>
                <span className="text-slate-500">Notifica cuando el consumo fantasma supera el 10% del total</span>
              </div>
              <input
                type="checkbox"
                checked={notifyVampireLoads}
                onChange={e => setNotifyVampireLoads(e.target.checked)}
                className="w-4 h-4 rounded text-[#35D39A]"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#19273B]">
              <div>
                <span className="font-semibold text-slate-800 dark:text-white block">
                  Recordatorio de Registro de Facturas
                </span>
                <span className="text-slate-500">Recordatorio mensual para mantener tu curva histórica al día</span>
              </div>
              <input
                type="checkbox"
                checked={notifyInvoiceReminder}
                onChange={e => setNotifyInvoiceReminder(e.target.checked)}
                className="w-4 h-4 rounded text-[#35D39A]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Privacy & Data */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-4 text-xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#35D39A]" />
                <span>Soberanía de Datos y Almacenamiento Local</span>
              </h3>
              <p className="text-slate-500 dark:text-[#A7B6CA] mt-0.5">
                Toda la información energética está almacenada exclusivamente en IndexedDB dentro de tu navegador.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
              <span className="font-bold block">100% Privado y Autónomo</span>
              <p>
                VATIO no transfiere lecturas, números de factura ni inventario de aparatos a ningún servidor externo.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-white block">
                    Cargar Datos de Demostración Reales
                  </span>
                  <span className="text-slate-500">
                    Carga facturas, inventario de aparatos y planes de ahorro de prueba para Costa Rica.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onSeedSampleData}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-[#19273B] font-semibold text-slate-800 dark:text-slate-200"
                >
                  Cargar Datos de Prueba
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                <div>
                  <span className="font-semibold text-red-600 block">
                    Restablecimiento de Fábrica (Eliminar Todo)
                  </span>
                  <span className="text-slate-500">
                    Borra todas las facturas, aparatos, tarifas personalizadas y registros locales.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onResetAllData}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition"
                >
                  Restablecer Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Accessibility */}
      {activeTab === 'accessibility' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#35D39A]" />
              <span>Accesibilidad Visual y Ergonomía</span>
            </h3>
            <p className="text-slate-500 dark:text-[#A7B6CA] mt-0.5">
              Cumplimiento con directrices WCAG AA para contraste, lectura y tipografía tabular.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#19273B]">
              <div>
                <span className="font-semibold text-slate-800 dark:text-white block">
                  Números Tabulares Obligatorios (tabular-nums)
                </span>
                <span className="text-slate-500">Alineación vertical fija de cifras numéricas y decimales en tablas y cálculos</span>
              </div>
              <span className="text-[#35D39A] font-semibold">Activado</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#19273B]">
              <div>
                <span className="font-semibold text-slate-800 dark:text-white block">
                  Modo de Alto Contraste Óptico
                </span>
                <span className="text-slate-500">Refuerza el grosor y separación de texto en modo oscuro</span>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={e => setHighContrast(e.target.checked)}
                className="w-4 h-4 rounded text-[#35D39A]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: About VATIO */}
      {activeTab === 'about' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141F32] border border-slate-200 dark:border-white/10 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 shadow-xs shrink-0">
              <img src="/vatio-logo.png" alt="VATIO Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                VATIO — Energy Intelligence Platform
              </h3>
              <p className="text-slate-500 dark:text-[#A7B6CA]">
                Versión 2.0 (Prompt Maestro 02)
              </p>
            </div>
          </div>

          <p className="text-slate-600 dark:text-[#A7B6CA] leading-relaxed">
            VATIO es una plataforma independiente de ingeniería energética diseñada para comprender, auditar y optimizar el consumo de electricidad residencial y comercial. Integra modelos matemáticos rigurosos de tarifas progresivas escalonadas, cálculo de consumo fantasma, algoritmos de detección de anomalías y respaldo local cifrado con AES-GCM.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10">
              <span className="text-slate-400 block text-[10px]">Arquitectura</span>
              <span className="font-bold text-slate-900 dark:text-white">100% Offline PWA</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10">
              <span className="text-slate-400 block text-[10px]">Cifrado</span>
              <span className="font-bold text-[#35D39A]">Web Crypto AES-GCM</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#19273B] border border-slate-200 dark:border-white/10">
              <span className="text-slate-400 block text-[10px]">Idiomas</span>
              <span className="font-bold text-[#42C7D9]">15 con soporte RTL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
