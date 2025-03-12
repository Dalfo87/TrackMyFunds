// src/controllers/transactionController.ts

import { Request, Response } from 'express';
import TransactionService from '../services/transactionService';
import logger from '../utils/logger';

/**
 * Controller per gestire le richieste relative alle transazioni
 */
class TransactionController {
  /**
   * Ottiene tutte le transazioni di un utente
   */
  static async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = 'default_user'; // In futuro, estrarre dall'autenticazione
      
      // Estrai eventuali filtri dalla query
      const { type, cryptoSymbol, startDate, endDate } = req.query;
      
      const filters: any = {};
      
      if (type) {
        filters.type = type;
      }
      
      if (cryptoSymbol) {
        filters.cryptoSymbol = (cryptoSymbol as string).toUpperCase();
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
      
      const transactions = await TransactionService.getAllTransactions(userId, filters);
      
      res.json(transactions);
    } catch (error) {
      logger.error('Errore nel recupero delle transazioni:', error);
      res.status(500).json({ 
        message: 'Errore nel recupero delle transazioni',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Ottiene una transazione specifica
   */
  static async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const transaction = await TransactionService.getTransactionById(id);
      
      if (!transaction) {
        res.status(404).json({ message: 'Transazione non trovata' });
        return;
      }
      
      res.json(transaction);
    } catch (error) {
      logger.error('Errore nel recupero della transazione:', error);
      res.status(500).json({ 
        message: 'Errore nel recupero della transazione',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Aggiunge una nuova transazione
   */
  static async addTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transactionData = {
        ...req.body,
        user: 'default_user' // In futuro, estrarre dall'autenticazione
      };
      
      const newTransaction = await TransactionService.addTransaction(transactionData);
      
      res.status(201).json(newTransaction);
    } catch (error) {
      logger.error('Errore nell\'aggiunta della transazione:', error);
      res.status(500).json({ 
        message: 'Errore nell\'aggiunta della transazione',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Registra un airdrop (acquisizione gratuita di crypto)
   */
  static async recordAirdrop(req: Request, res: Response): Promise<void> {
    try {
      const airdropData = {
        ...req.body,
        user: 'default_user' // In futuro, estrarre dall'autenticazione
      };
      
      const newAirdrop = await TransactionService.recordAirdrop(airdropData);
      
      res.status(201).json({
        success: true,
        message: `Airdrop di ${airdropData.quantity} ${airdropData.cryptoSymbol.toUpperCase()} registrato con successo`,
        transaction: newAirdrop
      });
    } catch (error) {
      logger.error('Errore nella registrazione dell\'airdrop:', error);
      res.status(500).json({ 
        success: false,
        message: 'Errore nella registrazione dell\'airdrop',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Registra una transazione di farming (reward da staking/liquidity)
   */
  static async recordFarming(req: Request, res: Response): Promise<void> {
    try {
      const farmingData = {
        ...req.body,
        user: 'default_user' // In futuro, estrarre dall'autenticazione
      };
      
      const newFarming = await TransactionService.recordFarming(farmingData);
      
      res.status(201).json({
        success: true,
        message: `Farming di ${farmingData.quantity} ${farmingData.cryptoSymbol.toUpperCase()} registrato con successo`,
        transaction: newFarming
      });
    } catch (error) {
      logger.error('Errore nella registrazione del farming:', error);
      res.status(500).json({ 
        success: false,
        message: 'Errore nella registrazione del farming',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Aggiorna una transazione esistente
   */
  static async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transactionData = req.body;
      
      const updatedTransaction = await TransactionService.updateTransaction(id, transactionData);
      
      if (!updatedTransaction) {
        res.status(404).json({ message: 'Transazione non trovata' });
        return;
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      logger.error('Errore nell\'aggiornamento della transazione:', error);
      res.status(500).json({ 
        message: 'Errore nell\'aggiornamento della transazione',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Elimina una transazione
   */
  static async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const result = await TransactionService.deleteTransaction(id);
      
      if (!result) {
        res.status(404).json({ message: 'Transazione non trovata' });
        return;
      }
      
      res.json({ message: 'Transazione eliminata con successo' });
    } catch (error) {
      logger.error('Errore nell\'eliminazione della transazione:', error);
      res.status(500).json({ 
        message: 'Errore nell\'eliminazione della transazione',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export default TransactionController;