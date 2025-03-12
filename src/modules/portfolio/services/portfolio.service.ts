// src/modules/portfolio/services/portfolio.service.ts
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { IPortfolio } from '../models/portfolio.model';
import { PortfolioValueDto, PortfolioByCategoryDto, HistoricalPerformanceDto, UpdatePortfolioDto } from '../dtos/portfolio-dtos';
import { ApiError } from '../../../shared/utils/errorHandler';
import { Logger } from '../../../shared/utils/logger';
import { Transaction } from '../../../modules/transactions/models/transaction.model';
import { Crypto } from '../../../modules/crypto/models/crypto.model';
import { TransactionType } from '../../../shared/types/transaction.types';

export class PortfolioService {
  constructor(private portfolioRepository: PortfolioRepository) {}

  /**
   * Recupera il portafoglio completo di un utente
   */
  async getPortfolio(userId: string): Promise<IPortfolio> {
    try {
      return await this.portfolioRepository.findOrCreateByUser(userId);
    } catch (error) {
      Logger.error(`Errore nel recupero del portafoglio per l'utente ${userId}:`, error);
      throw new ApiError(500, 'Errore nel recupero del portafoglio');
    }
  }

  /**
   * Aggiorna il portafoglio di un utente
   */
  async updatePortfolio(userId: string, updateData: UpdatePortfolioDto): Promise<IPortfolio> {
    try {
      const portfolio = await this.portfolioRepository.updatePortfolio(userId, updateData);
      
      if (!portfolio) {
        throw new ApiError(404, 'Portafoglio non trovato');
      }
      
      return portfolio;
    } catch (error) {
      Logger.error(`Errore nell'aggiornamento del portafoglio per l'utente ${userId}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nell\'aggiornamento del portafoglio');
    }
  }

  /**
   * Recupera il valore attuale del portafoglio con prezzi aggiornati
   */
  async getPortfolioValue(userId: string): Promise<PortfolioValueDto> {
    try {
      const portfolio = await this.portfolioRepository.findOrCreateByUser(userId);
      
      if (portfolio.assets.length === 0) {
        return { 
          totalValue: 0, 
          assets: [], 
          totalInvestment: 0,
          totalProfitLoss: 0,
          totalProfitLossPercentage: 0
        };
      }
      
      // Ottieni i prezzi attuali delle criptovalute e calcola i valori correnti
      const assets = await Promise.all(portfolio.assets.map(async (asset) => {
        const normalizedSymbol = asset.cryptoSymbol.trim().toUpperCase();
        const crypto = await Crypto.findOne({ symbol: normalizedSymbol });
        
        const currentPrice = crypto ? crypto.currentPrice : 0;
        const currentValue = asset.quantity * currentPrice;
        const investmentValue = asset.quantity * asset.averagePrice;
        const profitLoss = currentValue - investmentValue;
        const profitLossPercentage = investmentValue > 0 
          ? (profitLoss / investmentValue) * 100 
          : 0;
        
        return {
          cryptoSymbol: normalizedSymbol,
          quantity: asset.quantity,
          averagePrice: asset.averagePrice,
          currentPrice,
          currentValue,
          investmentValue,
          profitLoss,
          profitLossPercentage,
          category: asset.category,
          type: asset.type,
          cryptoInfo: crypto ? {
            name: crypto.name,
            lastUpdated: crypto.lastUpdated
          } : null
        };
      }));
      
      // Filtra solo asset con saldo positivo per la visualizzazione
      const positiveAssets = assets.filter(asset => asset.quantity > 0);
      
      // Calcola il valore totale e altre statistiche
      const totalValue = positiveAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
      const totalInvestment = positiveAssets.reduce((sum, asset) => sum + asset.investmentValue, 0);
      const totalProfitLoss = totalValue - totalInvestment;
      const totalProfitLossPercentage = totalInvestment > 0 
        ? (totalProfitLoss / totalInvestment) * 100 
        : 0;
      
      return {
        totalValue,
        totalInvestment,
        totalProfitLoss,
        totalProfitLossPercentage,
        assets: positiveAssets
      };
    } catch (error) {
      Logger.error(`Errore nel calcolo del valore del portafoglio per l'utente ${userId}:`, error);
      throw new ApiError(500, 'Errore nel calcolo del valore del portafoglio');
    }
  }

  /**
   * Raggruppa gli asset del portafoglio per categoria
   */
  async getPortfolioByCategory(userId: string): Promise<PortfolioByCategoryDto> {
    try {
      // Ottieni i valori attuali degli asset
      const portfolioWithValues = await this.getPortfolioValue(userId);
      
      if (portfolioWithValues.assets.length === 0) {
        return { 
          categories: [], 
          totalValue: 0, 
          totalInvestment: 0,
          totalProfitLoss: 0
        };
      }
      
      // Raggruppa gli asset per categoria
      const categorizedAssets = portfolioWithValues.assets.reduce((result: any, asset: any) => {
        const category = asset.category || 'Non categorizzato';
        
        if (!result[category]) {
          result[category] = {
            assets: [],
            totalValue: 0,
            totalInvestment: 0,
            totalProfitLoss: 0
          };
        }
        
        result[category].assets.push(asset);
        result[category].totalValue += asset.currentValue;
        result[category].totalInvestment += asset.investmentValue;
        result[category].totalProfitLoss += asset.profitLoss;
        
        return result;
      }, {});
      
      // Calcola le percentuali per categoria
      const categories = Object.entries(categorizedAssets).map(([name, data]: [string, any]) => ({
        name,
        assets: data.assets,
        totalValue: data.totalValue,
        totalInvestment: data.totalInvestment,
        totalProfitLoss: data.totalProfitLoss,
        profitLossPercentage: data.totalInvestment > 0 
          ? (data.totalProfitLoss / data.totalInvestment) * 100 
          : 0,
        portfolioPercentage: portfolioWithValues.totalValue > 0 
          ? (data.totalValue / portfolioWithValues.totalValue) * 100 
          : 0
      }));
      
      return { 
        categories,
        totalValue: portfolioWithValues.totalValue,
        totalInvestment: portfolioWithValues.totalInvestment,
        totalProfitLoss: portfolioWithValues.totalProfitLoss
      };
    } catch (error) {
      Logger.error(`Errore nel raggruppamento del portafoglio per categoria per l'utente ${userId}:`, error);
      throw new ApiError(500, 'Errore nel raggruppamento del portafoglio per categoria');
    }
  }

  /**
   * Ottiene le performance storiche del portafoglio
   */
  async getHistoricalPerformance(userId: string, period: string = '1y'): Promise<HistoricalPerformanceDto> {
    try {
      // Determina la data di inizio in base al periodo richiesto
      const startDate = new Date();
      switch (period) {
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          // Non imposta una data di inizio, include tutto
          break;
        default:
          startDate.setFullYear(startDate.getFullYear() - 1); // Default: 1 anno
      }
      
      // Recupera tutte le transazioni nel periodo
      const transactions = await Transaction.find({
        user: userId, 
        date: { $gte: period === 'all' ? new Date(0) : startDate }
      }).sort({ date: 1 });
      
      if (transactions.length === 0) {
        return {
          timeline: [],
          totalInvestment: 0,
          currentValue: 0,
          performancePercentage: 0
        };
      }
      
      // Ottieni il valore attuale del portafoglio
      const currentPortfolio = await this.getPortfolioValue(userId);
      
      // Ordina le transazioni per data
      transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Per ogni data di transazione, calcola lo stato del portafoglio a quel punto
      const timeline: any[] = [];
      const transactionDates = [...new Set(transactions.map(tx => tx.date.toISOString().split('T')[0]))];
      
      // Aggiunge anche la data corrente
      const today = new Date().toISOString().split('T')[0];
      if (!transactionDates.includes(today)) {
        transactionDates.push(today);
      }
      
      // Calcola snapshot a intervalli regolari (per evitare troppi punti)
      const maxDataPoints = 30; // Numero massimo di punti da visualizzare
      const step = Math.max(1, Math.floor(transactionDates.length / maxDataPoints));
      
      let lastInvestment = 0;
      let lastValue = 0;
      
      // Aggiungi solo i punti a intervalli regolari
      for (let i = 0; i < transactionDates.length; i += step) {
        const dateStr = transactionDates[i];
        const date = new Date(dateStr);
        
        // Simula il valore del portafoglio a questa data
        // Poiché non abbiamo i prezzi storici reali, facciamo una stima lineare
        const progress = i / transactionDates.length;
        const estimatedValue = lastValue + progress * (currentPortfolio.totalValue - lastValue);
        const estimatedInvestment = lastInvestment + progress * (currentPortfolio.totalInvestment - lastInvestment);
        
        timeline.push({
          date,
          totalInvestment: estimatedInvestment,
          estimatedValue: estimatedValue,
          transactions: transactions.filter(tx => tx.date <= date).length
        });
        
        lastValue = estimatedValue;
        lastInvestment = estimatedInvestment;
      }
      
      // Assicurati di includere sempre l'ultimo punto (data odierna)
      if (timeline.length > 0 && timeline[timeline.length - 1].date.toISOString() !== new Date().toISOString()) {
        timeline.push({
          date: new Date(),
          totalInvestment: currentPortfolio.totalInvestment,
          estimatedValue: currentPortfolio.totalValue,
          transactions: transactions.length
        });
      }
      
      return {
        timeline,
        totalInvestment: currentPortfolio.totalInvestment,
        currentValue: currentPortfolio.totalValue,
        performancePercentage: currentPortfolio.totalProfitLossPercentage
      };
    } catch (error) {
      Logger.error(`Errore nel calcolo della performance storica per l'utente ${userId}:`, error);
      throw new ApiError(500, 'Errore nel calcolo della performance storica');
    }
  }

  /**
   * Aggiorna la categoria di un asset
   */
  async updateAssetCategory(userId: string, cryptoSymbol: string, category: string): Promise<IPortfolio> {
    try {
      const portfolio = await this.portfolioRepository.updateAssetCategory(userId, cryptoSymbol, category);
      
      if (!portfolio) {
        throw new ApiError(404, 'Portafoglio o asset non trovato');
      }
      
      return portfolio;
    } catch (error) {
      Logger.error(`Errore nell'aggiornamento della categoria dell'asset ${cryptoSymbol}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nell\'aggiornamento della categoria dell\'asset');
    }
  }

  /**
   * Calcola la distribuzione degli asset per tipo (crypto, stablecoin, ecc.)
   */
  async getAssetDistributionByType(userId: string): Promise<any> {
    try {
      const portfolioValue = await this.getPortfolioValue(userId);
      
      if (portfolioValue.assets.length === 0) {
        return {
          types: [],
          totalValue: 0
        };
      }
      
      // Raggruppa gli asset per tipo
      const typeDistribution = portfolioValue.assets.reduce((result: any, asset: any) => {
        const type = asset.type || 'crypto';
        
        if (!result[type]) {
          result[type] = {
            value: 0,
            assets: []
          };
        }
        
        result[type].value += asset.currentValue;
        result[type].assets.push(asset);
        
        return result;
      }, {});
      
      // Calcola le percentuali per tipo
      const types = Object.entries(typeDistribution).map(([name, data]: [string, any]) => ({
        type: name,
        value: data.value,
        percentage: portfolioValue.totalValue > 0 
          ? (data.value / portfolioValue.totalValue) * 100 
          : 0,
        assets: data.assets
      }));
      
      return {
        types,
        totalValue: portfolioValue.totalValue
      };
    } catch (error) {
      Logger.error(`Errore nel calcolo della distribuzione degli asset per tipo per l'utente ${userId}:`, error);
      throw new ApiError(500, 'Errore nel calcolo della distribuzione degli asset per tipo');
    }
  }

  /**
   * Ottiene statistiche di base sul portafoglio
   */
  async getPortfolioStats(userId: string): Promise<any> {
    try {
      const portfolioValue = await this.getPortfolioValue(userId);
      const categorizedPortfolio = await this.getPortfolioByCategory(userId);
      
      // Ottieni le transazioni recenti
      const recentTransactions = await Transaction.find({ 
        user: userId,
        isAutoGenerated: { $ne: true } 
      })
      .sort({ date: -1 })
      .limit(5);
      
      // Ottieni le acquisizioni totali per tipo di transazione
      const acquisitionsByType = await Transaction.aggregate([
        { $match: { 
          user: userId, 
          type: { $in: [TransactionType.BUY, TransactionType.AIRDROP, TransactionType.FARMING] }
        }},
        { $group: {
          _id: "$type",
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }}
      ]);
      
      // Ottieni le vendite totali
      const sales = await Transaction.aggregate([
        { $match: { 
          user: userId, 
          type: TransactionType.SELL
        }},
        { $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }}
      ]);
      
      // Trova gli asset con il miglior/peggior rendimento
      const sortedAssets = [...portfolioValue.assets].sort((a, b) => 
        b.profitLossPercentage - a.profitLossPercentage
      );
      
      const topPerformers = sortedAssets.slice(0, 3);
      const worstPerformers = sortedAssets.slice(-3).reverse();
      
      // Calcola alcune statistiche aggiuntive
      const totalAssets = portfolioValue.assets.length;
      const positivePerformanceCount = portfolioValue.assets.filter(a => a.profitLoss > 0).length;
      const negativePerformanceCount = portfolioValue.assets.filter(a => a.profitLoss < 0).length;
      
      const averageProfitLossPercentage = totalAssets > 0
        ? portfolioValue.assets.reduce((sum, a) => sum + a.profitLossPercentage, 0) / totalAssets
        : 0;
      
      return {
        summary: {
          totalValue: portfolioValue.totalValue,
          totalInvestment: portfolioValue.totalInvestment,
          totalProfitLoss: portfolioValue.totalProfitLoss,
          totalProfitLossPercentage: portfolioValue.totalProfitLossPercentage,
          assetCount: totalAssets,
          categoryCount: categorizedPortfolio.categories.length,
          positivePerformanceCount,
          negativePerformanceCount,
          averageProfitLossPercentage
        },
        topPerformers,
        worstPerformers,
        categorizedPortfolio: categorizedPortfolio.categories,
        acquisitionsByType,
        sales: sales[0] || { totalQuantity: 0, totalAmount: 0, count: 0 },
        recentTransactions
      };
    } catch (error) {
      Logger.error(`Errore nel recupero delle statistiche del portafoglio per l'utente ${userId}:`, error);
      throw new ApiError(500, 'Errore nel recupero delle statistiche del portafoglio');
    }
  }
}