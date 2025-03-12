// src/modules/portfolio/dtos/portfolio-value.dto.ts
export interface AssetValueDto {
    cryptoSymbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    currentValue: number;
    investmentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    category?: string;
    type?: string;
    cryptoInfo?: {
      name: string;
      lastUpdated: Date;
    } | null;
  }
  
  export interface PortfolioValueDto {
    totalValue: number;
    totalInvestment: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    assets: AssetValueDto[];
  }
  
  // src/modules/portfolio/dtos/update-portfolio.dto.ts
  export interface UpdatePortfolioAssetDto {
    cryptoSymbol: string;
    quantity?: number;
    averagePrice?: number;
    category?: string;
    type?: string;
  }
  
  export interface UpdatePortfolioDto {
    assets?: UpdatePortfolioAssetDto[];
  }
  
  // src/modules/portfolio/dtos/portfolio-by-category.dto.ts
  export interface CategoryDto {
    name: string;
    assets: AssetValueDto[];
    totalValue: number;
    totalInvestment: number;
    totalProfitLoss: number;
    profitLossPercentage: number;
    portfolioPercentage: number;
  }
  
  export interface PortfolioByCategoryDto {
    categories: CategoryDto[];
    totalValue: number;
    totalInvestment: number;
    totalProfitLoss: number;
  }
  
  // src/modules/portfolio/dtos/historical-performance.dto.ts
  export interface PortfolioSnapshotDto {
    date: Date;
    totalInvestment: number;
    estimatedValue: number;
    transactions?: number; // Numero di transazioni fino a quella data
  }
  
  export interface HistoricalPerformanceDto {
    timeline: PortfolioSnapshotDto[];
    totalInvestment: number;
    currentValue: number;
    performancePercentage: number;
  }