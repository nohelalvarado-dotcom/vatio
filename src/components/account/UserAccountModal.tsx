import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  HardDrive,
  ExternalLink,
  LogOut,
  RefreshCw,
  Zap,
  Globe,
  Lock,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutFirebase,
  observeAuth,
  AuthUser,
} from '../../services/firebase/auth-service';
import {
  pushAllToCloud,
  pullAllFromCloud,
  touchSyncStamp,
} from '../../services/firebase/sync-service';
import { UserAccount, DEFAULT_USER_ACCOUNT } from '../../types/account';
import { Household } from '../../types/household';
import { Invoice } from '../../types/invoice';
import { GoogleWorkspaceHub } from '../../core/integrations/google-workspace-hub';
import { db } from '../../database/db';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserAccount | null;
  onSaveAccount: (account: UserAccount) => Promise<void>;
  onLogout: () => Promise<void>;
  household: Household | null;
  invoices: Invoice[];
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSaveAccount,
  onLogout,
  household,
  invoices,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'google' | 'security'>(
    account ? 'profile' : 'profile'
  );

  // Form states for account creation / editing
  const [name, setName] = useState(account?.name || DEFAULT_USER_ACCOUNT.name);
  const [email, setEmail] = useState(account?.email || DEFAULT_USER_ACCOUNT.email);
  const [phone, setPhone] = useState(account?.phone || DEFAULT_USER_ACCOUNT.phone || '');
  const [country, setCountry] = useState(account?.country || household?.country || 'Costa Rica');
  const [city, setCity] = useState(account?.city || household?.city || 'San José');
  const [meterNumber, setMeterNumber] = useState(account?.meterNumber || 'NIS-849201');
  const [distributor, setDistributor] = useState(account?.distributor || household?.distributor || 'ICE');
  const [accountType, setAccountType] = useState<UserAccount['accountType']>(account?.accountType || 'personal');
  const [pinProtection, setPinProtection] = useState(account?.pinProtection || false);
  const [pinCode, setPinCode] = useState(account?.pinCode || '');

  // Google integration states
  const [isGoogleConnected, setIsGoogleConnected] = useState(account?.google.connected ?? true);
  const [googleEmail, setGoogleEmail] = useState(account?.google.googleEmail || email || 'Nohelalvarado@gmail.com');
  const [driveFolder, setDriveFolder] = useState(account?.google.drive.backupFolder || 'VATIO_Energia_Respaldos');
  const [driveAutoSync, setDriveAutoSync] = useState(account?.google.drive.autoSyncInvoices ?? true);
  const [sheetsAutoExport, setSheetsAutoExport] = useState(account?.google.sheets.autoExportOnSave ?? true);
  const [calendarDay, setCalendarDay] = useState(account?.google.calendar.meterReadingDay || 28);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Estado Firebase ──
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    const unsub = observeAuth(setFirebaseUser);
    return unsub;
  }, []);

  const runSync = async (fn: () => Promise<string>, okPrefix: string) => {
    if (!firebaseUser) return;
    setSyncBusy(true);
    setSyncMsg(null);
    try {
      const detail = await fn();
      await touchSyncStamp(firebaseUser.uid);
      setSyncMsg({ type: 'success', text: `${okPrefix} · ${detail}` });
    } catch (err: any) {
      setSyncMsg({ type: 'error', text: `Error: ${err?.message || 'desconocido'}` });
    } finally {
      setSyncBusy(false);
    }
  };

  const handleCloudBackup = () =>
    runSync(async () => {
      const counts = await pushAllToCloud(firebaseUser!.uid);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return `${total} registros subidos`;
    }, 'Copia completada');

  const handleCloudRestore = () =>
    runSync(async () => {
      const counts = await pullAllFromCloud(firebaseUser!.uid);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      window.location.reload();
      return `${total} registros restaurados`;
    }, 'Restauración completada');

  const handleFirebaseLogout = async () => {
    await logoutFirebase();
    setFirebaseUser(null);
  };

  const handleFirebaseAuth = async (u: AuthUser) => {
    setFirebaseUser(u);
    try {
      const counts = await pullAllFromCloud(u.uid);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total > 0) window.location.reload();
    } catch {
      /* silencioso: el usuario puede subir después */
    }
  };

  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showFeedback('Por favor completa tu nombre y correo electrónico.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedAccount: UserAccount = {
        id: account?.id || `acc_${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        country,
        city,
        householdId: household?.id || 'household-primary',
        meterNumber: meterNumber.trim() || undefined,
        distributor,
        accountType,
        authProvider: isGoogleConnected ? 'google' : 'local',
        pinProtection,
        pinCode: pinProtection ? pinCode : undefined,
        createdAt: account?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        google: {
          connected: isGoogleConnected,
          googleEmail: isGoogleConnected ? googleEmail : undefined,
          googleName: isGoogleConnected ? name.trim() : undefined,
          scopesGranted: isGoogleConnected
            ? ['drive.file', 'spreadsheets', 'calendar.events']
            : [],
          drive: {
            enabled: isGoogleConnected,
            backupFolder: driveFolder,
            autoSyncInvoices: driveAutoSync,
            autoSyncReports: true,
            lastBackupDate: account?.google.drive.lastBackupDate,
            backupStatus: 'synced',
          },
          sheets: {
            enabled: isGoogleConnected,
            sheetName: 'VATIO_Auditoria_Facturas_2024',
            autoExportOnSave: sheetsAutoExport,
            lastExportDate: account?.google.sheets.lastExportDate,
          },
          calendar: {
            enabled: isGoogleConnected,
            meterReadingReminder: true,
            meterReadingDay: calendarDay,
            billingDueDateReminder: true,
            reminderNoticeDays: 3,
            lastReminderCreated: account?.google.calendar.lastReminderCreated,
          },
        },
      };

      await onSaveAccount(updatedAccount);
      showFeedback('¡Cuenta y vinculaciones guardadas exitosamente!');
    } catch (err: any) {
      showFeedback(`Error al guardar cuenta: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google 1-Click Link / Unlink
  const handleToggleGoogleLink = () => {
    const nextState = !isGoogleConnected;
    setIsGoogleConnected(nextState);
    if (nextState) {
      showFeedback('Cuenta de Google vinculada. Servicios de Drive, Sheets y Calendar activados.');
    } else {
      showFeedback('Vinculación con Google desconectada. Los datos se mantendrán sólo en local.', 'info');
    }
  };

  // Google Drive Manual Backup Trigger
  const handleTriggerDriveBackup = async () => {
    try {
      const fullBackup = await db.exportFullBackup();
      const currentAcc = account || DEFAULT_USER_ACCOUNT;
      const manifest = GoogleWorkspaceHub.createGoogleDriveBackupManifest(currentAcc, JSON.parse(fullBackup));
      
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GoogleDrive_Backup_VATIO_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showFeedback('Copia de respaldo para Google Drive generada. Sincronizada con carpeta: ' + driveFolder);
    } catch (err: any) {
      showFeedback('Error al generar respaldo para Drive: ' + err.message, 'error');
    }
  };

  // Google Sheets Export Trigger
  const handleExportSheets = () => {
    try {
      const csv = GoogleWorkspaceHub.generateSheetsCsv(invoices, household);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VATIO_GoogleSheets_Facturas_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      // Also open Google Sheets create URL in new tab
      window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
      showFeedback('Archivo CSV listo para Google Sheets descargado y hoja en blanco abierta en Google Sheets.');
    } catch (err: any) {
      showFeedback('Error al exportar para Google Sheets: ' + err.message, 'error');
    }
  };

  // Google Calendar Event Scheduler
  const handleScheduleMeterReadingCalendar = () => {
    const url = GoogleWorkspaceHub.getCalendarMeterReadingUrl(calendarDay, household?.name || 'Mi Hogar');
    window.open(url, '_blank', 'noopener,noreferrer');
    showFeedback(`Abriendo Google Calendar para programar recordatorio recurrente el día ${calendarDay} de cada mes.`);
  };

  const handleScheduleLatestInvoiceDueCalendar = () => {
    if (invoices.length === 0) {
      showFeedback('No hay facturas registradas para programar recordatorio de vencimiento.', 'info');
      return;
    }
    const latestInvoice = [...invoices].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
    const url = GoogleWorkspaceHub.getCalendarInvoiceDueUrl(latestInvoice, household);
    window.open(url, '_blank', 'noopener,noreferrer');
    showFeedback('Abriendo Google Calendar con la alerta de pago de la última factura.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cuenta de Usuario & Herramientas de Google"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Account Header Hero with App Logo & Status */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* New VATIO App Logo */}
          <div className="relative shrink-0">
            <img
              src="/vatio-logo.png"
              alt="VATIO Logo"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-emerald-500/30"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-base font-bold text-white truncate">{name || 'Usuario VATIO'}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {account ? 'Cuenta Activa' : 'Nueva Cuenta'}
              </span>
              {isGoogleConnected && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  Google Conectado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{email || 'Sin correo asociado'}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Suministro: <strong className="text-slate-300">{distributor}</strong> · NIS: <strong className="text-slate-300">{meterNumber || 'No asignado'}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleGoogleLink}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              isGoogleConnected
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isGoogleConnected ? 'Google Vinculado' : 'Vincular Google'}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in duration-200 ${
              feedbackMsg.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                : feedbackMsg.type === 'info'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Datos de la Cuenta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Herramientas de Google</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Seguridad & Privacidad</span>
          </button>
        </div>

        {/* Tab 1: Profile & Account Information */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Nohel Alvarado"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nohelalvarado@gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / Móvil de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+506 8888-0000"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Distribuidora Eléctrica
                </label>
                <select
                  value={distributor}
                  onChange={(e) => setDistributor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="ICE">ICE — Instituto Costarricense de Electricidad</option>
                  <option value="CNFL">CNFL — Compañía Nacional de Fuerza y Luz</option>
                  <option value="ESPH">ESPH — Empresa de Servicios Públicos de Heredia</option>
                  <option value="JASEC">JASEC — Junta Administrativa de Cartago</option>
                  <option value="COOPEGUANACASTE">Coopeguanacaste, R.L.</option>
                  <option value="COOPESANTOS">Coopesantos, R.L.</option>
                  <option value="COOPEALFAROBRUIZ">Coopealfaroruiz, R.L.</option>
                  <option value="COOPELESCA">Coopelesca, R.L.</option>
                  <option value="OTRA">Otra distribuidora regional / internacional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Servicio (NIS / Contrato)
                </label>
                <input
                  type="text"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  placeholder="Ej. NIS-849201"
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as UserAccount['accountType'])}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="personal">Residencial / Hogar Familiar</option>
                  <option value="commercial">Comercio / Pequeña Empresa</option>
                  <option value="auditor">Auditor Energético / Consultor</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{account ? 'Guardar Cambios de Cuenta' : 'Crear Cuenta de Usuario'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Google Workspace Tools Linking Hub */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            {/* Google Account Linking Status Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs shrink-0">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Cuenta de Google
                    {isGoogleConnected && (
                      <span className="text-[10px] text-emerald-500 font-normal">● Conectada</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isGoogleConnected ? googleEmail : 'Sin cuenta de Google vinculada'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleGoogleLink}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  isGoogleConnected
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                }`}
              >
                {isGoogleConnected ? (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Desvincular Google</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Conectar con Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Google Tools Suite */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tool 1: Google Drive */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Drive
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-2">
                    Respaldo en Google Drive
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Guarda copias de seguridad de tus facturas, electrodomésticos e informes en tu unidad de Google Drive.
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Carpeta: {driveFolder}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleTriggerDriveBackup}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Crear Copia para Drive</span>
                  </button>
                </div>
              </div>

              {/* Tool 2: Google Sheets */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Sheets
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-2">
                    Exportación a Google Sheets
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sincroniza todas tus facturas, desglose por bloques y consumo diario en una hoja de cálculo lista para auditar.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleExportSheets}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar a Google Sheets</span>
                  </button>
                </div>
              </div>

              {/* Tool 3: Google Calendar */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      Calendar
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-2">
                    Alertas en Google Calendar
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Programa eventos mensuales en Google Calendar para lectura de medidor y fechas límites de cobro.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleScheduleMeterReadingCalendar}
                    className="w-full py-1.5 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[11px] transition flex items-center justify-center gap-1.5"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Recordatorio de Lectura</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScheduleLatestInvoiceDueCalendar}
                    className="w-full py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Alerta de Vencimiento</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Google Sync Preferences */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                Opciones de Sincronización Automática con Google
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={driveAutoSync}
                    onChange={(e) => setDriveAutoSync(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Respaldo en Drive con cada factura
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Actualiza el JSON de respaldo al registrar lecturas.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sheetsAutoExport}
                    onChange={(e) => setSheetsAutoExport(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Preparar datos para Google Sheets
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Exporta columnas formateadas para cálculo fiscal.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Día mensual para recordatorio en Google Calendar:
                </span>
                <select
                  value={calendarDay}
                  onChange={(e) => setCalendarDay(Number(e.target.value))}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                >
                  {[...Array(31)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Día {i + 1} de cada mes
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Session */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                  Bloqueo por PIN de Seguridad (Opcional)
                </h5>
              </div>
              <p className="text-[11px] text-slate-500">
                Protege el acceso a tus facturas y diagnósticos energéticos en este dispositivo mediante un PIN numérico de 4 dígitos.
              </p>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinProtection}
                    onChange={(e) => setPinProtection(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-800 dark:text-slate-200">Activar PIN de acceso</span>
                </label>

                {pinProtection && (
                  <input
                    type="password"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="PIN (4-6 dígitos)"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono tracking-widest w-36"
                  />
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-500" />
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                  Sincronización en la nube (Firebase)
                </h5>
              </div>
              <p className="text-[11px] text-slate-500">
                Guarda tus facturas, aparatos y diagnósticos en Firestore y recupéralos en
                cualquier dispositivo. Tus datos quedan asociados a tu cuenta.
              </p>
              {firebaseUser ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Sesión: {firebaseUser.email || firebaseUser.displayName || firebaseUser.uid}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={syncBusy}
                      onClick={handleCloudBackup}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition disabled:opacity-50"
                    >
                      {syncBusy ? 'Sincronizando…' : '↑ Subir datos a la nube'}
                    </button>
                    <button
                      type="button"
                      disabled={syncBusy}
                      onClick={handleCloudRestore}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] transition disabled:opacity-50"
                    >
                      ↓ Restaurar desde la nube
                    </button>
                    <button
                      type="button"
                      onClick={handleFirebaseLogout}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition"
                    >
                      Salir de la nube
                    </button>
                  </div>
                </div>
              ) : (
                <FirebaseAuthInline onAuth={handleFirebaseAuth} />
              )}
              {syncMsg && (
                <p className={`text-[11px] font-semibold ${syncMsg.type === 'error' ? 'text-red-500' : 'text-slate-500'}`}>
                  {syncMsg.text}
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
              <h5 className="text-xs font-bold text-red-600 dark:text-red-400">
                Sesión y Almacenamiento Local
              </h5>
              <p className="text-[11px] text-slate-500">
                Tus datos residen de forma 100% segura en tu navegador (IndexedDB). Si cierras sesión, tu cuenta quedará guardada pero se requerirá confirmar tu identidad para editar.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onLogout();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión en este Dispositivo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Mini-formulario de autenticación Firebase (email/contraseña + Google).
 * Se muestra dentro de la pestaña Seguridad cuando no hay sesión en la nube.
 */
const FirebaseAuthInline: React.FC<{
  onAuth: (u: AuthUser) => void;
}> = ({ onAuth }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u =
        mode === 'login'
          ? await loginWithEmail(email.trim(), password)
          : await registerWithEmail(email.trim(), password, email.split('@')[0]);
      onAuth(u);
    } catch (err: any) {
      const map: Record<string, string> = {
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/email-already-in-use': 'Ese correo ya tiene cuenta. Inicia sesión.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/invalid-email': 'Correo electrónico no válido.',
      };
      setError(map[err?.code] || err?.message || 'Error de autenticación');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      const u = await loginWithGoogle();
      onAuth(u);
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2 pt-1">
      <div className="flex gap-2 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`px-3 py-1 rounded-lg transition ${mode === 'login' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`px-3 py-1 rounded-lg transition ${mode === 'register' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Crear cuenta
        </button>
      </div>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="tucorreo@ejemplo.com"
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
      />
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Contraseña (mín. 6 caracteres)"
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
      />
      {error && <p className="text-[11px] text-red-500 font-semibold">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition disabled:opacity-50"
        >
          {busy ? 'Conectando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-[11px] text-slate-700 dark:text-slate-200 transition disabled:opacity-50"
        >
          G · Continuar con Google
        </button>
        {mode === 'login' && email && (
          <button
            type="button"
            onClick={async () => {
              try {
                await resetPassword(email.trim());
                setError(null);
                alert('Te enviamos un correo para restablecer la contraseña.');
              } catch {
                setError('No se pudo enviar el correo de recuperación.');
              }
            }}
            className="text-[11px] text-cyan-600 dark:text-cyan-400 underline"
          >
            Olvidé mi contraseña
          </button>
        )}
      </div>
    </form>
  );
};
