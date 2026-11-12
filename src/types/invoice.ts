import { OriginLabel } from './household';

export interface InvoiceItemCharge {
  id: string;
  name: string;
  category: 'energy' | 'fixed_charge' | 'tax' | 'street_lighting' | 'fire_department' | 'adjustment' | 'other';
  amount: number;
  origin: OriginLabel;
  description?: string;
}

export type InvoiceAuditStatus = 
  | 'verified_exact' 
  | 'arithmetic_difference' 
  | 'reading_inconsistent' 
  | 'incomplete_data' 
  | 'unverified';

export interface Invoice {
  id: string;
  householdId: string;
  distributor: string;
  invoiceNumber?: string;
  issueDate?: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  billingDays: number;
  
  // Readings
  previousReading?: number;
  currentReading?: number;
  meterMultiplier?: number;
  
  // Consumption & Totals
  consumptionKwh: number;
  currency: string;
  declaredTotal: number; // in normal currency units
  calculatedTotal?: number; // computed from items
  
  // Breakdown
  charges: InvoiceItemCharge[];
  
  // Tariff engine link
  tariffId?: string;
  tariffComparisonTotal?: number;
  tariffDifference?: number;
  
  // Audit findings
  auditStatus: InvoiceAuditStatus;
  auditExplanation?: string;
  readingDerivedKwh?: number;
  arithmeticDifference?: number;
  
  // Source metadata
  dataOrigin: OriginLabel;
  notes?: string;
  imageUri?: string; // Data URL for attached bill photo/document
  rawOcrText?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceComparison {
  invoiceA: Invoice;
  invoiceB: Invoice;
  deltaKwh: number;
  deltaPercentKwh: number;
  deltaCost: number;
  deltaPercentCost: number;
  deltaDays: number;
  avgDailyKwhA: number;
  avgDailyKwhB: number;
  deltaAvgDailyKwh: number;
  avgCostPerKwhA: number;
  avgCostPerKwhB: number;
  deltaCostPerKwh: number;
  tariffChanged: boolean;
  possibleCauses: string[];
}
