// src/modules/realizedprofit/services/realizedprofit.service.ts
import { RealizedProfitRepository } from '../repositories/realizedprofit.repository';
import { IRealizedProfit } from '../models/realizedProfit.model';
import { 
  RealizedProfitFilterDto, 
  RealizedProfitSummaryDto, 
  PeriodRealizationDto 
} from '../dtos/realized-profit.dtos';
import { ApiError } from '../../../shared/utils/errorHandler';
import { Logger } from '../../../shared/utils/logger';

export class RealizedProfitService {
  constructor(private realizedProfitRepository: RealizedProfitRepository) {}

  /**
   * Recupera tutti i profitti realizzati di un utente
   */
  async getAllRealizedProfits(userId: string, filters?: RealizedProfitFilterDto): Promise<IRealizedProfit[]> {
    try {
      return await this.realizedProfitRepository.findAllByUser(userId, filters);
    } catch (error) {
      Logger.error('Errore nel servizio getAllRealizedProfits:', error);
      throw new ApiError(500, 'Errore nel recupero dei profitti realizzati');
    }
  }

  /**
   * Recupera i profitti realizzati per una criptovaluta specifica
   */
  async getRealizedProfitsByCrypto(userId: string, cryptoSymbol: string): Promise<IRealizedProfit[]> {
    try {
      return await this.realizedProfitRepository.findByCryptoSymbol(userId, cryptoSymbol);
    } catch (error) {
      Logger.error(`Errore nel servizio getRealizedProfitsByCrypto per ${cryptoSymbol}:`, error);
      throw new ApiError(500, `Errore nel recupero dei profitti realizzati per ${cryptoSymbol}`);
    }
  }

  /**
   * Calcola il riepilogo totale dei profitti realizzati
   */
  async calculateTotalRealizedProfits(userId: string, filters?: RealizedProfitFilterDto): Promise<RealizedProfitSummaryDto> {
    try {
      // Ottieni i totali di base
      const totals = await this.realizedProfitRepository.calculateTotals(userId, filters);
      
      // Ottieni il breakdown per criptovaluta
      const cryptoBreakdown = await this.realizedProfitRepository.groupByCrypto(userId, filters);
      
      // Calcola le percentuali medie per ogni crypto
      const cryptoWithPercentages: Record<string, any> = {};
      
      for (const [symbol, data] of Object.entries(cryptoBreakdown)) {
        cryptoWithPercentages[symbol] = {
          ...data,
          avgProfitPercentage: data.totalCost > 0 
            ? (data.totalProfit / data.totalCost) * 100 
            : 0
        };
      }
      
      // Calcola la percentuale di profitto totale
      const totalProfitPercentage = totals.totalCostBasis > 0 
        ? (totals.totalRealizedProfit / totals.totalCostBasis) * 100 
        : 0;
      
      return {
        totalRealizedProfit: totals.totalRealizedProfit,
        totalCostBasis: totals.totalCostBasis,
        totalProceeds: totals.totalProceeds,
        totalProfitPercentage: totalProfitPercentage,
        tradesCount: totals.tradesCount,
        profitableTradesCount: totals.profitableTradesCount,
        unprofitableTradesCount: totals.unprofitableTradesCount,
        profitableTradesPercentage: totals.tradesCount > 0 
          ? (totals.profitableTradesCount / totals.tradesCount) * 100 
          : 0,
        cryptoBreakdown: cryptoWithPercentages
      };
    } catch (error) {
      Logger.error('Errore nel servizio calculateTotalRealizedProfits:', error);
      throw new ApiError(500, 'Errore nel calcolo dei profitti realizzati totali');
    }
  }

  /**
   * Raggruppa i profitti realizzati per periodo
   */
  async getRealizedProfitsByPeriod(userId: string, groupBy: string = 'month'): Promise<PeriodRealizationDto[]> {
    try {
      const validGroupBys = ['day', 'week', 'month', 'year'];
      
      if (!validGroupBys.includes(groupBy)) {
        throw new ApiError(400, 'Parametro groupBy non valido. Valori consentiti: day, week, month, year');
      }
      
      // Ottiene i dati raggruppati per periodo
      const results = await this.realizedProfitRepository.groupByPeriod(userId, groupBy);
      
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
      Logger.error(`Errore nel servizio getRealizedProfitsByPeriod con groupBy=${groupBy}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nel raggruppamento dei profitti realizzati');
    }
  }

  /**
   * Ottiene le statistiche di performance per profitti realizzati vs non realizzati
   */
  async getPerformanceStats(userId: string): Promise<any> {
    try {
      // Ottieni tutti i profitti realizzati
      const allProfits = await this.realizedProfitRepository.findAllByUser(userId);
      
      // Inizializza statistiche
      const stats = {
        totalRealized: {
          profit: 0,
          loss: 0,
          net: 0
        },
        monthlySummary: [] as any[],
        bestTrade: null as any,
        worstTrade: null as any,
        avgProfitPerTrade: 0,
        avgLossPerTrade: 0
      };
      
      if (allProfits.length === 0) {
        return stats;
      }
      
      // Calcola totali
      let totalProfit = 0;
      let totalLoss = 0;
      let profitCount = 0;
      let lossCount = 0;
      let bestTrade = allProfits[0];
      let worstTrade = allProfits[0];
      
      // Mappa per raggruppare per mese
      const monthlyMap: Record<string, {profit: number, loss: number, count: number}> = {};
      
      // Elabora ogni record
      for (const profit of allProfits) {
        // Per i totali
        if (profit.realizedProfitLoss > 0) {
          totalProfit += profit.realizedProfitLoss;
          profitCount++;
          
          // Controlla se questo è il trade migliore
          if (profit.realizedProfitLoss > bestTrade.realizedProfitLoss) {
            bestTrade = profit;
          }
        } else {
          totalLoss += profit.realizedProfitLoss;
          lossCount++;
          
          // Controlla se questo è il trade peggiore
          if (profit.realizedProfitLoss < worstTrade.realizedProfitLoss) {
            worstTrade = profit;
          }
        }
        
        // Per i riepiloghi mensili
        const monthKey = profit.date.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            profit: 0,
            loss: 0,
            count: 0
          };
        }
        
        if (profit.realizedProfitLoss > 0) {
          monthlyMap[monthKey].profit += profit.realizedProfitLoss;
        } else {
          monthlyMap[monthKey].loss += profit.realizedProfitLoss;
        }
        monthlyMap[monthKey].count++;
      }
      
      // Calcola medie
      stats.avgProfitPerTrade = profitCount > 0 ? totalProfit / profitCount : 0;
      stats.avgLossPerTrade = lossCount > 0 ? totalLoss / lossCount : 0;
      
      // Imposta i totali
      stats.totalRealized.profit = totalProfit;
      stats.totalRealized.loss = totalLoss;
      stats.totalRealized.net = totalProfit + totalLoss;
      
      // Imposta best e worst trade
      stats.bestTrade = {
        date: bestTrade.date,
        cryptoSymbol: bestTrade.sourceCryptoSymbol,
        amount: bestTrade.realizedProfitLoss,
        percentage: bestTrade.profitLossPercentage
      };
      
      stats.worstTrade = {
        date: worstTrade.date,
        cryptoSymbol: worstTrade.sourceCryptoSymbol,
        amount: worstTrade.realizedProfitLoss,
        percentage: worstTrade.profitLossPercentage
      };
      
      // Converte il riepilogo mensile in array
      stats.monthlySummary = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        profit: data.profit,
        loss: data.loss,
        net: data.profit + data.loss,
        count: data.count
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      return stats;
    } catch (error) {
      Logger.error('Errore nel servizio getPerformanceStats:', error);
      throw new ApiError(500, 'Errore nel recupero delle statistiche di performance');
    }
  }
}