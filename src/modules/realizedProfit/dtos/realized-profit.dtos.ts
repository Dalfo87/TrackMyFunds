// src/modules/realizedprofit/dtos/realized-profit.dtos.ts

export interface RealizedProfitFilterDto {
    cryptoSymbol?: string;
    startDate?: Date;
    endDate?: Date;
    isProfit?: boolean;
    targetCurrency?: string;
    category?: string;
  }
  
  export interface RealizedProfitSummaryDto {
    totalRealizedProfit: number;
    totalCostBasis: number;
    totalProceeds: number;
    totalProfitPercentage: number;
    tradesCount: number;
    profitableTradesCount: number;
    unprofitableTradesCount: number;
    profitableTradesPercentage: number;
    cryptoBreakdown: Record<string, CryptoRealizationDto>;
  }
  
  export interface CryptoRealizationDto {
    totalProfit: number;
    totalCost: number;
    totalProceeds: number;
    profitableCount: number;
    unprofitableCount: number;
    avgProfitPercentage: number;
    totalQuantitySold?: number;
  }
  
  export interface PeriodRealizationDto {
    period: string;
    totalProfit: number;
    totalCost: number;
    totalProceeds: number;
    profitPercentage: number;
    tradesCount: number;
  }