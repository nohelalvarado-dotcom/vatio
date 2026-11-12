import React, { useState } from 'react';
import { Plus, Trash2, Camera, Upload, AlertCircle, CheckCircle2, FileText, Info } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Invoice, InvoiceItemCharge } from '../../types/invoice';
import { Tariff } from '../../types/tariff';
import { validateAndAuditInvoice } from '../../core/validators/invoice-validator';
import { ocrService } from '../../services/ocr/ocr-service';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  householdId: string;
  defaultCurrency: string;
  defaultDistributor: string;
  tariffs: Tariff[];
  initialData?: Invoice | null;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  householdId,
  defaultCurrency,
  defaultDistributor,
  tariffs,
  initialData,
}) => {
  const [tab, setTab] = useState<'manual' | 'attachment' | 'text'>('manual');

  // Form fields
  const [distributor, setDistributor] = useState(initialData?.distributor || defaultDistributor || 'ICE');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || '');
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || new Date().toISOString().split('T')[0]);
  const [periodStart, setPeriodStart] = useState(initialData?.periodStart || '');
  const [periodEnd, setPeriodEnd] = useState(initialData?.periodEnd || '');
  const [billingDays, setBillingDays] = useState<number>(initialData?.billingDays || 30);
  
  // Readings
  const [previousReading, setPreviousReading] = useState<string>(initialData?.previousReading !== undefined ? String(initialData.previousReading) : '');
  const [currentReading, setCurrentReading] = useState<string>(initialData?.currentReading !== undefined ? String(initialData.currentReading) : '');
  const [meterMultiplier, setMeterMultiplier] = useState<number>(initialData?.meterMultiplier || 1);

  // Consumption and totals
  const [consumptionKwh, setConsumptionKwh] = useState<string>(initialData?.consumptionKwh !== undefined ? String(initialData.consumptionKwh) : '');
  const [declaredTotal, setDeclaredTotal] = useState<string>(initialData?.declaredTotal !== undefined ? String(initialData.declaredTotal) : '');
  const [currency, setCurrency] = useState(initialData?.currency || defaultCurrency || 'CRC');
  const [tariffId, setTariffId] = useState(initialData?.tariffId || tariffs[0]?.id || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Itemized concepts
  const [charges, setCharges] = useState<InvoiceItemCharge[]>(
    initialData?.charges || [
      { id: 'ch-1', name: 'Energía Eléctrica Consumida', category: 'energy', amount: 0, origin: 'DECLARADO' },
      { id: 'ch-2', name: 'Alumbrado Público', category: 'street_lighting', amount: 0, origin: 'DECLARADO' },
      { id: 'ch-3', name: 'Tributo Bomberos', category: 'fire_department', amount: 0, origin: 'DECLARADO' },
      { id: 'ch-4', name: 'Impuesto IVA (13%)', category: 'tax', amount: 0, origin: 'DECLARADO' },
    ]
  );

  // Attached image
  const [imageUri, setImageUri] = useState<string>(initialData?.imageUri || '');
  const [rawText, setRawText] = useState<string>(initialData?.rawOcrText || '');
  const [ocrMessage, setOcrMessage] = useState<string>('');

  // Handle automatic dates diff to billing days
  const handleDateChange = (start: string, end: string) => {
    setPeriodStart(start);
    setPeriodEnd(end);
    if (start && end) {
      const d1 = new Date(start).getTime();
      const d2 = new Date(end).getTime();
      if (d2 >= d1) {
        const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        setBillingDays(days);
      }
    }
  };

  // Handle auto-consumption from meter readings
  const handleReadingsChange = (prevStr: string, currStr: string, mult: number) => {
    setPreviousReading(prevStr);
    setCurrentReading(currStr);
    const p = parseFloat(prevStr);
    const c = parseFloat(currStr);
    if (!isNaN(p) && !isNaN(c) && c >= p) {
      const derived = (c - p) * (mult || 1);
      // Autofill consumption if currently empty or matches previous calculation
      if (!consumptionKwh || consumptionKwh === '0') {
        setConsumptionKwh(String(Math.round(derived * 100) / 100));
      }
    }
  };

  // Charge manipulation
  const addChargeItem = () => {
    setCharges([
      ...charges,
      {
        id: `ch-custom-${Date.now()}`,
        name: 'Nuevo Concepto',
        category: 'other',
        amount: 0,
        origin: 'DECLARADO',
      },
    ]);
  };

  const updateChargeItem = (idx: number, field: keyof InvoiceItemCharge, value: any) => {
    const updated = [...charges];
    updated[idx] = { ...updated[idx], [field]: value };
    setCharges(updated);
  };

  const removeChargeItem = (idx: number) => {
    setCharges(charges.filter((_, i) => i !== idx));
  };

  // Image handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const uri = reader.result as string;
        setImageUri(uri);
        const res = await ocrService.recognizeImage(uri);
        setOcrMessage(res.message);
      };
      reader.readAsDataURL(file);
    }
  };

  // Live audit preview
  const auditResult = validateAndAuditInvoice(
    {
      periodStart,
      periodEnd,
      billingDays,
      consumptionKwh: parseFloat(consumptionKwh) || 0,
      declaredTotal: parseFloat(declaredTotal) || 0,
      previousReading: previousReading !== '' ? parseFloat(previousReading) : undefined,
      currentReading: currentReading !== '' ? parseFloat(currentReading) : undefined,
      meterMultiplier,
      charges,
      currency,
    },
    tariffs.find(t => t.id === tariffId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditResult.isValid) return;

    const newInvoice: Invoice = {
      id: initialData?.id || `inv-${Date.now()}`,
      householdId,
      distributor,
      invoiceNumber: invoiceNumber.trim() || undefined,
      issueDate: issueDate || undefined,
      periodStart,
      periodEnd,
      billingDays: billingDays || 30,
      previousReading: previousReading !== '' ? parseFloat(previousReading) : undefined,
      currentReading: currentReading !== '' ? parseFloat(currentReading) : undefined,
      meterMultiplier: meterMultiplier || 1,
      consumptionKwh: Math.max(0, parseFloat(consumptionKwh) || 0),
      currency: currency || 'CRC',
      declaredTotal: Math.max(0, parseFloat(declaredTotal) || 0),
      calculatedTotal: auditResult.calculatedItemsTotal,
      charges: charges.filter(c => c.amount > 0 || c.name.trim() !== ''),
      tariffId: tariffId || undefined,
      auditStatus: auditResult.auditStatus,
      auditExplanation: auditResult.auditExplanation,
      readingDerivedKwh: auditResult.readingDerivedKwh,
      arithmeticDifference: auditResult.arithmeticDifference,
      dataOrigin: previousReading !== '' ? 'MEDIDO' : 'DECLARADO',
      notes: notes.trim() || undefined,
      imageUri: imageUri || undefined,
      rawOcrText: rawText || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newInvoice);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Factura Eléctrica' : 'Registrar Factura Eléctrica'}
      subtitle="Auditoría matemática independiente y comprobación tarifaria"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Input mode tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
              tab === 'manual'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>A. Formulario Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('attachment')}
            className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
              tab === 'attachment'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>B. Adjuntar Foto / Documento</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`pb-2.5 px-4 flex items-center gap-1.5 border-b-2 transition ${
              tab === 'text'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>C. Texto Copiado</span>
          </button>
        </div>

        {/* Tab B: Attachment notice & preview */}
        {tab === 'attachment' && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Selecciona una imagen de tu recibo para archivarla localmente</span>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"
            />
            {imageUri && (
              <div className="mt-2">
                <span className="text-[11px] text-slate-400 block mb-1">Vista previa del documento adjunto:</span>
                <img
                  src={imageUri}
                  alt="Factura adjunta"
                  className="max-h-48 rounded-lg border border-slate-200 dark:border-slate-700 object-contain bg-slate-900"
                />
              </div>
            )}
            {ocrMessage && (
              <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{ocrMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab C: Pasted text */}
        {tab === 'text' && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Pega aquí el texto extraído o digitalizado de tu factura:
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Ejemplo: ICE T-RE PERIODO 01/10/2024 AL 31/10/2024 LECTURA ANTERIOR 1420 LECTURA ACTUAL 1705 TOTAL A PAGAR 28.450 CRC..."
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
            />
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Distributor & Invoice # & Issue date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Distribuidora *
              </label>
              <input
                type="text"
                required
                value={distributor}
                onChange={(e) => setDistributor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                placeholder="ICE, CNFL, ESPH..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de Factura (opcional)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                placeholder="Fac-2024-001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Emisión
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 2: Period Start, End, Billing Days */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inicio del Periodo *
              </label>
              <input
                type="date"
                required
                value={periodStart}
                onChange={(e) => handleDateChange(e.target.value, periodEnd)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fin del Periodo *
              </label>
              <input
                type="date"
                required
                value={periodEnd}
                onChange={(e) => handleDateChange(periodStart, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Días Facturados
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={billingDays}
                onChange={(e) => setBillingDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 3: Meter Readings (Previous, Current, Multiplier) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lectura Anterior (kWh)
              </label>
              <input
                type="number"
                step="any"
                value={previousReading}
                onChange={(e) => handleReadingsChange(e.target.value, currentReading, meterMultiplier)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                placeholder="ej. 1420"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lectura Actual (kWh)
              </label>
              <input
                type="number"
                step="any"
                value={currentReading}
                onChange={(e) => handleReadingsChange(previousReading, e.target.value, meterMultiplier)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                placeholder="ej. 1705"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Multiplicador Medidor
              </label>
              <input
                type="number"
                step="any"
                value={meterMultiplier}
                onChange={(e) => {
                  const m = parseFloat(e.target.value) || 1;
                  setMeterMultiplier(m);
                  handleReadingsChange(previousReading, currentReading, m);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 4: Total kWh, Declared Total Amount, Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
            <div>
              <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Consumo Total Facturado (kWh) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={consumptionKwh}
                onChange={(e) => setConsumptionKwh(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-emerald-500/40 bg-white dark:bg-slate-900 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400"
                placeholder="285"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Total a Pagar Declarado *
              </label>
              <input
                type="number"
                step="any"
                required
                value={declaredTotal}
                onChange={(e) => setDeclaredTotal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold font-mono text-slate-900 dark:text-white"
                placeholder="28450"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tarifa de Verificación
              </label>
              <select
                value={tariffId}
                onChange={(e) => setTariffId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                {tariffs.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Detailed Concepts Breakdown (Auditing) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Desglose de Conceptos (Auditoría Aritmética)
              </span>
              <button
                type="button"
                onClick={addChargeItem}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir concepto</span>
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {charges.map((ch, idx) => (
                <div key={ch.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ch.name}
                    onChange={(e) => updateChargeItem(idx, 'name', e.target.value)}
                    placeholder="Nombre del concepto"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={ch.amount || ''}
                      onChange={(e) => updateChargeItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-right"
                      placeholder="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChargeItem(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                    title="Eliminar concepto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Live Arithmetic Comparison Banner */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-500">Suma de conceptos:</span>{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {currency}{auditResult.calculatedItemsTotal.toLocaleString()}
                </strong>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-500">Total declarado:</span>{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {currency}{(parseFloat(declaredTotal) || 0).toLocaleString()}
                </strong>
              </div>

              {auditResult.auditStatus === 'verified_exact' ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Suma exacta (0 diferencia)</span>
                </span>
              ) : auditResult.auditStatus === 'arithmetic_difference' ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Diferencia: {currency}{Math.abs(auditResult.arithmeticDifference)}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Validation Warnings / Errors */}
          {auditResult.warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold block">Observaciones detectadas:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {auditResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {auditResult.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 space-y-1">
              <span className="font-bold block">Errores a corregir:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {auditResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!auditResult.isValid}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
            >
              Guardar Factura
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
