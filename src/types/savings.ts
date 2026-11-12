export type ActionDifficulty = 'Baja' | 'Media' | 'Alta';

export interface SavingsActionItem {
  id: string;
  householdId: string;
  title: string;
  applianceId?: string;
  applianceName?: string;
  description: string;
  potentialMonthlyKwhSaved: number;
  potentialMonthlyCostSaved: number;
  potentialAnnualCostSaved: number;
  implementationCost: number; // 0 if habit change
  difficulty: ActionDifficulty;
  paybackMonths?: number;
  confidence: 'Alta' | 'Media' | 'Baja';
  steps: string[];
  assumptions: string[];
  status: 'sugerida' | 'en_progreso' | 'completada' | 'descartada';
  completedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface EnergyInvestment {
  id: string;
  householdId: string;
  title: string;
  category: 'aparato_eficiente' | 'iluminacion_led' | 'aislamiento' | 'climatizacion' | 'solar' | 'otro';
  purchasePrice: number;
  purchaseDate: string;
  estimatedAnnualSavingsCost: number;
  warrantyYears?: number;
  notes?: string;
  createdAt: string;
}
