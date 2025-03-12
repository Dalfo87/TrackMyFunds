// src/services/realizedProfitService.ts

import RealizedProfit, { IRealizedProfit } from '../models/RealizedProfit';
import logger from '../utils/logger';

/**
 * Classe di servizio per la gestione dei profitti e perdite realizzati
 */
class RealizedProfitService {
  /**
   * Recupera tutti i profitti/perdite realizzati di un utente
   * @param user - ID dell'utente
   * @param filter - Filtri opzionali (periodo, crypto, ecc)
   * @returns Lista di profitti/perdite realizzati
   */
  static async getAllRealizedProfits(user: string, filter: any = {}): Promise<IRealizedProfit[]> {
    try {
      const query = { user, ...filter };
      return await RealizedProfit.find(query).sort({ date: -1 });
    } catch (error) {
      logger.error('Errore nel recupero dei profitti/perdite realizzati:', error);
      throw error;
    }
  }

  /**
   * Recupera i profitti/perdite realizzati di un utente per un simbolo specifico
   * @param user - ID dell'utente
   * @param cryptoSymbol - Simbolo della criptovaluta
   * @returns Lista di profitti/perdite realizzati per quella crypto
   */
  static async getRealizedProfitsByCrypto(user: string, cryptoSymbol: string): Promise<IRealizedProfit[]> {
    try {
      return await RealizedProfit.find({ 
        user, 
        sourceCryptoSymbol: cryptoSymbol.toUpperCase() 
      }).sort({ date: -1 });
    } catch (error) {
      logger.error(`Errore nel recupero dei profitti/perdite per ${cryptoSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Calcola il totale dei profitti/perdite realizzati
   * @param user - ID dell'utente
   * @param filter - Filtri opzionali (periodo, crypto, ecc)
   * @returns Oggetto con totali e statistiche
   */
  static async calculateTotalRealizedProfits(user: string, filter: any = {}): Promise<any> {
    try {
      const query = { user, ...filter };
      
      // Recupera tutti i record che soddisfano i criteri
      const profits = await RealizedProfit.find(query);
      
      // Calcola i totali
      let totalRealizedProfit = 0;
      let totalCostBasis = 0;
      let totalProceeds = 0;
      let profitableTradesCount = 0;
      let unprofitableTradesCount = 0;
      
      // Mappa per tenere traccia dei profitti per crypto
      const profitsByCrypto: Record<string, {
        totalProfit: number;
        totalCost: number;
        totalProceeds: number;
        profitableCount: number;
        unprofitableCount: number;
        avgProfitPercentage: number;
      }> = {};
      
      // Calcola i totali e popola la mappa
      for (const profit of profits) {
        totalRealizedProfit += profit.realizedProfitLoss;
        totalCostBasis += profit.costBasis;
        totalProceeds += profit.proceedsAmount;
        
        if (profit.realizedProfitLoss > 0) {
          profitableTradesCount++;
        } else {
          unprofitableTradesCount++;
        }
        
        // Aggiorna la mappa per crypto
        const symbol = profit.sourceCryptoSymbol;
        if (!profitsByCrypto[symbol]) {
          profitsByCrypto[symbol] = {
            totalProfit: 0,
            totalCost: 0,
            totalProceeds: 0,
            profitableCount: 0,
            unprofitableCount: 0,
            avgProfitPercentage: 0
          };
        }
        
        profitsByCrypto[symbol].totalProfit += profit.realizedProfitLoss;
        profitsByCrypto[symbol].totalCost += profit.costBasis;
        profitsByCrypto[symbol].totalProceeds += profit.proceedsAmount;
        
        if (profit.realizedProfitLoss > 0) {
          profitsByCrypto[symbol].profitableCount++;
        } else {
          profitsByCrypto[symbol].unprofitableCount++;
        }
      }
      
      // Calcola le percentuali medie per ogni crypto
      for (const symbol in profitsByCrypto) {
        const crypto = profitsByCrypto[symbol];
        crypto.avgProfitPercentage = crypto.totalCost > 0 
          ? (crypto.totalProfit / crypto.totalCost) * 100 
          : 0;
      }
      
      // Calcola la percentuale di profitto totale
      const totalProfitPercentage = totalCostBasis > 0 
        ? (totalRealizedProfit / totalCostBasis) * 100 
        : 0;
      
      return {
        totalRealizedProfit,
        totalCostBasis,
        totalProceeds,
        totalProfitPercentage,
        tradesCount: profits.length,
        profitableTradesCount,
        unprofitableTradesCount,
        profitableTradesPercentage: profits.length > 0 
          ? (profitableTradesCount / profits.length) * 100 
          : 0,
        cryptoBreakdown: profitsByCrypto
      };
    } catch (error) {
      logger.error('Errore nel calcolo dei profitti/perdite totali:', error);
      throw error;
    }
  }

  /**
   * Raggruppa i profitti/perdite realizzati per periodo
   * @param user - ID dell'utente
   * @param groupBy - Tipo di raggruppamento ('day', 'week', 'month', 'year')
   * @returns Profitti/perdite raggruppati per periodo
   */
  static async getRealizedProfitsByPeriod(user: string, groupBy: string = 'month'): Promise<any[]> {
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
      const results = await RealizedProfit.aggregate([
        { $match: { user } },
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
      
      // Calcola percentuali e formatta i risultati
      return results.map(period => ({
        period: period._id,
        totalProfit: period.totalProfit,
        totalCost: period.totalCost,
        totalProceeds: period.totalProceeds,
        profitPercentage: period.totalCost > 0 
          ? (period.totalProfit / period.totalCost) * 100 
          : 0,
        tradesCount: period.count
      }));
    } catch (error) {
      logger.error(`Errore nel raggruppamento dei profitti per ${groupBy}:`, error);
      throw error;
    }
  }
}

export default RealizedProfitService;