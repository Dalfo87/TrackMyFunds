// src/modules/crypto/controllers/crypto.controller.ts
import { Request, Response } from 'express';
import { CryptoService } from '../services/crypto.service';
import { ApiResponseUtil } from '../../../shared/utils/apiResponse';
import { Logger } from '../../../shared/utils/logger';

export class CryptoController {
  constructor(private cryptoService: CryptoService) {}
  
  /**
   * Ottiene tutte le criptovalute
   */
  async getAllCryptos(req: Request, res: Response): Promise<void> {
    try {
      const cryptos = await this.cryptoService.getAllCryptos();
      ApiResponseUtil.success(res, cryptos, 'Criptovalute recuperate con successo');
    } catch (error) {
      Logger.error('Errore nel controller getAllCryptos:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero delle criptovalute',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
  
  /**
   * Ottiene una criptovaluta per simbolo
   */
  async getCryptoBySymbol(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const crypto = await this.cryptoService.getCryptoBySymbol(symbol);
      ApiResponseUtil.success(res, crypto, 'Criptovaluta recuperata con successo');
    } catch (error) {
      Logger.error('Errore nel controller getCryptoBySymbol:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero della criptovaluta',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
  
  /**
   * Crea una nuova criptovaluta
   */
  async createCrypto(req: Request, res: Response): Promise<void> {
    try {
      const crypto = await this.cryptoService.createCrypto(req.body);
      ApiResponseUtil.success(res, crypto, 'Criptovaluta creata con successo', 201);
    } catch (error) {
      Logger.error('Errore nel controller createCrypto:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nella creazione della criptovaluta',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
  
  /**
   * Aggiorna una criptovaluta esistente
   */
  async updateCrypto(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const crypto = await this.cryptoService.updateCrypto(symbol, req.body);
      ApiResponseUtil.success(res, crypto, 'Criptovaluta aggiornata con successo');
    } catch (error) {
      Logger.error('Errore nel controller updateCrypto:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiornamento della criptovaluta',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
  
  /**
   * Elimina una criptovaluta
   */
  async deleteCrypto(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      await this.cryptoService.deleteCrypto(symbol);
      ApiResponseUtil.success(res, null, 'Criptovaluta eliminata con successo');
    } catch (error) {
      Logger.error('Errore nel controller deleteCrypto:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'eliminazione della criptovaluta',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
  
  /**
   * Cerca criptovalute per nome o simbolo
   */
  async searchCryptos(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit } = req.query;
      
      if (!query || typeof query !== 'string') {
        ApiResponseUtil.error(res, 'Parametro query obbligatorio', 400);
        return;
      }
      
      const results = await this.cryptoService.searchCryptos({
        query,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });
      
      ApiResponseUtil.success(res, results, 'Ricerca completata con successo');
    } catch (error) {
      Logger.error('Errore nel controller searchCryptos:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nella ricerca delle criptovalute',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
  
  /**
   * Aggiorna i prezzi di tutte le criptovalute
   */
  async updateAllPrices(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.cryptoService.updateAllPrices();
      
      ApiResponseUtil.success(
        res, 
        result, 
        `Prezzi aggiornati con successo: ${result.updated} aggiornati, ${result.added} aggiunti`
      );
    } catch (error) {
      Logger.error('Errore nel controller updateAllPrices:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiornamento dei prezzi',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
}