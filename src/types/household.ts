export interface Household {
  id: string;
  name: string;
  country: string;
  region?: string;
  city?: string;
  distributor?: string;
  currency: string;
  currencySymbol: string;
  currencyDecimals: number;
  timezone: string;
  installationType: 'home' | 'apartment' | 'detached_house' | 'office' | 'small_business' | 'other';
  occupants?: number;
  areaSquareMeters?: number;
  constructionType?: string;
  voltageSystem?: string;
  defaultTariffId?: string;
  address?: string;
  usageCategory: 'residential' | 'commercial';
  createdAt: string;
  updatedAt: string;
}

export type OriginLabel = 'MEDIDO' | 'DECLARADO' | 'CALCULADO' | 'ESTIMADO' | 'PREDICHO' | 'NO_VERIFICADO';
