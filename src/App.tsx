import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { OnboardingWizard } from './modules/onboarding/OnboardingWizard';
import { DashboardView } from './modules/dashboard/DashboardView';
import { InvoicesView } from './modules/invoices/InvoicesView';
import { InvoiceFormModal } from './modules/invoices/InvoiceFormModal';
import { AppliancesView } from './modules/appliances/AppliancesView';
import { ApplianceFormModal } from './modules/appliances/ApplianceFormModal';
import { SimulatorView } from './modules/simulator/SimulatorView';
import { DiagnosticsView } from './modules/diagnostics/DiagnosticsView';
import { SavingsPlanView } from './modules/savings/SavingsPlanView';
import { TariffsView } from './modules/tariffs/TariffsView';
import { ToolsView } from './modules/tools/ToolsView';
import { ReportsView } from './modules/reports/ReportsView';
import { SettingsView } from './modules/settings/SettingsView';
import { AtlasView } from './modules/atlas/AtlasView';

import { GlobalSearchModal } from './components/ui/GlobalSearchModal';
import { NotificationsDrawer } from './components/ui/NotificationsDrawer';
import { GoogleTranslateModal } from './components/ui/GoogleTranslateModal';
import { InstallationModal } from './components/ui/InstallationModal';

import { db } from './database/db';
import { STORES } from './database/schema';
import { Household } from './types/household';
import { Invoice } from './types/invoice';
import { Appliance } from './types/appliance';
import { Tariff } from './types/tariff';
import { Scenario } from './types/scenario';
import { DiagnosticItem } from './types/diagnostic';
import { EnergyInvestment, SavingsActionItem } from './types/savings';
import { AnalyticsSnapshot } from './types/atlas';
import { UserAccount, DEFAULT_USER_ACCOUNT } from './types/account';
import { UserAccountModal } from './components/account/UserAccountModal';
import { DEFAULT_TARIffS } from './core/tariff-engine/default-tariffs';
import { runEnergyDiagnostics } from './core/diagnostics/anomaly-detector';
import {
  SAMPLE_INVOICES,
  SAMPLE_APPLIANCES,
  SAMPLE_SAVINGS_ACTIONS,
} from './database/sample-data';
import { INITIAL_HOUSEHOLD_CR } from './database/seed';
import { useI18n } from './i18n/I18nContext';
import {
  detectPlatform,
  isInPhoneFrame,
  getPreviewMode,
  setPreviewMode,
  PreviewMode,
} from './core/platform/platform';

export function App() {
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string>('household-primary');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>(DEFAULT_TARIffS);
  const [activeTariffId, setActiveTariffId] = useState<string>('tariff-cr-ice-tre-2024');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [savingsActions, setSavingsActions] = useState<SavingsActionItem[]>([]);
  const [investments, setInvestments] = useState<EnergyInvestment[]>([]);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Quick action and global tool modals
  const [isQuickAddInvoiceOpen, setIsQuickAddInvoiceOpen] = useState(false);
  const [isQuickAddApplianceOpen, setIsQuickAddApplianceOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Plataforma: 'native' (app Play Store) | 'web' (navegador)
  const platform = detectPlatform();
  const insideFrame = isInPhoneFrame();
  const [previewMode, setPreviewModeState] = useState<PreviewMode>(() => getPreviewMode());

  // Modo efectivo: dentro del iframe SIEMPRE es móvil real
  // (el iframe mide 390px ⇒ los breakpoints md:/lg: funcionan como en un teléfono).
  const forceMobile = platform === 'native' || insideFrame;

  // Clase de modo en <html>:
  //  - native/iframe → solo interfaz móvil
  //  - web desktop   → solo interfaz de escritorio
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('mode-native-phone', 'mode-web-phone', 'mode-web-desktop');
    root.classList.add(forceMobile ? 'mode-native-phone' : 'mode-web-desktop');
  }, [forceMobile]);

  // 3-state Theme mode: 'dark' | 'light' | 'auto'
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'auto'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vatio_theme_mode') as 'dark' | 'light' | 'auto' | null;
      if (saved) return saved;
    }
    return 'dark';
  });

  // Apply theme class to <html> based on themeMode
  useEffect(() => {
    const applyTheme = () => {
      let isDark = true;
      if (themeMode === 'light') isDark = false;
      else if (themeMode === 'dark') isDark = true;
      else if (themeMode === 'auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('vatio_theme_mode', themeMode);
    };

    applyTheme();

    if (themeMode === 'auto') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Global keyboard listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load all data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const urlParams = new URLSearchParams(window.location.search);
      const isAutoStart = urlParams.get('autostart') === '1';

      // 1. Tariffs
      const loadedTariffs = await db.getAll<Tariff>(STORES.TARIFFS);
      const allTariffs = loadedTariffs.length > 0 ? loadedTariffs : DEFAULT_TARIffS;
      setTariffs(allTariffs);

      // 2. Households & Demo Seeding on autostart
      const loadedHouseholds = await db.getAll<Household>(STORES.HOUSEHOLDS);
      let activeHhId = activeHouseholdId;

      if (loadedHouseholds.length === 0) {
        if (isAutoStart) {
          await db.put(STORES.HOUSEHOLDS, INITIAL_HOUSEHOLD_CR);
          for (const inv of SAMPLE_INVOICES) {
            await db.put(STORES.INVOICES, inv);
          }
          for (const app of SAMPLE_APPLIANCES) {
            await db.put(STORES.APPLIANCES, app);
          }
          for (const act of SAMPLE_SAVINGS_ACTIONS) {
            await db.put(STORES.SAVINGS_ACTIONS, act);
          }
          setHouseholds([INITIAL_HOUSEHOLD_CR]);
          activeHhId = INITIAL_HOUSEHOLD_CR.id;
          setActiveHouseholdId(activeHhId);
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } else {
        setHouseholds(loadedHouseholds);
        if (!loadedHouseholds.some(h => h.id === activeHhId)) {
          activeHhId = loadedHouseholds[0].id;
          setActiveHouseholdId(activeHhId);
        }
        setShowOnboarding(false);
      }

      // 3. Invoices
      let loadedInvoices = await db.getAll<Invoice>(STORES.INVOICES);
      if (isAutoStart && loadedInvoices.length === 0) {
        for (const inv of SAMPLE_INVOICES) {
          await db.put(STORES.INVOICES, inv);
        }
        for (const app of SAMPLE_APPLIANCES) {
          await db.put(STORES.APPLIANCES, app);
        }
        for (const act of SAMPLE_SAVINGS_ACTIONS) {
          await db.put(STORES.SAVINGS_ACTIONS, act);
        }
        loadedInvoices = await db.getAll<Invoice>(STORES.INVOICES);
      }
      setInvoices(loadedInvoices);

      // 4. Appliances
      const loadedAppliances = await db.getAll<Appliance>(STORES.APPLIANCES);
      setAppliances(loadedAppliances);

      // 5. Scenarios
      const loadedScenarios = await db.getAll<Scenario>(STORES.SCENARIOS);
      setScenarios(loadedScenarios);

      // 6. Savings Actions
      const loadedActions = await db.getAll<SavingsActionItem>(STORES.SAVINGS_ACTIONS);
      setSavingsActions(loadedActions);

      // 7. Investments
      const loadedInvestments = await db.getAll<EnergyInvestment>(STORES.INVESTMENTS);
      setInvestments(loadedInvestments);

      // 8. Active Tariff ID
      const tariffSetting = await db.getById<{ key: string; value: string }>(
        STORES.APP_SETTINGS,
        'active_tariff_id'
      );
      if (tariffSetting?.value) {
        setActiveTariffId(tariffSetting.value);
      }

      // 9. Run mathematical diagnostics
      const curHh = loadedHouseholds.find(h => h.id === activeHhId) || loadedHouseholds[0] || null;
      if (curHh) {
        const generatedDiags = runEnergyDiagnostics(
          loadedInvoices,
          loadedAppliances,
          curHh.id
        );
        setDiagnostics(generatedDiags);
      }

      // 10. User Account & Google Hub
      const loadedAccounts = await db.getAll<UserAccount>(STORES.USER_ACCOUNT);
      if (loadedAccounts.length > 0) {
        setUserAccount(loadedAccounts[0]);
      } else {
        await db.put(STORES.USER_ACCOUNT, DEFAULT_USER_ACCOUNT);
        setUserAccount(DEFAULT_USER_ACCOUNT);
      }
    } catch (err) {
      console.error('Error loading VATIO local data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate diagnostics whenever invoices or appliances change
  const refreshDiagnostics = (invList: Invoice[], appList: Appliance[], hhId: string) => {
    const diags = runEnergyDiagnostics(invList, appList, hhId);
    setDiagnostics(diags);
  };

  // Active household
  const household = households.find(h => h.id === activeHouseholdId) || households[0] || null;

  // Account Handlers
  const handleSaveAccount = async (accountData: UserAccount) => {
    await db.put(STORES.USER_ACCOUNT, accountData);
    setUserAccount(accountData);
  };

  const handleLogoutAccount = async () => {
    if (userAccount) {
      await db.delete(STORES.USER_ACCOUNT, userAccount.id);
      setUserAccount(null);
    }
  };

  // Handlers
  const handleOnboardingComplete = async (newHousehold: Household) => {
    await db.put(STORES.HOUSEHOLDS, newHousehold);
    setHouseholds([newHousehold]);
    setActiveHouseholdId(newHousehold.id);
    setShowOnboarding(false);
    await loadData();
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    await db.put(STORES.INVOICES, invoice);

    // Auto-generate analytical snapshot for Atlas Energético
    try {
      const snapshot: AnalyticsSnapshot = {
        id: `snap-${invoice.id}`,
        householdId: invoice.householdId,
        invoiceId: invoice.id,
        title: `Snapshot Analítico · ${invoice.periodStart}`,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        dataType: 'invoice_metrics',
        createdAt: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
        sourceInvoiceIds: [invoice.id],
        methodologyVersion: '1.0',
        status: 'active',
        metricsSummary: {
          consumptionKwh: invoice.consumptionKwh,
          declaredTotal: invoice.declaredTotal,
          effectiveCostPerKwh:
            invoice.consumptionKwh > 0
              ? Math.round((invoice.declaredTotal / invoice.consumptionKwh) * 100) / 100
              : 0,
          dailyKwh:
            invoice.billingDays > 0
              ? Math.round((invoice.consumptionKwh / invoice.billingDays) * 100) / 100
              : 0,
        },
      };
      await db.put(STORES.ANALYTICS_SNAPSHOTS, snapshot);
    } catch (e) {
      console.warn('Could not store automatic snapshot:', e);
    }

    const updated = await db.getAll<Invoice>(STORES.INVOICES);
    setInvoices(updated);
    if (household) refreshDiagnostics(updated, appliances, household.id);
  };

  const handleDeleteInvoice = async (id: string) => {
    await db.delete(STORES.INVOICES, id);
    const updated = await db.getAll<Invoice>(STORES.INVOICES);
    setInvoices(updated);
    if (household) refreshDiagnostics(updated, appliances, household.id);
  };

  const handleSaveAppliance = async (appliance: Appliance) => {
    await db.put(STORES.APPLIANCES, appliance);
    const updated = await db.getAll<Appliance>(STORES.APPLIANCES);
    setAppliances(updated);
    if (household) refreshDiagnostics(invoices, updated, household.id);
  };

  const handleDeleteAppliance = async (id: string) => {
    await db.delete(STORES.APPLIANCES, id);
    const updated = await db.getAll<Appliance>(STORES.APPLIANCES);
    setAppliances(updated);
    if (household) refreshDiagnostics(invoices, updated, household.id);
  };

  const handleToggleActiveAppliance = async (id: string) => {
    const target = appliances.find(a => a.id === id);
    if (!target) return;
    const updatedApp = { ...target, active: !target.active };
    await db.put(STORES.APPLIANCES, updatedApp);
    const updated = await db.getAll<Appliance>(STORES.APPLIANCES);
    setAppliances(updated);
    if (household) refreshDiagnostics(invoices, updated, household.id);
  };

  const handleSaveScenario = async (scenario: Scenario) => {
    await db.put(STORES.SCENARIOS, scenario);
    const updated = await db.getAll<Scenario>(STORES.SCENARIOS);
    setScenarios(updated);
  };

  const handleDeleteScenario = async (id: string) => {
    await db.delete(STORES.SCENARIOS, id);
    const updated = await db.getAll<Scenario>(STORES.SCENARIOS);
    setScenarios(updated);
  };

  const handleUpdateDiagnosticStatus = (id: string, status: 'pendiente' | 'revisado' | 'descartado') => {
    setDiagnostics(prev =>
      prev.map(d => (d.id === id ? { ...d, status } : d))
    );
  };

  const handleUpdateActionStatus = async (id: string, status: SavingsActionItem['status']) => {
    const act = savingsActions.find(a => a.id === id);
    if (!act) return;
    const updated = { ...act, status, completedDate: status === 'completada' ? new Date().toISOString() : undefined };
    await db.put(STORES.SAVINGS_ACTIONS, updated);
    const all = await db.getAll<SavingsActionItem>(STORES.SAVINGS_ACTIONS);
    setSavingsActions(all);
  };

  const handleAddSavingsAction = async (action: SavingsActionItem) => {
    await db.put(STORES.SAVINGS_ACTIONS, action);
    const all = await db.getAll<SavingsActionItem>(STORES.SAVINGS_ACTIONS);
    setSavingsActions(all);
  };

  const handleAddInvestment = async (inv: EnergyInvestment) => {
    await db.put(STORES.INVESTMENTS, inv);
    const all = await db.getAll<EnergyInvestment>(STORES.INVESTMENTS);
    setInvestments(all);
  };

  const handleDeleteInvestment = async (id: string) => {
    await db.delete(STORES.INVESTMENTS, id);
    const all = await db.getAll<EnergyInvestment>(STORES.INVESTMENTS);
    setInvestments(all);
  };

  const handleSelectActiveTariff = async (tariffId: string) => {
    setActiveTariffId(tariffId);
    await db.put(STORES.APP_SETTINGS, { key: 'active_tariff_id', value: tariffId });
  };

  const handleSaveHousehold = async (hh: Household) => {
    await db.put(STORES.HOUSEHOLDS, hh);
    const all = await db.getAll<Household>(STORES.HOUSEHOLDS);
    setHouseholds(all);
  };

  const handleSeedSampleData = async () => {
    if (!confirm('¿Deseas cargar datos de prueba reales para Costa Rica? No se borrarán tus registros previos.')) return;
    for (const inv of SAMPLE_INVOICES) {
      await db.put(STORES.INVOICES, inv);
    }
    for (const app of SAMPLE_APPLIANCES) {
      await db.put(STORES.APPLIANCES, app);
    }
    for (const act of SAMPLE_SAVINGS_ACTIONS) {
      await db.put(STORES.SAVINGS_ACTIONS, act);
    }
    await loadData();
    setCurrentView('dashboard');
  };

  const handleResetAllData = async () => {
    if (!confirm('⚠️ ATENCIÓN: Esta acción eliminará permanentemente todas las facturas, aparatos, escenarios e historial local. ¿Continuar?')) {
      return;
    }
    await db.clearStore(STORES.INVOICES);
    await db.clearStore(STORES.APPLIANCES);
    await db.clearStore(STORES.SCENARIOS);
    await db.clearStore(STORES.DIAGNOSTICS);
    await db.clearStore(STORES.SAVINGS_ACTIONS);
    await db.clearStore(STORES.INVESTMENTS);
    await db.clearStore(STORES.APP_SETTINGS);
    await loadData();
    setShowOnboarding(true);
  };

  const activeTariff = tariffs.find(t => t.id === activeTariffId) || tariffs[0];
  const pendingAlertsCount = diagnostics.filter(d => d.status === 'pendiente').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#35D39A] to-[#42C7D9] flex items-center justify-center animate-pulse shadow-lg shadow-[#35D39A]/20">
            <span className="text-xl font-black text-slate-950">V</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            VATIO · Energy Intelligence
          </span>
        </div>
      </div>
    );
  }

  // Vista previa móvil: la página externa muestra un iframe de teléfono real.
  const isPhonePreview = platform === 'web' && previewMode === 'phone' && !insideFrame;

  const appShell = (
    <div className="min-h-screen bg-[#F3F6FA] dark:bg-[#0B1220] text-slate-900 dark:text-[#F2F6FC] transition-colors flex flex-col font-sans">
      {/* Top Header */}
      <Header
        household={household}
        households={households}
        activeHouseholdId={activeHouseholdId}
        onSelectHousehold={setActiveHouseholdId}
        onOpenInstallationModal={() => setIsInstallModalOpen(true)}
        themeMode={themeMode}
        onSetThemeMode={setThemeMode}
        pendingAlertsCount={pendingAlertsCount}
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenGoogleTranslate={() => setIsTranslateOpen(true)}
        userAccount={userAccount}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-8">
        {/* Desktop Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          pendingAlertsCount={pendingAlertsCount}
          household={household}
          onOpenInstallationModal={() => setIsInstallModalOpen(true)}
          userAccount={userAccount}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {currentView === 'dashboard' && (
            <DashboardView
              household={household}
              invoices={invoices}
              appliances={appliances}
              diagnostics={diagnostics}
              onNavigate={setCurrentView}
              onOpenAddInvoice={() => setIsQuickAddInvoiceOpen(true)}
              onOpenAddAppliance={() => setIsQuickAddApplianceOpen(true)}
            />
          )}

          {currentView === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              tariffs={tariffs}
              householdId={household?.id || 'household-primary'}
              currency={household?.currencySymbol || '₡'}
              distributor={household?.distributor || 'ICE'}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
            />
          )}

          {currentView === 'appliances' && (
            <AppliancesView
              appliances={appliances}
              tariff={activeTariff}
              householdId={household?.id || 'household-primary'}
              currencySymbol={household?.currencySymbol || '₡'}
              onSaveAppliance={handleSaveAppliance}
              onDeleteAppliance={handleDeleteAppliance}
              onToggleActive={handleToggleActiveAppliance}
            />
          )}

          {currentView === 'atlas' && (
            <AtlasView
              household={household}
              invoices={invoices}
              appliances={appliances}
              tariff={activeTariff}
              onNavigate={setCurrentView}
              onOpenAddInvoice={() => setIsQuickAddInvoiceOpen(true)}
            />
          )}

          {currentView === 'simulator' && (
            <SimulatorView
              appliances={appliances}
              tariff={activeTariff}
              householdId={household?.id || 'household-primary'}
              currencySymbol={household?.currencySymbol || '₡'}
              savedScenarios={scenarios}
              onSaveScenario={handleSaveScenario}
              onDeleteScenario={handleDeleteScenario}
            />
          )}

          {currentView === 'diagnostics' && (
            <DiagnosticsView
              diagnostics={diagnostics}
              invoices={invoices}
              appliances={appliances}
              tariff={activeTariff}
              currencySymbol={household?.currencySymbol || '₡'}
              onUpdateDiagnosticStatus={handleUpdateDiagnosticStatus}
            />
          )}

          {currentView === 'savings' && (
            <SavingsPlanView
              actions={savingsActions}
              investments={investments}
              appliances={appliances}
              tariff={activeTariff}
              householdId={household?.id || 'household-primary'}
              currencySymbol={household?.currencySymbol || '₡'}
              onUpdateActionStatus={handleUpdateActionStatus}
              onAddAction={handleAddSavingsAction}
              onAddInvestment={handleAddInvestment}
              onDeleteInvestment={handleDeleteInvestment}
            />
          )}

          {currentView === 'tariffs' && (
            <TariffsView
              tariffs={tariffs}
              activeTariffId={activeTariffId}
              onSelectActiveTariff={handleSelectActiveTariff}
              onSaveTariff={async t => {
                await db.put(STORES.TARIFFS, t);
                const all = await db.getAll<Tariff>(STORES.TARIFFS);
                setTariffs(all);
              }}
              currencySymbol={household?.currencySymbol || '₡'}
            />
          )}

          {currentView === 'tools' && (
            <ToolsView currencySymbol={household?.currencySymbol || '₡'} />
          )}

          {currentView === 'reports' && (
            <ReportsView
              household={household}
              invoices={invoices}
              appliances={appliances}
              tariffs={tariffs}
              onRefreshData={loadData}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              household={household}
              tariffs={tariffs}
              darkMode={themeMode === 'dark'}
              onToggleDarkMode={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              onUpdateHousehold={handleSaveHousehold}
              onResetAllData={handleResetAllData}
              onSeedSampleData={handleSeedSampleData}
              userAccount={userAccount}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Android Thumb Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        pendingAlertsCount={pendingAlertsCount}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentView}
        invoices={invoices}
        appliances={appliances}
        tariffs={tariffs}
        scenarios={scenarios}
        diagnostics={diagnostics}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        diagnostics={diagnostics}
        onNavigate={setCurrentView}
        onDismissDiagnostic={id => handleUpdateDiagnosticStatus(id, 'descartado')}
        onMarkAllRead={() => {
          diagnostics.forEach(d => handleUpdateDiagnosticStatus(d.id, 'revisado'));
        }}
      />

      {/* Google Translate Modal */}
      <GoogleTranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
      />

      {/* Installation Modal */}
      <InstallationModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        households={households}
        activeHouseholdId={activeHouseholdId}
        onSelectHousehold={setActiveHouseholdId}
        onSaveHousehold={handleSaveHousehold}
        tariffs={tariffs}
      />

      {/* Onboarding Wizard Modal on first launch */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          availableTariffs={tariffs}
        />
      )}

      {/* Quick Add Invoice Modal */}
      <InvoiceFormModal
        isOpen={isQuickAddInvoiceOpen}
        onClose={() => setIsQuickAddInvoiceOpen(false)}
        onSave={handleSaveInvoice}
        householdId={household?.id || 'household-primary'}
        defaultCurrency={household?.currency || 'CRC'}
        defaultDistributor={household?.distributor || 'ICE'}
        tariffs={tariffs}
      />

      {/* Quick Add Appliance Modal */}
      <ApplianceFormModal
        isOpen={isQuickAddApplianceOpen}
        onClose={() => setIsQuickAddApplianceOpen(false)}
        onSave={handleSaveAppliance}
        householdId={household?.id || 'household-primary'}
        tariff={activeTariff}
        currencySymbol={household?.currencySymbol || '₡'}
      />

      {/* User Account & Google Workspace Hub Modal */}
      <UserAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={userAccount}
        onSaveAccount={handleSaveAccount}
        onLogout={handleLogoutAccount}
        household={household}
        invoices={invoices}
      />
    </div>
  );

  // Dentro del iframe o en app nativa → la app móvil a pantalla completa.
  if (insideFrame || platform === 'native') {
    return appShell;
  }

  // Previsualización móvil: la app se monta en un IFRAME de 390px para que
  // los breakpoints responsivos funcionen con el ancho real de un teléfono.
  if (isPhonePreview) {
    const innerUrl = `${window.location.pathname}?preview=inner`;
    return (
      <div className="phone-preview-shell">
        <div className="phone-preview-frame">
          <iframe
            src={innerUrl}
            title="VATIO · Vista móvil"
            className="h-full w-full border-0 bg-[#0B1220]"
          />
        </div>
        <PhonePreviewToggle
          previewMode={previewMode}
          onToggle={m => {
            setPreviewMode(m);
            setPreviewModeState(m);
          }}
        />
      </div>
    );
  }

  return (
    <>
      {appShell}
      <PhonePreviewToggle
        previewMode={previewMode}
        onToggle={m => {
          setPreviewMode(m);
          setPreviewModeState(m);
        }}
      />
    </>
  );
}

/**
 * Botón flotante exclusivo para DESARROLLO (web).
 * Permite alternar entre la vista escritorio y una previsualización
 * móvil con marco de teléfono, sin tocar el build nativo.
 */
function PhonePreviewToggle({
  previewMode,
  onToggle,
}: {
  previewMode: PreviewMode;
  onToggle: (mode: PreviewMode) => void;
}) {
  if (import.meta.env.MODE !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end">
      <div className="rounded-full bg-slate-900/90 text-white text-[10px] font-mono px-2 py-0.5 opacity-70">
        {previewMode === 'phone' ? '📱 preview móvil' : '🖥️ desktop'}
      </div>
      <button
        type="button"
        onClick={() => onToggle(previewMode === 'phone' ? 'desktop' : 'phone')}
        title="Alternar entre vista escritorio y previsualización móvil"
        className="w-12 h-12 rounded-full bg-[#35D39A] text-slate-950 shadow-lg shadow-[#35D39A]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {previewMode === 'phone' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <line x1="11" y1="18" x2="13" y2="18" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default App;
