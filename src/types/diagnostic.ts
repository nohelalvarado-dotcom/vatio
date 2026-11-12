export type DiagnosticSeverity = 'alerta' | 'advertencia' | 'informativa';
export type DiagnosticCategory = 
  | 'consumo_anormal'
  | 'error_aritmetico'
  | 'desviacion_aparatos'
  | 'cambio_tarifario'
  | 'lectura_incoherente'
  | 'periodo_atipico';

export interface DiagnosticItem {
  id: string;
  householdId: string;
  title: string;
  date: string;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  description: string;
  numericalEvidence: string;
  calculationExplanation: string;
  confidence: 'Alta' | 'Media' | 'Baja';
  confidenceReason: string;
  recommendation: string;
  status: 'pendiente' | 'revisado' | 'descartado';
  createdAt: string;
}

export interface ConsumptionForecast {
  methodUsed: 'promedio_movil' | 'tendencia_lineal' | 'tasa_diaria';
  forecastPeriodDays: number;
  projectedKwh: number;
  projectedCost: number;
  confidenceInterval: {
    minKwh: number;
    maxKwh: number;
    minCost: number;
    maxCost: number;
  };
  explanation: string;
  confidence: 'Alta' | 'Media' | 'Baja';
  historicalPeriodsAnalyzed: number;
}
