// src/modules/realizedprofit/repositories/realizedprofit.repository.ts
import { BaseRepository } from '../../../shared/repositories/baseRepository';
import { RealizedProfit, IRealizedProfit } from '../models/realizedProfit.model';
import { RealizedProfitFilterDto } from '../dtos/realized-profit.dtos';
import { Logger } from '../../../shared/utils/logger';

export class RealizedProfitRepository extends BaseRepository<IRealizedProfit> {
  constructor() {
    super(RealizedProfit);
  }

  /**
   * Trova tutti i profitti realizzati di un utente con filtri opzionali
   */
  async findAllByUser(userId: string, filters?: RealizedProfitFilterDto): Promise<IRealizedProfit[]> {
    try {
      const query: any = { user: userId };
      
      if (filters) {
        // Applica i filtri se presenti
        if (filters.cryptoSymbol) {
          query.sourceCryptoSymbol = filters.cryptoSymbol.toUpperCase();
        }
        
        // Filtro per data
        if (filters.startDate || filters.endDate) {
          query.date = {};
          
          if (filters.startDate) {
            query.date.$gte = filters.startDate;
          }
          
          if (filters.endDate) {
            query.date.$lte = filters.endDate;
          }
        }
        
        // Filtro per profitti o perdite
        if (filters.isProfit !== undefined) {
          query.realizedProfitLoss = filters.isProfit ? { $gt: 0 } : { $lte: 0 };
        }
        
        // Filtro per valuta target
        if (filters.targetCurrency) {
          query.targetCurrency = filters.targetCurrency.toUpperCase();
        }
        
        // Filtro per categoria
        if (filters.category) {
          query.category = filters.category;
        }
      }
      
      return RealizedProfit.find(query).sort({ date: -1 }).exec();
    } catch (error) {
      Logger.error('Errore nel repository durante il recupero dei profitti realizzati:', error);
      throw error;
    }
  }

  /**
   * Trova i profitti realizzati per uno specifico simbolo di criptovaluta
   */
  async findByCryptoSymbol(userId: string, cryptoSymbol: string): Promise<IRealizedProfit[]> {
    try {
      return RealizedProfit.find({
        user: userId,
        sourceCryptoSymbol: cryptoSymbol.toUpperCase()
      }).sort({ date: -1 }).exec();
    } catch (error) {
      Logger.error(`Errore nel repository durante il recupero dei profitti per ${cryptoSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Raggruppa i profitti realizzati per periodo
   */
  async groupByPeriod(userId: string, groupBy: string = 'month'): Promise<any[]> {
    try {
      let groupFormat: string;
      
      // Imposta il formato di raggruppamento
      switch (groupBy) {
        case 'day':
          groupFormat = '%Y-%m-%d';
          break;
        case 'week':
          groupFormat = '%Y-W%U'; // Anno-Settimana
          break;
        case 'month':
          groupFormat = '%Y-%m';
          break;
        case 'year':
          groupFormat = '%Y';
          break;
        default:
          groupFormat = '%Y-%m';
      }
      
      // Esegui l'aggregazione
      return RealizedProfit.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$date' } },
            totalProfit: { $sum: '$realizedProfitLoss' },
            totalCost: { $sum: '$costBasis' },
            totalProceeds: { $sum: '$proceedsAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (error) {
      Logger.error(`Errore nel repository durante il raggruppamento dei profitti per ${groupBy}:`, error);
      throw error;
    }
  }

  /**
   * Calcola il totale dei profitti realizzati
   */
  async calculateTotals(userId: string, filters?: RealizedProfitFilterDto): Promise<{
    totalRealizedProfit: number;
    totalCostBasis: number;
    totalProceeds: number;
    tradesCount: number;
    profitableTradesCount: number;
    unprofitableTradesCount: number;
  }> {
    try {
      const profits = await this.findAllByUser(userId, filters);
      
      let totalRealizedProfit = 0;
      let totalCostBasis = 0;
      let totalProceeds = 0;
      let profitableTradesCount = 0;
      let unprofitableTradesCount = 0;
      
      for (const profit of profits) {
        totalRealizedProfit += profit.realizedProfitLoss;
        totalCostBasis += profit.costBasis;
        totalProceeds += profit.proceedsAmount;
        
        if (profit.realizedProfitLoss > 0) {
          profitableTradesCount++;
        } else {
          unprofitableTradesCount++;
        }
      }
      
      return {
        totalRealizedProfit,
        totalCostBasis,
        totalProceeds,
        tradesCount: profits.length,
        profitableTradesCount,
        unprofitableTradesCount
      };
    } catch (error) {
      Logger.error('Errore nel repository durante il calcolo dei totali:', error);
      throw error;
    }
  }

  /**
   * Raggruppa i profitti realizzati per criptovaluta
   */
  async groupByCrypto(userId: string, filters?: RealizedProfitFilterDto): Promise<Record<string, {
    totalProfit: number;
    totalCost: number;
    totalProceeds: number;
    profitableCount: number;
    unprofitableCount: number;
    totalQuantitySold: number;
  }>> {
    try {
      const profits = await this.findAllByUser(userId, filters);
      const cryptoTotals: Record<string, any> = {};
      
      for (const profit of profits) {
        const symbol = profit.sourceCryptoSymbol;
        
        if (!cryptoTotals[symbol]) {
          cryptoTotals[symbol] = {
            totalProfit: 0,
            totalCost: 0,
            totalProceeds: 0,
            profitableCount: 0,
            unprofitableCount: 0,
            totalQuantitySold: 0
          };
        }
        
        cryptoTotals[symbol].totalProfit += profit.realizedProfitLoss;
        cryptoTotals[symbol].totalCost += profit.costBasis;
        cryptoTotals[symbol].totalProceeds += profit.proceedsAmount;
        cryptoTotals[symbol].totalQuantitySold += profit.soldQuantity;
        
        if (profit.realizedProfitLoss > 0) {
          cryptoTotals[symbol].profitableCount++;
        } else {
          cryptoTotals[symbol].unprofitableCount++;
        }
      }
      
      return cryptoTotals;
    } catch (error) {
      Logger.error('Errore nel repository durante il raggruppamento per criptovaluta:', error);
      throw error;
    }
  }
}