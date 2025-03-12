// src/controllers/realizedProfitController.ts

import { Request, Response } from 'express';
import RealizedProfitService from '../services/realizedProfitService';
import logger from '../utils/logger';

/**
 * Controller per gestire le richieste relative ai profitti/perdite realizzati
 */
class RealizedProfitController {
  /**
   * Ottiene tutti i profitti/perdite realizzati di un utente
   */
  static async getAllRealizedProfits(req: Request, res: Response): Promise<void> {
    try {
      const userId = 'default_user'; // In futuro, estrarre dall'autenticazione
      
      // Estrai eventuali filtri dalla query
      const { cryptoSymbol, startDate, endDate } = req.query;
      
      const filters: any = {};
      
      if (cryptoSymbol) {
        filters.sourceCryptoSymbol = (cryptoSymbol as string).toUpperCase();
      }
      
      if (startDate || endDate) {
        filters.date = {};
        if (startDate) {
          filters.date.$gte = new Date(startDate as string);
        }
        if (endDate) {
          filters.date.$lte = new Date(endDate as string);
        }
      }
      
      const realizedProfits = await RealizedProfitService.getAllRealizedProfits(userId, filters);
      
      res.json({
        success: true,
        count: realizedProfits.length,
        data: realizedProfits
      });
    } catch (error) {
      logger.error('Errore nel recupero dei profitti realizzati:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero dei profitti realizzati',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Ottiene i profitti/perdite realizzati per una specifica criptovaluta
   */
  static async getRealizedProfitsByCrypto(req: Request, res: Response): Promise<void> {
    try {
      const userId = 'default_user'; // In futuro, estrarre dall'autenticazione
      const { symbol } = req.params;
      
      if (!symbol) {
        res.status(400).json({
          success: false,
          message: 'Simbolo della criptovaluta richiesto'
        });
        return;
      }
      
      const realizedProfits = await RealizedProfitService.getRealizedProfitsByCrypto(
        userId, 
        symbol
      );
      
      res.json({
        success: true,
        count: realizedProfits.length,
        data: realizedProfits
      });
    } catch (error) {
      logger.error('Errore nel recupero dei profitti realizzati per crypto:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel recupero dei profitti realizzati per crypto',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Calcola il totale dei profitti/perdite realizzati
   */
  static async getTotalRealizedProfits(req: Request, res: Response): Promise<void> {
    try {
      const userId = 'default_user'; // In futuro, estrarre dall'autenticazione
      
      // Estrai eventuali filtri dalla query
      const { startDate, endDate, cryptoSymbol } = req.query;
      
      const filters: any = {};
      
      if (cryptoSymbol) {
        filters.sourceCryptoSymbol = (cryptoSymbol as string).toUpperCase();
      }
      
      if (startDate || endDate) {
        filters.date = {};
        if (startDate) {
          filters.date.$gte = new Date(startDate as string);
        }
        if (endDate) {
          filters.date.$lte = new Date(endDate as string);
        }
      }
      
      const result = await RealizedProfitService.calculateTotalRealizedProfits(userId, filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Errore nel calcolo dei profitti realizzati totali:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel calcolo dei profitti realizzati totali',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Ottiene i profitti/perdite realizzati raggruppati per periodo
   */
  static async getRealizedProfitsByPeriod(req: Request, res: Response): Promise<void> {
    try {
      const userId = 'default_user'; // In futuro, estrarre dall'autenticazione
      const { groupBy = 'month' } = req.query;
      
      const validGroupBys = ['day', 'week', 'month', 'year'];
      if (!validGroupBys.includes(groupBy as string)) {
        res.status(400).json({
          success: false,
          message: 'Parametro groupBy non valido. Valori consentiti: day, week, month, year'
        });
        return;
      }
      
      const result = await RealizedProfitService.getRealizedProfitsByPeriod(
        userId,
        groupBy as string
      );
      
      res.json({
        success: true,
        count: result.length,
        data: result
      });
    } catch (error) {
      logger.error('Errore nel raggruppamento dei profitti realizzati:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nel raggruppamento dei profitti realizzati',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export default RealizedProfitController;