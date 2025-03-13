// src/modules/transactions/services/transaction.service.ts
import mongoose from 'mongoose';
import { TransactionRepository } from '../repositories/transaction.repository';
import { Transaction, ITransaction } from '../models/transaction.model';
import { CreateTransactionDto, UpdateTransactionDto, AirdropDto, FarmingDto, FilterTransactionsDto } from '../dtos/transaction-dtos';
import { ApiError } from '../../../shared/utils/errorHandler';
import { Logger } from '../../../shared/utils/logger';
import { TransactionType, PaymentMethod } from '../../../shared/types/transaction.types';
import { STABLECOINS } from '../../../shared/constants/crypto.constants';
import { Portfolio } from '../../../modules/portfolio/models/portfolio.model';
import { RealizedProfit } from '../../../modules/realizedProfit/models/realizedProfit.model';

export class TransactionService {
  constructor(private transactionRepository: TransactionRepository) {}

  /**
   * Recupera tutte le transazioni di un utente
   */
  async getAllTransactions(userId: string, filters?: FilterTransactionsDto): Promise<ITransaction[]> {
    try {
      return await this.transactionRepository.findAllByUser(userId, filters);
    } catch (error) {
      Logger.error('Errore nel servizio getAllTransactions:', error);
      throw new ApiError(500, 'Errore nel recupero delle transazioni');
    }
  }

  /**
   * Recupera una transazione specifica
   */
  async getTransactionById(id: string): Promise<ITransaction> {
    try {
      const transaction = await this.transactionRepository.findById(id);
      
      if (!transaction) {
        throw new ApiError(404, 'Transazione non trovata');
      }
      
      return transaction;
    } catch (error) {
      Logger.error(`Errore nel servizio getTransactionById (ID: ${id}):`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nel recupero della transazione');
    }
  }

  /**
   * Aggiunge una nuova transazione
   */
  async addTransaction(userId: string, transactionData: CreateTransactionDto): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Crea e salva la transazione
      const newTransaction = new Transaction({
        ...transactionData,
        user: userId
      });
      
      await newTransaction.save({ session });
      
      // Aggiorna il portafoglio
      await this.updatePortfolioAfterTransaction(newTransaction, session);
      
      // Se è una vendita verso stablecoin, registra il profitto/perdita
      if (newTransaction.type === TransactionType.SELL && 
          newTransaction.paymentMethod === PaymentMethod.CRYPTO && 
          STABLECOINS.includes(newTransaction.paymentCurrency?.toUpperCase() || '')) {
        await this.recordRealizedProfit(newTransaction, session);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      return newTransaction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      Logger.error('Errore nel servizio addTransaction:', error);
      throw new ApiError(500, 'Errore nell\'aggiunta della transazione');
    }
  }

  /**
   * Aggiorna una transazione esistente
   */
  async updateTransaction(id: string, transactionData: UpdateTransactionDto): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Recupera la transazione originale
      const originalTransaction = await Transaction.findById(id).session(session);
      
      if (!originalTransaction) {
        throw new ApiError(404, 'Transazione non trovata');
      }
      
      // Aggiorna la transazione
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        { ...transactionData },
        { new: true, session }
      );
      
      if (!updatedTransaction) {
        throw new ApiError(500, 'Aggiornamento transazione fallito');
      }
      
      // Ricalcola il portafoglio dell'utente
      await this.recalculateEntirePortfolio(updatedTransaction.user, session);
      
      // Gestione del profitto/perdita realizzato
      if (originalTransaction.type === TransactionType.SELL && 
          originalTransaction.paymentMethod === PaymentMethod.CRYPTO && 
          STABLECOINS.includes(originalTransaction.paymentCurrency?.toUpperCase() || '')) {
        // Elimina il record precedente
        await RealizedProfit.deleteOne({ 
          originalTransactionId: originalTransaction._id 
        }).session(session);
        
        // Se la transazione aggiornata è ancora una vendita verso stablecoin, crea un nuovo record
        if (updatedTransaction.type === TransactionType.SELL && 
            updatedTransaction.paymentMethod === PaymentMethod.CRYPTO && 
            STABLECOINS.includes(updatedTransaction.paymentCurrency?.toUpperCase() || '')) {
          await this.recordRealizedProfit(updatedTransaction, session);
        }
      } else if (updatedTransaction.type === TransactionType.SELL && 
                updatedTransaction.paymentMethod === PaymentMethod.CRYPTO && 
                STABLECOINS.includes(updatedTransaction.paymentCurrency?.toUpperCase() || '')) {
        // La transazione originale non era una vendita a stablecoin, ma quella nuova lo è
        await this.recordRealizedProfit(updatedTransaction, session);
      }
      
      await session.commitTransaction();
      session.endSession();
      
      return updatedTransaction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      Logger.error(`Errore nel servizio updateTransaction (ID: ${id}):`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nell\'aggiornamento della transazione');
    }
  }

  /**
   * Elimina una transazione
   */
  async deleteTransaction(id: string): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Recupera la transazione prima di eliminarla
      const transaction = await Transaction.findById(id).session(session);
      
      if (!transaction) {
        throw new ApiError(404, 'Transazione non trovata');
      }
      
      // Memorizza l'ID utente per ricalcolare il portafoglio dopo
      const userId = transaction.user;
      
      // Elimina la transazione
      await Transaction.findByIdAndDelete(id).session(session);
      
      // Se era una vendita a stablecoin, elimina anche il profit realizzato
      if (transaction.type === TransactionType.SELL && 
          transaction.paymentMethod === PaymentMethod.CRYPTO && 
          STABLECOINS.includes(transaction.paymentCurrency?.toUpperCase() || '')) {
        await RealizedProfit.deleteOne({ 
          originalTransactionId: transaction._id 
        }).session(session);
      }
      
      // Ricalcola il portafoglio
      await this.recalculateEntirePortfolio(userId, session);
      
      await session.commitTransaction();
      session.endSession();
      
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      Logger.error(`Errore nel servizio deleteTransaction (ID: ${id}):`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nell\'eliminazione della transazione');
    }
  }

  /**
   * Registra un airdrop (acquisizione gratuita di crypto)
   */
  async recordAirdrop(userId: string, airdropData: AirdropDto): Promise<ITransaction> {
    try {
      // Verifica che i campi richiesti siano presenti
      if (!airdropData.cryptoSymbol || !airdropData.quantity) {
        throw new ApiError(400, 'Simbolo della criptovaluta e quantità sono obbligatori');
      }
      
      // Prepara i dati della transazione
      const transactionData = {
        cryptoSymbol: airdropData.cryptoSymbol,
        type: TransactionType.AIRDROP,
        quantity: airdropData.quantity,
        pricePerUnit: 0, // Sempre a zero per gli airdrop
        totalAmount: 0,  // Sempre a zero per gli airdrop
        date: airdropData.date || new Date(),
        notes: airdropData.notes,
        category: airdropData.category
      };
      
      // Usa il metodo generale per aggiungere la transazione
      return await this.addTransaction(userId, transactionData);
    } catch (error) {
      Logger.error('Errore nel servizio recordAirdrop:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nella registrazione dell\'airdrop');
    }
  }

  /**
   * Registra una transazione di farming (reward da staking/liquidity)
   */
  async recordFarming(userId: string, farmingData: FarmingDto): Promise<ITransaction> {
    try {
      // Verifica che i campi richiesti siano presenti
      if (!farmingData.cryptoSymbol || !farmingData.quantity) {
        throw new ApiError(400, 'Simbolo della criptovaluta e quantità sono obbligatori');
      }
      
      // Prepara i dati della transazione
      const transactionData = {
        cryptoSymbol: farmingData.cryptoSymbol,
        type: TransactionType.FARMING,
        quantity: farmingData.quantity,
        pricePerUnit: 0, // Sempre a zero per il farming
        totalAmount: 0,  // Sempre a zero per il farming
        date: farmingData.date || new Date(),
        notes: farmingData.notes,
        category: farmingData.category,
        paymentMethod: PaymentMethod.CRYPTO, // Sempre crypto per il farming
        paymentCurrency: farmingData.paymentCurrency || farmingData.cryptoSymbol // La crypto di origine
      };
      
      // Usa il metodo generale per aggiungere la transazione
      return await this.addTransaction(userId, transactionData);
    } catch (error) {
      Logger.error('Errore nel servizio recordFarming:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nella registrazione del farming');
    }
  }

  /**
   * Aggiorna il portafoglio dopo una transazione
   * @private
   */
  private async updatePortfolioAfterTransaction(
    transaction: ITransaction, 
    session: mongoose.ClientSession
  ): Promise<void> {
    try {
      // Per semplicità e consistenza, ricalcoliamo l'intero portafoglio
      await this.recalculateEntirePortfolio(transaction.user, session);
    } catch (error) {
      Logger.error('Errore nell\'aggiornamento del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Registra un profitto/perdita realizzato da una vendita a stablecoin
   * @private
   */
  private async recordRealizedProfit(
    transaction: ITransaction, 
    session: mongoose.ClientSession
  ): Promise<void> {
    try {
      // Recupera il portafoglio per ottenere il prezzo medio di acquisto
      const portfolio = await Portfolio.findOne({ user: transaction.user }).session(session);
      
      if (!portfolio) {
        throw new ApiError(404, 'Portafoglio non trovato');
      }
      
      // Cerca l'asset nel portafoglio (potrebbe non esistere più se è stato venduto tutto)
      const asset = portfolio.assets.find(
        a => a.cryptoSymbol.toUpperCase() === transaction.cryptoSymbol.toUpperCase()
      );
      
      // Se l'asset esiste ancora, usa il suo prezzo medio, altrimenti usa quello della transazione
      const averageBuyPrice = asset ? asset.averagePrice : transaction.pricePerUnit;
      
      // Calcola il profitto/perdita
      const costBasis = transaction.quantity * averageBuyPrice;
      const proceedsAmount = transaction.totalAmount;
      const realizedProfitLoss = proceedsAmount - costBasis;
      const profitLossPercentage = costBasis > 0 ? (realizedProfitLoss / costBasis) * 100 : 0;
      
      // Crea il record di profitto/perdita realizzato
      const realizedProfit = new RealizedProfit({
        user: transaction.user,
        sourceCryptoSymbol: transaction.cryptoSymbol,
        targetCurrency: transaction.paymentCurrency,
        isStablecoin: STABLECOINS.includes(transaction.paymentCurrency?.toUpperCase() || ''),
        soldQuantity: transaction.quantity,
        averageBuyPrice: averageBuyPrice,
        sellPrice: transaction.pricePerUnit,
        costBasis: costBasis,
        proceedsAmount: proceedsAmount,
        realizedProfitLoss: realizedProfitLoss,
        profitLossPercentage: profitLossPercentage,
        originalTransactionId: transaction._id,
        date: transaction.date,
        category: transaction.category,
        notes: transaction.notes
      });
      
      await realizedProfit.save({ session });
      
      Logger.info(`Profitto/perdita realizzato registrato: ${realizedProfitLoss} (${profitLossPercentage.toFixed(2)}%)`);
    } catch (error) {
      Logger.error('Errore nella registrazione del profitto/perdita realizzato:', error);
      throw error;
    }
  }

  /**
   * Ricalcola l'intero portafoglio di un utente basato sulle sue transazioni
   */
  async recalculateEntirePortfolio(
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<any> {
    try {
      // Ottieni tutte le transazioni dell'utente, escludendo quelle generate automaticamente
      // e ordinandole per data
      const transactions = await Transaction.find({ 
        user: userId,
        isAutoGenerated: { $ne: true } 
      }).sort({ date: 1 }).session(session || null);
      
      // Crea un nuovo portafoglio vuoto (o recupera quello esistente)
      let portfolio = await Portfolio.findOne({ user: userId }).session(session || null);
      
      if (!portfolio) {
        portfolio = new Portfolio({
          user: userId,
          assets: [],
          lastUpdated: new Date()
        });
      } else {
        // Resetta gli asset se il portafoglio esiste già
        portfolio.assets = [];
      }
      
      Logger.info(`Ricalcolo portafoglio per utente ${userId}: ${transactions.length} transazioni originali trovate`);
      
      // Elabora ogni transazione per ricostruire il portafoglio
      for (const tx of transactions) {
        // Normalizza il simbolo della criptovaluta
        const normalizedSymbol = tx.cryptoSymbol.trim().toUpperCase();
        
        // Trova l'asset nel portafoglio usando il simbolo normalizzato
        const assetIndex = portfolio.assets.findIndex(
          asset => asset.cryptoSymbol.trim().toUpperCase() === normalizedSymbol
        );
        
        // ACQUISTI E ACQUISIZIONI GRATUITE (BUY, AIRDROP)
        if (tx.type === TransactionType.BUY || tx.type === TransactionType.AIRDROP) {
          await this.processAcquisitionTransaction(portfolio, tx, assetIndex, normalizedSymbol);
        } 
        // FARMING
        else if (tx.type === TransactionType.FARMING) {
          await this.processFarmingTransaction(portfolio, tx, assetIndex, normalizedSymbol);
        }
        // VENDITE (SELL)
        else if (tx.type === TransactionType.SELL) {
          await this.processSellTransaction(portfolio, tx, assetIndex, normalizedSymbol, userId, session);
        }
      }

      // Correggi eventuali prezzi medi anomali
      portfolio.assets.forEach(asset => {
        // Se il prezzo medio è NaN, Infinity, null, undefined o negativo, imposta un valore di default
        if (isNaN(asset.averagePrice) || !isFinite(asset.averagePrice) || 
            asset.averagePrice === null || asset.averagePrice === undefined || 
            asset.averagePrice < 0) {
          Logger.info(`Corretto prezzo medio anomalo per ${asset.cryptoSymbol}: era ${asset.averagePrice}, impostato a 0`);
          asset.averagePrice = 0;
        }
      });

      portfolio.lastUpdated = new Date();
      await portfolio.save({ session });
      
      Logger.info(`Portafoglio salvato: ${portfolio.assets.length} asset totali`);
      
      return portfolio;
    } catch (error) {
      Logger.error('Errore nel ricalcolo del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Elabora una transazione di tipo acquisizione (acquisto o airdrop)
   * @private
   */
  private async processAcquisitionTransaction(
    portfolio: any, 
    tx: ITransaction, 
    assetIndex: number,
    normalizedSymbol: string
  ): Promise<void> {
    // Determina se questa è una transazione a costo zero
    const isZeroCost = tx.type === TransactionType.AIRDROP;
    const assetType = isZeroCost ? 'airdrop' : 'crypto';
    
    if (assetIndex === -1) {
      // Se l'asset non esiste nel portafoglio, aggiungilo
      portfolio.assets.push({
        cryptoSymbol: normalizedSymbol,
        quantity: tx.quantity,
        averagePrice: isZeroCost ? 0 : tx.pricePerUnit,
        category: tx.category,
        type: assetType
      });
    } else {
      // Se l'asset esiste, aggiorna quantità e prezzo medio
      const asset = portfolio.assets[assetIndex];
      
      if (isZeroCost) {
        // Per acquisizioni a costo zero, aggiusta il prezzo medio ponderato
        if (asset.quantity === 0) {
          asset.averagePrice = 0;
        } else {
          const totalValue = asset.quantity * asset.averagePrice;
          asset.averagePrice = totalValue / (asset.quantity + tx.quantity);
        }
      } else {
        // Per acquisti normali, calcola il nuovo prezzo medio ponderato
        const totalValue = asset.quantity * asset.averagePrice + tx.quantity * tx.pricePerUnit;
        const newQuantity = asset.quantity + tx.quantity;
        asset.averagePrice = totalValue / newQuantity;
      }
      
      // Incrementa la quantità in ogni caso
      asset.quantity += tx.quantity;
      
      // Aggiorna la categoria se fornita
      if (tx.category) asset.category = tx.category;
    }
  }

  /**
   * Elabora una transazione di tipo farming
   * @private
   */
  private async processFarmingTransaction(
    portfolio: any, 
    tx: ITransaction, 
    assetIndex: number,
    normalizedSymbol: string
  ): Promise<void> {
    if (assetIndex === -1) {
      // Se la crypto guadagnata non esiste nel portafoglio, la aggiungiamo
      portfolio.assets.push({
        cryptoSymbol: normalizedSymbol,
        quantity: tx.quantity,
        averagePrice: 0,  // Prezzo medio sempre a zero per il farming
        category: tx.category,
        type: 'farming'
      });
    } else {
      // Se la crypto guadagnata esiste, aumentiamo la quantità
      const asset = portfolio.assets[assetIndex];
      
      // Calcola il nuovo prezzo medio ponderato considerando che il farming è a costo zero
      if (asset.quantity === 0) {
        asset.averagePrice = 0;
      } else {
        const totalValue = asset.quantity * asset.averagePrice;
        asset.averagePrice = totalValue / (asset.quantity + tx.quantity);
      }
      
      asset.quantity += tx.quantity;
    }
  }

  /**
   * Elabora una transazione di vendita
   * @private
   */
  private async processSellTransaction(
    portfolio: any, 
    tx: ITransaction, 
    assetIndex: number,
    normalizedSymbol: string,
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    if (assetIndex !== -1) {
      // L'asset esiste nel portafoglio
      const asset = portfolio.assets[assetIndex];
      
      const oldQuantity = asset.quantity;
      
      // Sottrai la quantità venduta
      asset.quantity -= tx.quantity;

      // Aggiorniamo il prezzo medio solo se passiamo da positivo a negativo
      if (oldQuantity > 0 && asset.quantity < 0) {
        asset.averagePrice = tx.pricePerUnit;
      }
    } else {
      // L'asset non esiste nel portafoglio, lo creiamo con quantità negativa
      portfolio.assets.push({
        cryptoSymbol: normalizedSymbol,
        quantity: -tx.quantity, // Inizializza con quantità negativa
        averagePrice: tx.pricePerUnit, // Il prezzo medio è il prezzo della vendita
        category: tx.category,
        type: 'crypto'
      });
    }
    
    // Gestione speciale per le vendite con metodo di pagamento crypto (stablecoin)
    if (tx.paymentMethod === PaymentMethod.CRYPTO && tx.paymentCurrency) {
      const stablecoinSymbol = tx.paymentCurrency.trim().toUpperCase();
      
      // Verifica se è una stablecoin riconosciuta
      if (STABLECOINS.includes(stablecoinSymbol)) {
        // Calcola l'importo in stablecoin (1:1 con USD)
        const stablecoinAmount = tx.totalAmount;
        
        // Cerca la stablecoin nel portafoglio
        const stablecoinIndex = portfolio.assets.findIndex(
          (asset: { cryptoSymbol: string }) => asset.cryptoSymbol.trim().toUpperCase() === stablecoinSymbol
        );
        
        if (stablecoinIndex === -1) {
          // Se la stablecoin non esiste, la aggiungiamo
          portfolio.assets.push({
            cryptoSymbol: stablecoinSymbol,
            quantity: stablecoinAmount,
            averagePrice: 1.0, // Le stablecoin hanno sempre prezzo 1:1 con USD
            category: 'stablecoin',
            type: 'stablecoin'
          });
        } else {
          // Se la stablecoin esiste, aumentiamo la quantità
          const stablecoinAsset = portfolio.assets[stablecoinIndex];
          stablecoinAsset.quantity += stablecoinAmount;
        }
        
        // Registra una transazione di acquisto automatico per la stablecoin
        const stablecoinTransaction = new Transaction({
          user: userId,
          cryptoSymbol: stablecoinSymbol,
          type: TransactionType.BUY,
          quantity: stablecoinAmount,
          pricePerUnit: 1.0, // Prezzo fisso 1:1 con USD
          totalAmount: stablecoinAmount,
          date: tx.date,
          notes: `Generato automaticamente dalla vendita di ${tx.quantity} ${normalizedSymbol}`,
          category: 'stablecoin',
          paymentMethod: PaymentMethod.CRYPTO,
          paymentCurrency: normalizedSymbol,
          isAutoGenerated: true // Flag per indicare che è generata automaticamente
        });
        
        // Salva la transazione stablecoin nel database
        await stablecoinTransaction.save({ session });
      }
    }
  }
}