import React, { useState } from 'react';
import {
  FileText,
  Download,
  Upload,
  Lock,
  Unlock,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { Household } from '../../types/household';
import { Invoice } from '../../types/invoice';
import { Appliance } from '../../types/appliance';
import { Tariff } from '../../types/tariff';
import { db } from '../../database/db';
import { downloadJsonFile, exportInvoicesToCsv, exportAppliancesToCsv } from '../../services/export-service';
import { encryptBackupWithPassword, decryptBackupWithPassword, EncryptedBackupPayload } from '../../services/crypto-backup';

interface ReportsViewProps {
  household: Household | null;
  invoices: Invoice[];
  appliances: Appliance[];
  tariffs: Tariff[];
  onRefreshData: () => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  household,
  invoices,
  appliances,
  tariffs,
  onRefreshData,
}) => {
  const [tab, setTab] = useState<'reports' | 'backup' | 'legal'>('reports');

  // Encryption password state
  const [useEncryption, setUseEncryption] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Restore password state
  const [restorePassword, setRestorePassword] = useState('');
  const [pendingEncryptedFile, setPendingEncryptedFile] = useState<EncryptedBackupPayload | null>(null);

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Full backup download
  const handleExportBackup = async () => {
    try {
      const rawJson = await db.exportFullBackup();
      const dateStr = new Date().toISOString().split('T')[0];

      if (useEncryption) {
        if (!backupPassword || backupPassword.length < 6) {
          setStatusMessage({ text: 'La contraseña de cifrado debe tener al menos 6 caracteres.', isError: true });
          return;
        }
        const encrypted = await encryptBackupWithPassword(rawJson, backupPassword);
        downloadJsonFile(JSON.stringify(encrypted, null, 2), `vatio_respaldo_cifrado_${dateStr}.vatio`);
        setStatusMessage({ text: 'Respaldo cifrado descargado con éxito. Conserva tu contraseña.' });
      } else {
        downloadJsonFile(rawJson, `vatio_respaldo_${dateStr}.json`);
        setStatusMessage({ text: 'Respaldo completo JSON descargado correctamente.' });
      }
    } catch (err: any) {
      setStatusMessage({ text: `Error al generar respaldo: ${err.message}`, isError: true });
    }
  };

  // Import / Restore backup
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);

        if (parsed.format === 'vatio_encrypted_v1') {
          // Encrypted file detected
          setPendingEncryptedFile(parsed);
          setStatusMessage({ text: 'Archivo cifrado detectado. Introduce tu contraseña para restaurar.' });
        } else {
          // Unencrypted file
          const res = await db.restoreFullBackup(text);
          if (res.success) {
            await onRefreshData();
            setStatusMessage({ text: `Respaldo restaurado con éxito: ${res.counts.invoices} facturas, ${res.counts.appliances} aparatos.` });
          } else {
            setStatusMessage({ text: res.message, isError: true });
          }
        }
      } catch (err: any) {
        setStatusMessage({ text: `Error al leer archivo de respaldo: ${err.message}`, isError: true });
      }
    };
    reader.readAsText(file);
  };

  const handleDecryptAndRestore = async () => {
    if (!pendingEncryptedFile || !restorePassword) return;

    try {
      const decryptedJson = await decryptBackupWithPassword(pendingEncryptedFile, restorePassword);
      const res = await db.restoreFullBackup(decryptedJson);
      if (res.success) {
        await onRefreshData();
        setPendingEncryptedFile(null);
        setRestorePassword('');
        setStatusMessage({ text: `Respaldo cifrado restaurado con éxito: ${res.counts.invoices} facturas, ${res.counts.appliances} aparatos.` });
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } catch {
      setStatusMessage({ text: 'Contraseña incorrecta o archivo de respaldo dañado.', isError: true });
    }
  };

  const activeAppliances = appliances.filter(a => a.active);
  const totalMonthlyKwh = Math.round(activeAppliances.reduce((s, a) => s + a.calculatedMonthlyKwh, 0));
  const totalInvoicesKwh = invoices.reduce((s, i) => s + i.consumptionKwh, 0);
  const totalInvoicesCost = invoices.reduce((s, i) => s + i.declaredTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            <span>Centro de Informes y Respaldo Local</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generación local de informes imprimibles en PDF, exportación de tablas y copias de seguridad cifradas.
          </p>
        </div>

        {tab === 'reports' && (
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar como PDF</span>
          </button>
        )}
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs font-semibold ${
          statusMessage.isError
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300'
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('reports')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'reports'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Informe Ejecutivo Completo</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('backup')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'backup'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Respaldo y Restauración de Datos</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('legal')}
          className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
            tab === 'legal'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Aviso Legal y Limitaciones</span>
        </button>
      </div>

      {/* Tab 1: Printable Report Sheet */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Report Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Informe de Diagnóstico Energético y Auditoría
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  VATIO — {household?.name || 'Mi Instalación'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ubicación: {household?.country || 'Costa Rica'} • Distribuidora: {household?.distributor || 'ICE'} • Fecha de emisión: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs">
                <span className="text-slate-400 block text-[10px] font-sans">Moneda</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {household?.currency || 'CRC'} ({household?.currencySymbol || '₡'})
                </span>
              </div>
            </div>

            {/* General Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] font-sans">Facturas Auditadas</span>
                <strong className="text-base text-slate-900 dark:text-white block mt-0.5">{invoices.length}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] font-sans">Energía Facturada</span>
                <strong className="text-base text-emerald-600 dark:text-emerald-400 block mt-0.5">{totalInvoicesKwh} kWh</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] font-sans">Gasto Acumulado</span>
                <strong className="text-base text-slate-900 dark:text-white block mt-0.5">{household?.currencySymbol}{totalInvoicesCost.toLocaleString()}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] font-sans">Inventario Aparatos</span>
                <strong className="text-base text-cyan-600 dark:text-cyan-400 block mt-0.5">{totalMonthlyKwh} kWh/mes</strong>
              </div>
            </div>

            {/* Invoices List Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                1. Historial de Facturas y Auditoría Aritmética
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-sans">
                    <tr>
                      <th className="p-2.5">Periodo</th>
                      <th className="p-2.5">Consumo</th>
                      <th className="p-2.5">Total Declarado</th>
                      <th className="p-2.5">Auditoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="p-2.5">{inv.periodStart} al {inv.periodEnd} ({inv.billingDays}d)</td>
                        <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">{inv.consumptionKwh} kWh</td>
                        <td className="p-2.5 font-bold">{inv.currency} {inv.declaredTotal.toLocaleString()}</td>
                        <td className="p-2.5 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.auditStatus === 'verified_exact' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {inv.auditStatus === 'verified_exact' ? 'Exacto' : 'Diferencia'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Appliances Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                2. Desglose de Consumo por Electrodoméstico
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-sans">
                    <tr>
                      <th className="p-2.5">Aparato</th>
                      <th className="p-2.5">Potencia / Uso</th>
                      <th className="p-2.5">kWh / Mes</th>
                      <th className="p-2.5 text-right">Costo Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {activeAppliances.map((app) => (
                      <tr key={app.id}>
                        <td className="p-2.5 font-sans font-medium">{app.name} ({app.category})</td>
                        <td className="p-2.5">{app.powerWatts || 'ciclo'} W • {app.usageHoursPerDay || 0} h/d</td>
                        <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">{app.calculatedMonthlyKwh} kWh</td>
                        <td className="p-2.5 text-right font-bold">{household?.currencySymbol} {app.calculatedMonthlyCost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Backup & Restore */}
      {tab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Exportar Copia de Seguridad Completa</span>
            </h3>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Descarga un archivo con todas tus facturas, aparatos, escenarios, diagnósticos y configuraciones locales.
            </p>

            {/* Optional Encryption */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Cifrar respaldo con contraseña (AES-GCM Web Crypto)</span>
              </label>

              {useEncryption && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Introduce una contraseña segura (mínimo 6 caracteres)..."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <span className="text-[10px] text-amber-500 block">
                    ⚠️ La contraseña no se almacena. Si la olvidas, no podrás recuperar el archivo.
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{useEncryption ? 'Descargar Respaldo Cifrado (.vatio)' : 'Descargar Respaldo JSON (.json)'}</span>
            </button>
          </div>

          {/* Import / Restore Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-cyan-500" />
              <span>Restaurar Copia de Seguridad</span>
            </h3>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Carga un archivo de respaldo previo para restaurar todos tus registros sin duplicaciones.
            </p>

            <input
              type="file"
              accept=".json,.vatio"
              onChange={handleFileSelect}
              className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 cursor-pointer"
            />

            {pendingEncryptedFile && (
              <div className="p-3.5 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                <span className="font-bold text-cyan-800 dark:text-cyan-300 block">
                  Introduce la contraseña del archivo:
                </span>
                <input
                  type="password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  placeholder="Contraseña del respaldo..."
                  className="w-full p-2 rounded-lg border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-slate-900 text-xs"
                />
                <button
                  type="button"
                  onClick={handleDecryptAndRestore}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xs transition"
                >
                  Descifrar y Restaurar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Legal & Limitations */}
      {tab === 'legal' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111C2C] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Aviso Legal, Política de Privacidad y Limitaciones Técnicas
          </h2>

          <div className="space-y-3">
            <p>
              <strong>1. No sustitución de instrumentos oficiales:</strong> VATIO es una plataforma analítica y educativa de diagnóstico doméstico y comercial. Los resultados, cálculos y comprobaciones no sustituyen al medidor oficial de tu empresa distribuidora eléctrica, ni constituyen un peritaje legal o certificación de un ingeniero electricista colegiado.
            </p>
            <p>
              <strong>2. Exactitud y honestidad:</strong> VATIO distingue rigurosamente entre mediciones confirmadas, datos declarados por el usuario, cálculos matemáticos y estimaciones estadísticas. En ningún momento se simulan lecturas o datos inexistentes.
            </p>
            <p>
              <strong>3. Privacidad desde el diseño:</strong> La aplicación no envía tus facturas, hábitos de uso, datos personales ni fotografías a ningún servidor o servicio externo. Toda la persistencia opera de forma local e independiente en tu propio dispositivo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
