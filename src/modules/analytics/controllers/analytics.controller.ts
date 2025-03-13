// src/modules/analytics/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ApiResponseUtil } from '../../../shared/utils/apiResponse';
import { Logger } from '../../../shared/utils/logger';
import { AnalyticsFilterDto } from '../dtos/analytics.dtos';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * Calcola performance del portafoglio
   */
  async getPortfolioPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user'; // Per compatibilità finché non si implementa l'autenticazione
      
      const performance = await this.analyticsService.getPortfolioPerformance(userId);
      
      ApiResponseUtil.success(res, performance, 'Performance del portafoglio calcolata con successo');
    } catch (error) {
      Logger.error('Errore nel controller getPortfolioPerformance:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel calcolo della performance del portafoglio',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Calcola profitti e perdite realizzati dalle transazioni completate
   */
  async getRealizedProfitLoss(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      // Crea il DTO per i filtri
      const filters: AnalyticsFilterDto = {
        method: req.query.method as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        cryptoSymbol: req.query.cryptoSymbol as string,
        category: req.query.category as string
      };
      
      const result = await this.analyticsService.getRealizedProfitLoss(userId, filters);
      
      ApiResponseUtil.success(res, result, 'Profitti e perdite realizzati calcolati con successo');
    } catch (error) {
      Logger.error('Errore nel controller getRealizedProfitLoss:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel calcolo dei profitti/perdite realizzati',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Genera statistiche generali sul portafoglio
   */
  async getPortfolioStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const stats = await this.analyticsService.getPortfolioStats(userId);
      
      ApiResponseUtil.success(res, stats, 'Statistiche del portafoglio generate con successo');
    } catch (error) {
      Logger.error('Errore nel controller getPortfolioStats:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nella generazione delle statistiche del portafoglio',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Analizza l'andamento storico del portafoglio
   */
  async getHistoricalPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      // Crea il DTO per i filtri
      const filters: AnalyticsFilterDto = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        cryptoSymbol: req.query.cryptoSymbol as string
      };
      
      const historicalData = await this.analyticsService.getHistoricalPerformance(userId, filters);
      
      ApiResponseUtil.success(res, historicalData, 'Performance storica del portafoglio calcolata con successo');
    } catch (error) {
      Logger.error('Errore nel controller getHistoricalPerformance:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel calcolo della performance storica',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene statistiche di investimento per metodo di pagamento
   */
  async getInvestmentByPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      // Crea il DTO per i filtri
      const filters: AnalyticsFilterDto = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        cryptoSymbol: req.query.cryptoSymbol as string
      };
      
      const result = await this.analyticsService.getInvestmentByPaymentMethod(userId, filters);
      
      ApiResponseUtil.success(res, result, 'Statistiche per metodo di pagamento calcolate con successo');
    } catch (error) {
      Logger.error('Errore nel controller getInvestmentByPaymentMethod:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel calcolo delle statistiche per metodo di pagamento',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
}