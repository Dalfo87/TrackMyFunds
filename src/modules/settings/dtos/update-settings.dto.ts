// src/modules/settings/dtos/update-settings.dto.ts
export interface UpdateSettingsDto {
    defaultCurrency?: string;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    dataRefreshRate?: number;
    autoRefresh?: boolean;
    privacyMode?: boolean;
    notifications?: {
      priceAlerts?: boolean;
      portfolioSummary?: boolean;
      dailyReport?: boolean;
      frequency?: 'daily' | 'weekly' | 'monthly' | 'never';
    };
  }
  
  // src/modules/settings/dtos/api-key.dto.ts
  export interface ApiKeyDto {
    apiKey: string;
  }
  
  // src/modules/settings/dtos/category.dto.ts
  export interface CategoryDto {
    category: string;
  }