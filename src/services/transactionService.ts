// src/services/transactionService.ts

import mongoose from 'mongoose';
import Transaction, { ITransaction, TransactionType, PaymentMethod, STABLECOINS } from '../models/Transaction';
import Portfolio from '../models/Portfolio';
import RealizedProfit from '../models/RealizedProfit';
import logger from '../utils/logger';

/**
 * Classe di servizio per la gestione delle transazioni
 * Implementa logica modulare per ogni tipo di transazione
 */
class TransactionService {
  /**
   * Recupera tutte le transazioni di un utente
   * @param user - ID dell'utente
   * @param filter - Filtri opzionali (tipo, simbolo, ecc.)
   * @returns Lista di transazioni
   */
  static async getAllTransactions(user: string, filter: any = {}): Promise<ITransaction[]> {
    try {
      const query = { user, ...filter };
      return await Transaction.find(query).sort({ date: -1 });
    } catch (error) {
      logger.error('Errore nel recupero delle transazioni:', error);
      throw error;
    }
  }

  /**
   * Recupera una transazione specifica
   * @param id - ID della transazione
   * @returns Transazione trovata o null
   */
  static async getTransactionById(id: string): Promise<ITransaction | null> {
    try {
      return await Transaction.findById(id);
    } catch (error) {
      logger.error(`Errore nel recupero della transazione ${id}:`, error);
      throw error;
    }
  }

  /**
   * Aggiunge una nuova transazione
   * @param transactionData - Dati della transazione
   * @returns Transazione creata
   */
  static async addTransaction(transactionData: any): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Crea e salva la transazione
      const newTransaction = new Transaction({
        ...transactionData,
        user: transactionData.user || 'default_user'
      });
      
      await newTransaction.save({ session });
      
      // 2. Aggiorna il portafoglio
      await this.updatePortfolioAfterTransaction(newTransaction, session);
      
      // 3. Se è una vendita verso stablecoin, registra il profitto/perdita
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
      logger.error('Errore nell\'aggiunta della transazione:', error);
      throw error;
    }
  }

  /**
   * Aggiorna una transazione esistente
   * @param id - ID della transazione
   * @param transactionData - Nuovi dati
   * @returns Transazione aggiornata
   */
  static async updateTransaction(id: string, transactionData: any): Promise<ITransaction | null> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Recupera la transazione originale
      const originalTransaction = await Transaction.findById(id).session(session);
      if (!originalTransaction) {
        throw new Error('Transazione non trovata');
      }
      
      // 2. Aggiorna la transazione
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        id,
        { ...transactionData },
        { new: true, session }
      );
      
      if (!updatedTransaction) {
        throw new Error('Aggiornamento transazione fallito');
      }
      
      // 3. Ricalcola il portafoglio dell'utente
      // Nota: ricalcoliamo interamente il portafoglio per garantire coerenza
      // (una soluzione più ottimizzata richiederebbe una logica complessa di delta)
      await this.recalculateEntirePortfolio(updatedTransaction.user, session);
      
      // 4. Se necessario, aggiorna anche il profitto/perdita realizzato
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
      logger.error(`Errore nell'aggiornamento della transazione ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una transazione
   * @param id - ID della transazione
   * @returns True se l'eliminazione ha avuto successo
   */
  static async deleteTransaction(id: string): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Recupera la transazione prima di eliminarla
      const transaction = await Transaction.findById(id).session(session);
      if (!transaction) {
        throw new Error('Transazione non trovata');
      }
      
      // 2. Memorizza l'ID utente per ricalcolare il portafoglio dopo
      const userId = transaction.user;
      
      // 3. Elimina la transazione
      await Transaction.findByIdAndDelete(id).session(session);
      
      // 4. Se era una vendita a stablecoin, elimina anche il profit realizzato
      if (transaction.type === TransactionType.SELL && 
          transaction.paymentMethod === PaymentMethod.CRYPTO && 
          STABLECOINS.includes(transaction.paymentCurrency?.toUpperCase() || '')) {
        await RealizedProfit.deleteOne({ 
          originalTransactionId: transaction._id 
        }).session(session);
      }
      
      // 5. Ricalcola il portafoglio
      await this.recalculateEntirePortfolio(userId, session);
      
      await session.commitTransaction();
      session.endSession();
      
      return true;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`Errore nell'eliminazione della transazione ${id}:`, error);
      throw error;
    }
  }

  /**
   * Registra un airdrop (acquisizione gratuita di crypto)
   * @param airdropData - Dati dell'airdrop
   * @returns Transazione creata
   */
  static async recordAirdrop(airdropData: any): Promise<ITransaction> {
    try {
      // Verifica che i campi richiesti siano presenti
      if (!airdropData.cryptoSymbol || !airdropData.quantity) {
        throw new Error('Simbolo della criptovaluta e quantità sono obbligatori');
      }
      
      // Prepara i dati della transazione
      const transactionData = {
        user: airdropData.user || 'default_user',
        cryptoSymbol: airdropData.cryptoSymbol.toUpperCase(),
        type: TransactionType.AIRDROP,
        quantity: airdropData.quantity,
        pricePerUnit: 0, // Sempre a zero per gli airdrop
        totalAmount: 0,  // Sempre a zero per gli airdrop
        date: airdropData.date || new Date(),
        notes: airdropData.notes,
        category: airdropData.category
      };
      
      // Usa il metodo generale per aggiungere la transazione
      return await this.addTransaction(transactionData);
    } catch (error) {
      logger.error('Errore nella registrazione dell\'airdrop:', error);
      throw error;
    }
  }

  /**
   * Registra una transazione di farming (reward da staking/liquidity)
   * @param farmingData - Dati del farming
   * @returns Transazione creata
   */
  static async recordFarming(farmingData: any): Promise<ITransaction> {
    try {
      // Verifica che i campi richiesti siano presenti
      if (!farmingData.cryptoSymbol || !farmingData.quantity) {
        throw new Error('Simbolo della criptovaluta e quantità sono obbligatori');
      }
      
      // Prepara i dati della transazione
      const transactionData = {
        user: farmingData.user || 'default_user',
        cryptoSymbol: farmingData.cryptoSymbol.toUpperCase(),
        type: TransactionType.FARMING,
        quantity: farmingData.quantity,
        pricePerUnit: 0, // Sempre a zero per il farming
        totalAmount: 0,  // Sempre a zero per il farming
        date: farmingData.date || new Date(),
        notes: farmingData.notes,
        category: farmingData.category,
        paymentMethod: PaymentMethod.CRYPTO, // Sempre crypto per il farming
        paymentCurrency: farmingData.paymentCurrency || farmingData.cryptoSymbol.toUpperCase() // La crypto di origine
      };
      
      // Usa il metodo generale per aggiungere la transazione
      return await this.addTransaction(transactionData);
    } catch (error) {
      logger.error('Errore nella registrazione del farming:', error);
      throw error;
    }
  }

  /**
   * Aggiorna il portafoglio dopo una transazione
   * @param transaction - Transazione che ha innescato l'aggiornamento
   * @param session - Sessione MongoDB attiva
   */
  private static async updatePortfolioAfterTransaction(
    transaction: ITransaction, 
    session: mongoose.ClientSession
  ): Promise<void> {
    try {
      // Per semplicità e consistenza, ricalcoliamo l'intero portafoglio
      // Questo approccio è più robusto, anche se meno efficiente
      await this.recalculateEntirePortfolio(transaction.user, session);
    } catch (error) {
      logger.error('Errore nell\'aggiornamento del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Registra un profitto/perdita realizzato da una vendita a stablecoin
   * @param transaction - Transazione di vendita
   * @param session - Sessione MongoDB attiva
   */
  private static async recordRealizedProfit(
    transaction: ITransaction, 
    session: mongoose.ClientSession
  ): Promise<void> {
    try {
      // Recupera il portafoglio per ottenere il prezzo medio di acquisto
      const portfolio = await Portfolio.findOne({ user: transaction.user }).session(session);
      if (!portfolio) {
        throw new Error('Portafoglio non trovato');
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
      
      logger.info(`Profitto/perdita realizzato registrato: ${realizedProfitLoss} (${profitLossPercentage.toFixed(2)}%)`);
    } catch (error) {
      logger.error('Errore nella registrazione del profitto/perdita realizzato:', error);
      throw error;
    }
  }

  /**
   * Ricalcola l'intero portafoglio di un utente basato sulle sue transazioni
   * @param user - ID dell'utente
   * @param session - Sessione MongoDB opzionale
   */
  static async recalculateEntirePortfolio(
    user: string,
    session?: mongoose.ClientSession
  ): Promise<any> {
    try {
      // Ottieni tutte le transazioni dell'utente, escludendo quelle generate automaticamente
      // e ordinandole per data
      const transactions = await Transaction.find({ 
        user,
        isAutoGenerated: { $ne: true } 
      }).sort({ date: 1 }).session(session || null);
      
      // Crea un nuovo portafoglio vuoto (o recupera quello esistente)
      let portfolio = await Portfolio.findOne({ user }).session(session || null);
      if (!portfolio) {
        portfolio = new Portfolio({
          user,
          assets: [],
          lastUpdated: new Date()
        });
      } else {
        // Resetta gli asset se il portafoglio esiste già
        portfolio.assets = [];
      }
      
      logger.info(`Ricalcolo portafoglio per utente ${user}: ${transactions.length} transazioni originali trovate`);
      
      // Elabora ogni transazione per ricostruire il portafoglio
      for (const tx of transactions) {
        // Normalizza il simbolo della criptovaluta per evitare problemi di case-sensitivity
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
          await this.processSellTransaction(portfolio, tx, assetIndex, normalizedSymbol, user, session);
        }
      }

      // Correggi eventuali prezzi medi anomali
      portfolio.assets.forEach(asset => {
        // Se il prezzo medio è NaN, Infinity, null, undefined o negativo, imposta un valore di default
        if (isNaN(asset.averagePrice) || !isFinite(asset.averagePrice) || 
            asset.averagePrice === null || asset.averagePrice === undefined || 
            asset.averagePrice < 0) {
          
          logger.info(`Corretto prezzo medio anomalo per ${asset.cryptoSymbol}: era ${asset.averagePrice}, impostato a 0`);
          asset.averagePrice = 0;
        }
      });

      // NON rimuoviamo gli asset con quantità zero dal database
      // per mantenere la cronologia e permettere report storici
      
      portfolio.lastUpdated = new Date();
      await portfolio.save({ session });
      logger.info(`Portafoglio salvato: ${portfolio.assets.length} asset totali`);
      
      return portfolio;
    } catch (error) {
      logger.error('Errore nel ricalcolo del portafoglio:', error);
      throw error;
    }
  }

  /**
   * Elabora una transazione di tipo acquisizione (acquisto o airdrop)
   */
  private static async processAcquisitionTransaction(
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
      logger.info(`Aggiunto nuovo asset (${tx.type}): ${normalizedSymbol}, Quantità=${tx.quantity}`);
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
      
      logger.info(`${tx.type} aggiornato: ${normalizedSymbol}, Nuova quantità=${asset.quantity}, Nuovo prezzo medio=${asset.averagePrice}`);
    }
  }

  /**
   * Elabora una transazione di tipo farming
   */
  private static async processFarmingTransaction(
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
      logger.info(`Aggiunto nuovo asset da farming: ${normalizedSymbol}, Quantità=${tx.quantity}`);
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
      logger.info(`Farming aggiornato: ${normalizedSymbol}, Nuova quantità=${asset.quantity}`);
    }
  }

  /**
   * Elabora una transazione di vendita
   */
  private static async processSellTransaction(
    portfolio: any, 
    tx: ITransaction, 
    assetIndex: number,
    normalizedSymbol: string,
    user: string,
    session?: mongoose.ClientSession
  ): Promise<void> {
    if (assetIndex !== -1) {
      // L'asset esiste nel portafoglio
      const asset = portfolio.assets[assetIndex];
      logger.info(`Vendita: ${normalizedSymbol}, Quantità attuale=${asset.quantity}, Quantità da vendere=${tx.quantity}`);
      
      const oldQuantity = asset.quantity;
      
      // Sottrai la quantità venduta
      asset.quantity -= tx.quantity;
      
      logger.info(`Vendita completata: ${normalizedSymbol}, Nuova quantità=${asset.quantity}`);

      // Aggiorniamo il prezzo medio solo se passiamo da positivo a negativo
      if (oldQuantity > 0 && asset.quantity < 0) {
        asset.averagePrice = tx.pricePerUnit;
        logger.info(`Quantità passata da positiva a negativa, nuovo prezzo medio=${asset.averagePrice}`);
      }
    } else {
      // L'asset non esiste nel portafoglio, lo creiamo con quantità negativa
      logger.info(`Vendita di asset non presente nel portafoglio: ${normalizedSymbol}, creazione con saldo negativo`);
      
      portfolio.assets.push({
        cryptoSymbol: normalizedSymbol,
        quantity: -tx.quantity, // Inizializza con quantità negativa
        averagePrice: tx.pricePerUnit, // Il prezzo medio è il prezzo della vendita
        category: tx.category,
        type: 'crypto'
      });
      
      logger.info(`Creato nuovo asset con quantità negativa: ${normalizedSymbol}, Quantità=-${tx.quantity}`);
    }
    
    // Gestione speciale per le vendite con metodo di pagamento crypto (stablecoin)
    if (tx.paymentMethod === PaymentMethod.CRYPTO && tx.paymentCurrency) {
      const stablecoinSymbol = tx.paymentCurrency.trim().toUpperCase();
      
      // Verifica se è una stablecoin riconosciuta
      if (STABLECOINS.includes(stablecoinSymbol)) {
        logger.info(`Vendita con ricezione di stablecoin: ${stablecoinSymbol}`);
        
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
          
          logger.info(`Aggiunta nuova stablecoin: ${stablecoinSymbol}, Quantità=${stablecoinAmount}`);
        } else {
          // Se la stablecoin esiste, aumentiamo la quantità
          const stablecoinAsset = portfolio.assets[stablecoinIndex];
          stablecoinAsset.quantity += stablecoinAmount;
          
          logger.info(`Aggiornata stablecoin: ${stablecoinSymbol}, Nuova quantità=${stablecoinAsset.quantity}`);
        }
        
        // Registra una transazione di acquisto automatico per la stablecoin
        const stablecoinTransaction = new Transaction({
          user,
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
        logger.info(`Creata transazione automatica per acquisto di ${stablecoinAmount} ${stablecoinSymbol}`);
      }
    }
  }
}

export default TransactionService;