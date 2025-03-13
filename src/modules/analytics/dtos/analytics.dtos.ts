// src/modules/analytics/dtos/analytics.dtos.ts

/**
 * DTO per i parametri di filtro delle statistiche
 */
export interface AnalyticsFilterDto {
    startDate?: Date;
    endDate?: Date;
    cryptoSymbol?: string;
    category?: string;
    method?: string; // Metodo di calcolo per profitto realizzato: 'fifo', 'lifo', 'average'
  }
  
  /**
   * DTO per la performance del portafoglio
   */
  export interface PortfolioPerformanceDto {
    totalInvestment: number;
    currentValue: number;
    totalProfitLoss: number;
    totalROI: number;
    assets: AssetPerformanceDto[];
    categories?: Record<string, CategoryPerformanceDto>;
  }
  
  export interface AssetPerformanceDto {
    symbol: string;
    name: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    investmentValue: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    category?: string;
  }
  
  export interface CategoryPerformanceDto {
    assets: AssetPerformanceDto[];
    investmentValue: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
  }
  
  /**
   * DTO per i profitti/perdite realizzati
   */
  export interface RealizedProfitLossDto {
    realizedProfitLoss: number;
    cryptoSummaries: CryptoRealizationSummaryDto[];
    methodDescription: string;
  }
  
  export interface CryptoRealizationSummaryDto {
    symbol: string;
    totalAcquired: number;
    totalSold: number;
    remainingQuantity: number;
    realizedProfitLoss: number;
    sells: SellTransactionSummaryDto[];
    acquisitions: AcquisitionSummaryDto[];
  }
  
  export interface SellTransactionSummaryDto {
    quantity: number;
    price: number;
    date: Date;
    profitLoss: number;
    method: string;
  }
  
  export interface AcquisitionSummaryDto {
    quantity: number;
    price: number;
    date: Date;
    type: string;
  }
  
  /**
   * DTO per le statistiche del portafoglio
   */
  export interface PortfolioStatsDto {
    assetCount: number;
    transactionCount: number;
    firstTransactionDate: Date | null;
    lastTransactionDate: Date | null;
    totalValue: number;
    categories: Record<string, CategoryStatsDto>;
    distributionBySymbol: Record<string, number>;
    topPerformers: AssetPerformanceDto[];
    worstPerformers: AssetPerformanceDto[];
  }
  
  export interface CategoryStatsDto {
    assetCount: number;
    symbols: string[];
  }
  
  /**
   * DTO per la performance storica
   */
  export interface HistoricalPerformanceDto {
    timeline: PortfolioSnapshotDto[];
    totalInvestment: number;
    currentValue: number;
    performancePercentage: number;
  }
  
  export interface PortfolioSnapshotDto {
    date: Date;
    totalInvestment: number;
    estimatedValue: number;
    transactions?: number;
  }
  
  /**
   * DTO per l'analisi degli investimenti per metodo di pagamento
   */
  export interface InvestmentByPaymentMethodDto {
    byMethod: Record<string, PaymentMethodStatsDto>;
    percentageByMethod: Record<string, number>;
    percentageByMethodAndCurrency: Record<string, Record<string, number>>;
    totalInvestment: number;
    transactionCount: number;
    paymentMethods: PaymentMethodInfoDto[];
  }
  
  export interface PaymentMethodStatsDto {
    totalAmount: number;
    transactionCount: number;
    firstDate: Date | null;
    lastDate: Date | null;
    currencies: Record<string, CurrencyStatsDto>;
  }
  
  export interface CurrencyStatsDto {
    totalAmount: number;
    transactionCount: number;
  }
  
  export interface PaymentMethodInfoDto {
    id: string;
    name: string;
  }