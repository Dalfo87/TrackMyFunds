// src/modules/realizedprofit/controllers/realizedprofit.controller.ts
import { Request, Response } from 'express';
import { RealizedProfitService } from '../services/realizedprofit.service';
import { ApiResponseUtil } from '../../../shared/utils/apiResponse';
import { Logger } from '../../../shared/utils/logger';
import { RealizedProfitFilterDto } from '../dtos/realized-profit.dtos';

export class RealizedProfitController {
  constructor(private realizedProfitService: RealizedProfitService) {}

  /**
   * Ottiene tutti i profitti/perdite realizzati di un utente
   */
  async getAllRealizedProfits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user'; // Per compatibilità, finché non implementiamo l'autenticazione
      
      // Estrai eventuali filtri dalla query
      const filters: RealizedProfitFilterDto = {};
      
      if (req.query.cryptoSymbol) {
        filters.cryptoSymbol = req.query.cryptoSymbol as string;
      }
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      
      if (req.query.isProfit !== undefined) {
        filters.isProfit = req.query.isProfit === 'true';
      }
      
      if (req.query.targetCurrency) {
        filters.targetCurrency = req.query.targetCurrency as string;
      }
      
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      
      const realizedProfits = await this.realizedProfitService.getAllRealizedProfits(userId, filters);
      
      ApiResponseUtil.success(res, {
        count: realizedProfits.length,
        data: realizedProfits
      }, 'Profitti realizzati recuperati con successo');
    } catch (error) {
      Logger.error('Errore nel controller getAllRealizedProfits:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero dei profitti realizzati',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene i profitti/perdite realizzati per una specifica criptovaluta
   */
  async getRealizedProfitsByCrypto(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      const { symbol } = req.params;
      
      if (!symbol) {
        ApiResponseUtil.error(res, 'Simbolo della criptovaluta richiesto', 400);
        return;
      }
      
      const realizedProfits = await this.realizedProfitService.getRealizedProfitsByCrypto(
        userId, 
        symbol
      );
      
      ApiResponseUtil.success(res, {
        count: realizedProfits.length,
        data: realizedProfits
      }, `Profitti realizzati per ${symbol} recuperati con successo`);
    } catch (error) {
      Logger.error('Errore nel controller getRealizedProfitsByCrypto:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero dei profitti realizzati per crypto',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Calcola il totale dei profitti/perdite realizzati
   */
  async getTotalRealizedProfits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      // Estrai eventuali filtri dalla query
      const filters: RealizedProfitFilterDto = {};
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      
      if (req.query.cryptoSymbol) {
        filters.cryptoSymbol = req.query.cryptoSymbol as string;
      }
      
      const result = await this.realizedProfitService.calculateTotalRealizedProfits(userId, filters);
      
      ApiResponseUtil.success(res, result, 'Totale profitti realizzati calcolato con successo');
    } catch (error) {
      Logger.error('Errore nel controller getTotalRealizedProfits:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel calcolo dei profitti realizzati totali',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene i profitti/perdite realizzati raggruppati per periodo
   */
  async getRealizedProfitsByPeriod(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      const { groupBy = 'month' } = req.query;
      
      const result = await this.realizedProfitService.getRealizedProfitsByPeriod(
        userId,
        groupBy as string
      );
      
      ApiResponseUtil.success(res, {
        count: result.length,
        data: result
      }, 'Profitti realizzati raggruppati per periodo recuperati con successo');
    } catch (error) {
      Logger.error('Errore nel controller getRealizedProfitsByPeriod:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel raggruppamento dei profitti realizzati',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene statistiche di performance per profitti realizzati vs non realizzati
   */
  async getPerformanceStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const stats = await this.realizedProfitService.getPerformanceStats(userId);
      
      ApiResponseUtil.success(res, stats, 'Statistiche di performance recuperate con successo');
    } catch (error) {
      Logger.error('Errore nel controller getPerformanceStats:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero delle statistiche di performance',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
}