// src/modules/portfolio/controllers/portfolio.controller.ts
import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio.service';
import { ApiResponseUtil } from '../../../shared/utils/apiResponse';
import { Logger } from '../../../shared/utils/logger';

export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  /**
   * Ottiene il portafoglio completo di un utente
   */
  async getPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user'; // Per compatibilità, finché non implementiamo l'autenticazione
      
      const portfolio = await this.portfolioService.getPortfolio(userId);
      
      ApiResponseUtil.success(res, portfolio, 'Portafoglio recuperato con successo');
    } catch (error) {
      Logger.error('Errore nel controller getPortfolio:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero del portafoglio',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene il valore attuale del portafoglio
   */
  async getPortfolioValue(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const portfolioValue = await this.portfolioService.getPortfolioValue(userId);
      
      ApiResponseUtil.success(res, portfolioValue, 'Valore del portafoglio calcolato con successo');
    } catch (error) {
      Logger.error('Errore nel controller getPortfolioValue:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel calcolo del valore del portafoglio',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene il portafoglio raggruppato per categoria
   */
  async getPortfolioByCategory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const portfolioByCategory = await this.portfolioService.getPortfolioByCategory(userId);
      
      ApiResponseUtil.success(res, portfolioByCategory, 'Portafoglio raggruppato per categoria recuperato con successo');
    } catch (error) {
      Logger.error('Errore nel controller getPortfolioByCategory:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel raggruppamento del portafoglio per categoria',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene le performance storiche del portafoglio
   */
  async getHistoricalPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      const { period = '1y' } = req.query;
      
      const historicalPerformance = await this.portfolioService.getHistoricalPerformance(
        userId, 
        period as string
      );
      
      ApiResponseUtil.success(res, historicalPerformance, 'Performance storica del portafoglio recuperata con successo');
    } catch (error) {
      Logger.error('Errore nel controller getHistoricalPerformance:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero della performance storica',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Aggiorna la categoria di un asset
   */
  async updateAssetCategory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      const { cryptoSymbol } = req.params;
      const { category } = req.body;
      
      if (!category) {
        ApiResponseUtil.error(res, 'Categoria richiesta', 400);
        return;
      }
      
      const portfolio = await this.portfolioService.updateAssetCategory(
        userId, 
        cryptoSymbol, 
        category
      );
      
      ApiResponseUtil.success(res, portfolio, 'Categoria dell\'asset aggiornata con successo');
    } catch (error) {
      Logger.error('Errore nel controller updateAssetCategory:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiornamento della categoria dell\'asset',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene la distribuzione degli asset per tipo
   */
  async getAssetDistributionByType(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const distribution = await this.portfolioService.getAssetDistributionByType(userId);
      
      ApiResponseUtil.success(res, distribution, 'Distribuzione degli asset per tipo recuperata con successo');
    } catch (error) {
      Logger.error('Errore nel controller getAssetDistributionByType:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero della distribuzione degli asset',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene statistiche generali sul portafoglio
   */
  async getPortfolioStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const stats = await this.portfolioService.getPortfolioStats(userId);
      
      ApiResponseUtil.success(res, stats, 'Statistiche del portafoglio recuperate con successo');
    } catch (error) {
      Logger.error('Errore nel controller getPortfolioStats:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero delle statistiche del portafoglio',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
}