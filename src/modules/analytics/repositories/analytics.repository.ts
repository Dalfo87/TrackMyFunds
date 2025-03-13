// src/modules/analytics/repositories/analytics.repository.ts
import { Transaction } from '../../transactions/models/transaction.model';
import { Portfolio } from '../../portfolio/models/portfolio.model';
import { Crypto } from '../../crypto/models/crypto.model';
import { BaseRepository } from '../../../shared/repositories/baseRepository';
import { TransactionType, PaymentMethod } from '../../../shared/types/transaction.types';
import { Logger } from '../../../shared/utils/logger';
import { AnalyticsFilterDto } from '../dtos/analytics.dtos';
import mongoose from 'mongoose';

export class AnalyticsRepository {
  /**
   * Recupera le transazioni con filtri
   */
  async getTransactions(userId: string, filters?: AnalyticsFilterDto): Promise<any[]> {
    try {
      const query: any = { user: userId };
      
      if (filters) {
        if (filters.startDate || filters.endDate) {
          query.date = {};
          
          if (filters.startDate) {
            query.date.$gte = filters.startDate;
          }
          
          if (filters.endDate) {
            query.date.$lte = filters.endDate;
          }
        }
        
        if (filters.cryptoSymbol) {
          query.cryptoSymbol = filters.cryptoSymbol.toUpperCase();
        }
        
        if (filters.category) {
          query.category = filters.category;
        }
      }
      
      return await Transaction.find(query).sort({ date: 1 });
    } catch (error) {
      Logger.error('Errore nel repository durante il recupero delle transazioni:', error);
      throw error;
    }
  }

  /**
   * Recupera il portafoglio di un utente
   */
  async getPortfolio(userId: string): Promise<any> {
    try {
      return await Portfolio.findOne({ user: userId });
    } catch (error) {
      Logger.error('Errore nel repository durante il recupero del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Recupera i dati delle criptovalute
   */
  async getCryptoData(symbols: string[]): Promise<Map<string, any>> {
    try {
      const cryptos = await Crypto.find({ 
        symbol: { $in: symbols.map(s => s.toUpperCase()) } 
      });
      
      // Crea una mappa per un accesso più veloce
      const cryptoMap = new Map();
      cryptos.forEach(crypto => {
        cryptoMap.set(crypto.symbol.toUpperCase(), crypto);
      });
      
      return cryptoMap;
    } catch (error) {
      Logger.error('Errore nel repository durante il recupero dei dati crypto:', error);
      throw error;
    }
  }

  /**
   * Calcola le statistiche degli investimenti per metodo di pagamento
   */
  async getInvestmentByPaymentMethod(userId: string, filters?: AnalyticsFilterDto): Promise<any> {
    try {
      // Base query per tutte le transazioni di acquisto
      const query: any = {
        user: userId,
        type: TransactionType.BUY
      };
      
      // Aggiungi eventuali filtri
      if (filters) {
        if (filters.startDate || filters.endDate) {
          query.date = {};
          
          if (filters.startDate) {
            query.date.$gte = filters.startDate;
          }
          
          if (filters.endDate) {
            query.date.$lte = filters.endDate;
          }
        }
        
        if (filters.cryptoSymbol) {
          query.cryptoSymbol = filters.cryptoSymbol.toUpperCase();
        }
      }
      
      // Recupera le transazioni di acquisto
      const buyTransactions = await Transaction.find(query).sort({ date: 1 });
      
      // Inizializza i contatori per ogni metodo di pagamento
      interface PaymentMethodStats {
        totalAmount: number;
        transactionCount: number;
        firstDate: Date | null;
        lastDate: Date | null;
        currencies: Record<string, {
          totalAmount: number;
          transactionCount: number;
        }>;
      }
      
      const methodStats: Record<string, PaymentMethodStats> = {};
      
      // Inizializza le statistiche per ogni metodo di pagamento
      const allMethods = Object.values(PaymentMethod);
      allMethods.forEach(method => {
        methodStats[method] = {
          totalAmount: 0,
          transactionCount: 0,
          firstDate: null,
          lastDate: null,
          currencies: {}
        };
      });
      
      // Aggiungi un 'metodo' indefinito per le transazioni senza metodo specificato
      methodStats['undefined'] = {
        totalAmount: 0,
        transactionCount: 0,
        firstDate: null,
        lastDate: null,
        currencies: {}
      };
      
      // Calcola le statistiche per ogni metodo di pagamento
      let totalInvestment = 0;
      for (const tx of buyTransactions) {
        const method = tx.paymentMethod || 'undefined';
        const currency = tx.paymentCurrency || 'undefined';
        
        // Aggiorna le statistiche del metodo
        if (!methodStats[method]) {
          methodStats[method] = {
            totalAmount: 0,
            transactionCount: 0,
            firstDate: null,
            lastDate: null,
            currencies: {}
          };
        }
        
        methodStats[method].totalAmount += tx.totalAmount;
        methodStats[method].transactionCount++;
        
        // Aggiorna le date
        if (!methodStats[method].firstDate || tx.date < methodStats[method].firstDate) {
          methodStats[method].firstDate = tx.date;
        }
        if (!methodStats[method].lastDate || tx.date > methodStats[method].lastDate) {
          methodStats[method].lastDate = tx.date;
        }
        
        // Aggiorna le statistiche della valuta
        if (!methodStats[method].currencies[currency]) {
          methodStats[method].currencies[currency] = {
            totalAmount: 0,
            transactionCount: 0
          };
        }
        
        methodStats[method].currencies[currency].totalAmount += tx.totalAmount;
        methodStats[method].currencies[currency].transactionCount++;
        
        // Aggiorna il totale degli investimenti
        totalInvestment += tx.totalAmount;
      }
      
      return {
        methodStats,
        totalInvestment,
        transactionCount: buyTransactions.length
      };
    } catch (error) {
      Logger.error('Errore nel repository durante il calcolo delle statistiche per metodo di pagamento:', error);
      throw error;
    }
  }
}