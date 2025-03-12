// src/modules/transactions/repositories/transaction.repository.ts
import { BaseRepository } from '../../../shared/repositories/baseRepository';
import { Transaction, ITransaction } from '../models/transaction.model';
import { FilterTransactionsDto } from '../dtos/transaction-dtos';
import { Logger } from '../../../shared/utils/logger';

export class TransactionRepository extends BaseRepository<ITransaction> {
  constructor() {
    super(Transaction);
  }

  /**
   * Trova tutte le transazioni di un utente con filtri opzionali
   */
  async findAllByUser(userId: string, filters?: FilterTransactionsDto): Promise<ITransaction[]> {
    try {
      const query: any = { user: userId };
      
      if (filters) {
        // Applica i filtri se presenti
        if (filters.type) {
          query.type = filters.type;
        }
        
        if (filters.cryptoSymbol) {
          query.cryptoSymbol = filters.cryptoSymbol.toUpperCase();
        }
        
        // Filtro per data
        if (filters.startDate || filters.endDate) {
          query.date = {};
          
          if (filters.startDate) {
            query.date.$gte = filters.startDate;
          }
          
          if (filters.endDate) {
            query.date.$lte = filters.endDate;
          }
        }
        
        if (filters.category) {
          query.category = filters.category;
        }
        
        if (filters.paymentMethod) {
          query.paymentMethod = filters.paymentMethod;
        }
      }
      
      return Transaction.find(query).sort({ date: -1 }).exec();
    } catch (error) {
      Logger.error('Errore nel repository durante il recupero delle transazioni:', error);
      throw error;
    }
  }

  /**
   * Trova tutte le transazioni di un tipo specifico per un utente
   */
  async findByType(userId: string, type: string): Promise<ITransaction[]> {
    return Transaction.find({ user: userId, type }).sort({ date: -1 }).exec();
  }

  /**
   * Trova tutte le transazioni per un simbolo crypto specifico
   */
  async findByCryptoSymbol(userId: string, cryptoSymbol: string): Promise<ITransaction[]> {
    return Transaction.find({ 
      user: userId, 
      cryptoSymbol: cryptoSymbol.toUpperCase() 
    }).sort({ date: -1 }).exec();
  }

  /**
   * Trova transazioni in un intervallo di date
   */
  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ITransaction[]> {
    return Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 }).exec();
  }

  /**
   * Trova transazioni per categoria
   */
  async findByCategory(userId: string, category: string): Promise<ITransaction[]> {
    return Transaction.find({
      user: userId,
      category
    }).sort({ date: -1 }).exec();
  }

  /**
   * Trova transazioni per metodo di pagamento
   */
  async findByPaymentMethod(userId: string, paymentMethod: string): Promise<ITransaction[]> {
    return Transaction.find({
      user: userId,
      paymentMethod
    }).sort({ date: -1 }).exec();
  }

  /**
   * Conta le transazioni per un determinato utente
   */
  async countByUser(userId: string): Promise<number> {
    return Transaction.countDocuments({ user: userId }).exec();
  }

  /**
   * Conta le transazioni per tipo
   */
  async countByType(userId: string, type: string): Promise<number> {
    return Transaction.countDocuments({ user: userId, type }).exec();
  }
}