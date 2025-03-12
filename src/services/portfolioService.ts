// src/services/portfolioService.ts

import Portfolio from '../models/Portfolio';
import Crypto from '../models/Crypto';
import TransactionService from './transactionService';
import logger from '../utils/logger';

/**
 * Classe di servizio per la gestione del portafoglio
 */
class PortfolioService {
  /**
   * Recupera il portafoglio completo di un utente
   * @param user - ID dell'utente
   * @returns Il portafoglio dell'utente
   */
  static async getPortfolio(user: string): Promise<any> {
    try {
      // Recupera il portafoglio dell'utente (o crea uno nuovo se non esiste)
      let portfolio = await Portfolio.findOne({ user });
      
      if (!portfolio) {
        logger.info(`Portafoglio non trovato per l'utente ${user}, creazione di un nuovo portafoglio`);
        portfolio = new Portfolio({
          user,
          assets: [],
          lastUpdated: new Date()
        });
        await portfolio.save();
      }
      
      return portfolio;
    } catch (error) {
      logger.error('Errore nel recupero del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Recupera il valore attuale del portafoglio con prezzi aggiornati
   * @param user - ID dell'utente
   * @returns Il portafoglio con valori e statistiche aggiornate
   */
  static async getPortfolioValue(user: string): Promise<any> {
    try {
      const portfolio = await Portfolio.findOne({ user });
      
      if (!portfolio || portfolio.assets.length === 0) {
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
      const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
      const totalInvestment = assets.reduce((sum, asset) => sum + asset.investmentValue, 0);
      const totalProfitLoss = totalValue - totalInvestment;
      const totalProfitLossPercentage = totalInvestment > 0 
        ? (totalProfitLoss / totalInvestment) * 100 
        : 0;
      
      return {
        totalValue,
        totalInvestment,
        totalProfitLoss,
        totalProfitLossPercentage,
        // Restituisci solo gli asset con saldo positivo per la visualizzazione
        assets: positiveAssets,
        // Includi anche tutti gli asset per altri scopi (come debugging)
        allAssets: assets
      };
    } catch (error) {
      logger.error('Errore nel calcolo del valore del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Raggruppa gli asset del portafoglio per categoria
   * @param user - ID dell'utente
   * @returns Asset raggruppati per categoria
   */
  static async getPortfolioByCategory(user: string): Promise<any> {
    try {
      const portfolio = await Portfolio.findOne({ user });
      
      if (!portfolio || portfolio.assets.length === 0) {
        return { categories: [] };
      }
      
      // Ottieni i valori attuali degli asset
      const portfolioWithValues = await this.getPortfolioValue(user);
      const assetsWithValues = portfolioWithValues.assets;
      
      // Raggruppa gli asset per categoria
      const categorizedAssets = assetsWithValues.reduce((result: any, asset: any) => {
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
      logger.error('Errore nel recupero del portafoglio per categoria:', error);
      throw error;
    }
  }

  /**
   * Forza un ricalcolo completo del portafoglio
   * @param user - ID dell'utente
   * @returns Il portafoglio aggiornato
   */
  static async recalculatePortfolio(user: string): Promise<any> {
    try {
      logger.info(`Avvio ricalcolo forzato del portafoglio per l'utente: ${user}`);
      return await TransactionService.recalculateEntirePortfolio(user);
    } catch (error) {
      logger.error('Errore nel ricalcolo forzato del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Ottiene le performance storiche del portafoglio
   * @param user - ID dell'utente
   * @param period - Periodo ('1m', '3m', '6m', '1y', 'all')
   * @returns Dati di performance del portafoglio nel tempo
   */
  static async getHistoricalPerformance(user: string, period: string = '1y'): Promise<any> {
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
      const transactions = await TransactionService.getAllTransactions(
        user, 
        { date: { $gte: period === 'all' ? new Date(0) : startDate } }
      );
      
      if (transactions.length === 0) {
        return {
          timeline: [],
          totalInvestment: 0,
          currentValue: 0
        };
      }
      
      // Ottieni il valore attuale del portafoglio
      const currentPortfolio = await this.getPortfolioValue(user);
      
      // Per un'analisi storica accurata, dovremmo avere i prezzi storici delle criptovalute,
      // che tipicamente richiederebbe un'API esterna o uno storico salvato.
      // In mancanza di ciò, possiamo creare una timeline basata sulle transazioni,
      // stimando il valore passato basandoci sulle transazioni stesse.
      
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
      
      for (const dateStr of transactionDates) {
        const date = new Date(dateStr);
        // Prendi solo le transazioni fino a questa data
        const relevantTransactions = transactions.filter(tx => tx.date <= date);
        
        // Ricalcola il portafoglio a questa data
        // Nota: questa è una semplificazione; per una soluzione più accurata,
        // dovresti usare i prezzi storici reali per quella data
        const portfolio = await TransactionService.recalculateEntirePortfolio(user);
        
        // Usa i prezzi attuali per stimare il valore (in assenza di dati storici)
        const portfolioValue = await this.getPortfolioValue(user);
        
        // Aggiungi lo snapshot alla timeline
        timeline.push({
          date,
          totalInvestment: portfolioValue.totalInvestment,
          estimatedValue: portfolioValue.totalValue,
          transactions: relevantTransactions.length
        });
      }
      
      return {
        timeline,
        totalInvestment: currentPortfolio.totalInvestment,
        currentValue: currentPortfolio.totalValue,
        performancePercentage: currentPortfolio.totalProfitLossPercentage
      };
    } catch (error) {
      logger.error('Errore nel calcolo della performance storica:', error);
      throw error;
    }
  }
}

export default PortfolioService;