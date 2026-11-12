import { OriginLabel } from './household';

export type ApplianceCategory = 
  | 'climatizacion'
  | 'cocina'
  | 'lavanderia'
  | 'agua_caliente'
  | 'entretenimiento'
  | 'informatica'
  | 'iluminacion'
  | 'otros';

export interface Appliance {
  id: string;
  householdId: string;
  name: string;
  category: ApplianceCategory;
  brand?: string;
  model?: string;
  quantity: number;
  
  // Power specs
  powerWatts?: number;
  standbyWatts?: number;
  dutyCycle?: number; // 0 to 1.0 (e.g. 0.35 for refrigerator compressor cycling)
  
  // Usage
  usageHoursPerDay?: number;
  usageDaysPerMonth?: number;
  
  // Cycle based alternative (washers, dryers, dishwashers)
  isCycleBased?: boolean;
  energyPerCycleKwh?: number;
  cyclesPerMonth?: number;
  
  // Calculations cached
  calculatedMonthlyKwh: number;
  calculatedMonthlyCost: number;
  calculatedAnnualCost: number;
  
  // Metadata
  dataOrigin: OriginLabel;
  confidence: 'Alta' | 'Media' | 'Baja';
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplianceComparison {
  applianceA: Appliance;
  applianceB: Appliance;
  monthlyDeltaKwh: number;
  annualDeltaKwh: number;
  monthlySavingsCost: number;
  annualSavingsCost: number;
  replacementCost?: number;
  paybackMonths?: number;
}
