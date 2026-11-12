export interface ScenarioApplianceModification {
  applianceId: string;
  name: string;
  originalHours: number;
  simulatedHours: number;
  originalWatts?: number;
  simulatedWatts?: number;
  isReplaced?: boolean;
  replacementName?: string;
  replacementCost?: number;
}

export interface Scenario {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  modifications: ScenarioApplianceModification[];
  baselineMonthlyKwh: number;
  simulatedMonthlyKwh: number;
  deltaMonthlyKwh: number;
  baselineMonthlyCost: number;
  simulatedMonthlyCost: number;
  monthlySavingsCost: number;
  annualSavingsCost: number;
  assumptions: string[];
  totalInvestmentCost?: number;
  paybackMonths?: number;
  createdAt: string;
}
