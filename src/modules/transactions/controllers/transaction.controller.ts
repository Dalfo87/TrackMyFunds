// src/modules/transactions/controllers/transaction.controller.ts
import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { ApiResponseUtil } from '../../../shared/utils/apiResponse';
import { Logger } from '../../../shared/utils/logger';
import { FilterTransactionsDto } from '../dtos/transaction-dtos';

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  /**
   * Ottiene tutte le transazioni di un utente
   */
  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user'; // Per compatibilità, finché non implementiamo l'autenticazione
      
      // Estrai eventuali filtri dalla query
      const filters: FilterTransactionsDto = {};
      
      if (req.query.type) {
        filters.type = req.query.type as string;
      }
      
      if (req.query.cryptoSymbol) {
        filters.cryptoSymbol = req.query.cryptoSymbol as string;
      }
      
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      
      if (req.query.paymentMethod) {
        filters.paymentMethod = req.query.paymentMethod as string;
      }
      
      const transactions = await this.transactionService.getAllTransactions(userId, filters);
      
      ApiResponseUtil.success(res, transactions, 'Transazioni recuperate con successo');
    } catch (error) {
      Logger.error('Errore nel controller getAllTransactions:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero delle transazioni',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ottiene una transazione specifica
   */
  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const transaction = await this.transactionService.getTransactionById(id);
      
      ApiResponseUtil.success(res, transaction, 'Transazione recuperata con successo');
    } catch (error) {
      Logger.error('Errore nel controller getTransactionById:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel recupero della transazione',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Aggiunge una nuova transazione
   */
  async addTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const newTransaction = await this.transactionService.addTransaction(userId, req.body);
      
      ApiResponseUtil.success(res, newTransaction, 'Transazione aggiunta con successo', 201);
    } catch (error) {
      Logger.error('Errore nel controller addTransaction:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiunta della transazione',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Aggiorna una transazione esistente
   */
  async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const updatedTransaction = await this.transactionService.updateTransaction(id, req.body);
      
      ApiResponseUtil.success(res, updatedTransaction, 'Transazione aggiornata con successo');
    } catch (error) {
      Logger.error('Errore nel controller updateTransaction:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'aggiornamento della transazione',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Elimina una transazione
   */
  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await this.transactionService.deleteTransaction(id);
      
      ApiResponseUtil.success(res, null, 'Transazione eliminata con successo');
    } catch (error) {
      Logger.error('Errore nel controller deleteTransaction:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nell\'eliminazione della transazione',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Registra un airdrop (acquisizione gratuita di crypto)
   */
  async recordAirdrop(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const newAirdrop = await this.transactionService.recordAirdrop(userId, req.body);
      
      ApiResponseUtil.success(
        res, 
        newAirdrop, 
        `Airdrop di ${req.body.quantity} ${req.body.cryptoSymbol.toUpperCase()} registrato con successo`, 
        201
      );
    } catch (error) {
      Logger.error('Errore nel controller recordAirdrop:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nella registrazione dell\'airdrop',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Registra una transazione di farming (reward da staking/liquidity)
   */
  async recordFarming(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const newFarming = await this.transactionService.recordFarming(userId, req.body);
      
      ApiResponseUtil.success(
        res, 
        newFarming, 
        `Farming di ${req.body.quantity} ${req.body.cryptoSymbol.toUpperCase()} registrato con successo`, 
        201
      );
    } catch (error) {
      Logger.error('Errore nel controller recordFarming:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nella registrazione del farming',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }

  /**
   * Ricalcola il portafoglio dell'utente
   */
  async recalculatePortfolio(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'default_user';
      
      const portfolio = await this.transactionService.recalculateEntirePortfolio(userId);
      
      ApiResponseUtil.success(
        res, 
        portfolio, 
        'Portafoglio ricalcolato con successo'
      );
    } catch (error) {
      Logger.error('Errore nel controller recalculatePortfolio:', error);
      ApiResponseUtil.error(
        res, 
        error instanceof Error ? error.message : 'Errore nel ricalcolo del portafoglio',
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500
      );
    }
  }
}