export interface UpdateSettingsDto {
  defaultCurrency?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  dataRefreshRate?: number;
  autoRefresh?: boolean;
  privacyMode?: boolean;
  notifications?: {
    priceAlerts: boolean; // Rimosso il '?' per renderlo obbligatorio
    portfolioSummary: boolean;
    dailyReport: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
}

export interface ApiKeyDto {
  apiKey: string;
}

export interface CategoryDto {
  category: string;
}