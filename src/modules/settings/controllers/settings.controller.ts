// src/modules/settings/controllers/settings.controller.ts
import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { ApiResponseUtil } from '../../../shared/utils/apiResponse';
import { Logger } from '../../../shared/utils/logger';

export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  /**
   * Ottiene le impostazioni dell'utente
   */
  async getUserSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // Assumiamo che il middleware di autenticazione aggiunga l'utente alla richiesta
      
      if (!userId) {
        ApiResponseUtil.error(res, 'Utente non autenticato', 401);
        return;
      }
      
      const settings = await this.settingsService.getUserSettings(userId);
      ApiResponseUtil.success(res, settings, 'Impostazioni recuperate con successo');
    } catch (error) {
      Logger.error('Errore nel controller getUserSettings:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero delle impostazioni',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Aggiorna le impostazioni dell'utente
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        ApiResponseUtil.error(res, 'Utente non autenticato', 401);
        return;
      }
      
      const settings = await this.settingsService.updateSettings(userId, req.body);
      ApiResponseUtil.success(res, settings, 'Impostazioni aggiornate con successo');
    } catch (error) {
      Logger.error('Errore nel controller updateSettings:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiornamento delle impostazioni',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Aggiorna la chiave API di CoinGecko
   */
  async updateCoinGeckoApiKey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        ApiResponseUtil.error(res, 'Utente non autenticato', 401);
        return;
      }
      
      const { apiKey } = req.body;
      
      if (!apiKey || typeof apiKey !== 'string') {
        ApiResponseUtil.error(res, 'Chiave API non valida', 400);
        return;
      }
      
      const settings = await this.settingsService.updateCoinGeckoApiKey(userId, { apiKey });
      ApiResponseUtil.success(res, settings, 'Chiave API aggiornata con successo');
    } catch (error) {
      Logger.error('Errore nel controller updateCoinGeckoApiKey:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiornamento della chiave API',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Aggiunge una categoria personalizzata
   */
  async addCategory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        ApiResponseUtil.error(res, 'Utente non autenticato', 401);
        return;
      }
      
      const { category } = req.body;
      
      const settings = await this.settingsService.addCategory(userId, { category });
      ApiResponseUtil.success(res, settings, 'Categoria aggiunta con successo');
    } catch (error) {
      Logger.error('Errore nel controller addCategory:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiunta della categoria',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Rimuove una categoria personalizzata
   */
  async removeCategory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        ApiResponseUtil.error(res, 'Utente non autenticato', 401);
        return;
      }
      
      const { category } = req.params;
      
      const settings = await this.settingsService.removeCategory(userId, { category });
      ApiResponseUtil.success(res, settings, 'Categoria rimossa con successo');
    } catch (error) {
      Logger.error('Errore nel controller removeCategory:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nella rimozione della categoria',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Reimposta le impostazioni alle impostazioni predefinite
   */
  async resetToDefaults(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        ApiResponseUtil.error(res, 'Utente non autenticato', 401);
        return;
      }
      
      const settings = await this.settingsService.resetToDefaults(userId);
      ApiResponseUtil.success(res, settings, 'Impostazioni reimpostate con successo');
    } catch (error) {
      Logger.error('Errore nel controller resetToDefaults:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel ripristino delle impostazioni predefinite',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
}