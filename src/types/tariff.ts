export type TariffCalculationMethod = 'flat' | 'tiered_marginal' | 'tiered_integral' | 'time_of_use';

export interface TariffTier {
  id: string;
  name: string;
  fromKwh: number;
  toKwh: number | null; // null means unbounded
  pricePerKwh: number; // in currency units (e.g., CRC or USD)
}

export interface TariffTimeOfUseBand {
  id: string;
  name: 'valle' | 'llano' | 'punta';
  label: string;
  hours: string; // e.g. "20:00-06:00"
  pricePerKwh: number;
}

export interface TariffAdditionalConcept {
  id: string;
  name: string;
  conceptType: 'percentage' | 'fixed_charge' | 'per_kwh';
  rate: number; // percentage (e.g. 13 for 13% IVA) or fixed monetary amount or per-kWh rate
  appliedTo: 'energy_subtotal' | 'fixed_charge' | 'accumulated_subtotal' | 'total' | 'consumption_kwh';
  description?: string;
  isTax?: boolean;
}

export interface TariffComponent {
  fixedCharge: number; // monthly fixed charge
  tiers?: TariffTier[];
  touBands?: TariffTimeOfUseBand[];
  flatRate?: number;
  additionalConcepts: TariffAdditionalConcept[];
}

export interface Tariff {
  id: string;
  country: string;
  region?: string;
  distributor: string; // e.g. 'ICE', 'CNFL', 'ESPH', 'JASEC', 'COOPELESCA', 'COOPEGUANACASTE', 'COOPESANTOS', 'COOPEALFARORUIZ'
  customerCategory: 'residential' | 'commercial' | 'industrial' | 'preferential';
  name: string;
  currency: string;
  energyUnit: string; // 'kWh'
  calculationMethod: TariffCalculationMethod;
  validFrom: string; // ISO date YYYY-MM-DD
  validUntil?: string; // ISO date or undefined if current
  sourceName: string;
  sourceUrl?: string;
  verifiedAt?: string;
  validationStatus: 'verified_official' | 'custom_estimated' | 'historical';
  notes?: string;
  components: TariffComponent;
}

export interface TariffCalculationResult {
  energyCost: number;
  fixedCharge: number;
  additionalChargesBreakdown: Array<{
    name: string;
    amount: number;
    description: string;
  }>;
  totalAdditionalCharges: number;
  taxesBreakdown: Array<{
    name: string;
    amount: number;
    description: string;
  }>;
  totalTaxes: number;
  totalCalculated: number;
  effectiveAveragePricePerKwh: number;
  tierDetails?: Array<{
    tierName: string;
    kwhInTier: number;
    rate: number;
    subtotal: number;
  }>;
  formulaSteps: string[];
}
