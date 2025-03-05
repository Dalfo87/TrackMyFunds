import express from 'express';
import Transaction, { ITransaction, TransactionType } from '../models/Transaction';
import Portfolio from '../models/Portfolio';

// Definisci esplicitamente il router
const router = express.Router();

// Definisci un tipo personalizzato per i gestori delle richieste
type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next?: express.NextFunction
) => Promise<any> | any;

/**
 * Ricalcola l'intero portafoglio basandosi su tutte le transazioni
 * Questa è una soluzione più robusta rispetto a cercare di invertire l'effetto di una singola transazione
 */
async function recalculatePortfolio(user: string) {
  try {
    // Ottieni tutte le transazioni dell'utente, ordinate per data
    const transactions = await Transaction.find({ user }).sort({ date: 1 });
    
    // Crea un nuovo portafoglio vuoto (o recupera quello esistente)
    let portfolio = await Portfolio.findOne({ user });
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
    
    // Elabora ogni transazione per ricostruire il portafoglio
    for (const tx of transactions) {
      // Trova l'asset nel portafoglio
      const assetIndex = portfolio.assets.findIndex(
        asset => asset.cryptoSymbol === tx.cryptoSymbol
      );
      
      if (tx.type === TransactionType.BUY || tx.type === TransactionType.AIRDROP) {
        // Gestione dell'acquisto o airdrop
        if (assetIndex === -1) {
          // Se l'asset non esiste nel portafoglio, aggiungilo
          portfolio.assets.push({
            cryptoSymbol: tx.cryptoSymbol,
            quantity: tx.quantity,
            averagePrice: tx.type === TransactionType.AIRDROP ? 0 : tx.pricePerUnit,
            category: tx.category
          });
        } else {
          // Se l'asset esiste, aggiorna quantità e prezzo medio
          const asset = portfolio.assets[assetIndex];
          
          if (tx.type === TransactionType.AIRDROP) {
            // Per gli airdrop, aumentiamo la quantità ma calcoliamo il nuovo prezzo medio
            if (asset.quantity === 0) {
              asset.averagePrice = 0;
            } else {
              const totalValue = asset.quantity * asset.averagePrice;
              asset.averagePrice = totalValue / (asset.quantity + tx.quantity);
            }
            asset.quantity += tx.quantity;
          } else {
            // Per gli acquisti normali, aggiorniamo il prezzo medio pesato
            const totalValue = asset.quantity * asset.averagePrice + tx.quantity * tx.pricePerUnit;
            const newQuantity = asset.quantity + tx.quantity;
            asset.averagePrice = totalValue / newQuantity;
            asset.quantity = newQuantity;
          }
          
          if (tx.category) asset.category = tx.category;
        }
      } else if (tx.type === TransactionType.SELL) {
        // Gestione della vendita
        if (assetIndex !== -1) {
          const asset = portfolio.assets[assetIndex];
          if (asset.quantity >= tx.quantity) {
            // Riduci la quantità, ma mantieni lo stesso prezzo medio
            asset.quantity -= tx.quantity;
            
            // Se la quantità è 0, rimuovi l'asset dal portafoglio
            if (asset.quantity === 0) {
              portfolio.assets.splice(assetIndex, 1);
            }
          }
        }
      }
    }
    
    portfolio.lastUpdated = new Date();
    await portfolio.save();
    return portfolio;
  } catch (error) {
    console.error('Errore nel ricalcolo del portafoglio:', error);
    throw error;
  }
}

// Funzione per recuperare tutte le transazioni
const getAllTransactions: RequestHandler = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: 'default_user' })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Errore nel recupero delle transazioni:', error);
    res.status(500).json({ message: 'Errore nel recupero delle transazioni' });
  }
};

// Funzione per recuperare una transazione specifica
const getTransactionById: RequestHandler = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transazione non trovata' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Errore nel recupero della transazione:', error);
    res.status(500).json({ message: 'Errore nel recupero della transazione' });
  }
};

// Funzione per aggiungere una nuova transazione
const addTransaction: RequestHandler = async (req, res) => {
  try {
    const { 
      cryptoSymbol, 
      type, 
      quantity, 
      pricePerUnit, 
      fees, 
      notes, 
      date,
      category 
    } = req.body;
    
    // Calcola l'importo totale
    const totalAmount = quantity * pricePerUnit;
    
    // Crea una nuova transazione
    const newTransaction = new Transaction({
      user: 'default_user',
      cryptoSymbol: cryptoSymbol.toUpperCase(),
      type,
      quantity,
      pricePerUnit,
      totalAmount,
      fees,
      notes,
      date: date || new Date(),
      category
    });
    
    await newTransaction.save();
    
    // Ricalcola l'intero portafoglio invece di aggiornarlo incrementalmente
    await recalculatePortfolio('default_user');
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Errore nell\'aggiunta della transazione:', error);
    res.status(500).json({ message: 'Errore nell\'aggiunta della transazione' });
  }
};

// Funzione per registrare un airdrop
const recordAirdrop: RequestHandler = async (req, res) => {
  try {
    const {
      cryptoSymbol,
      quantity,
      date,
      notes,
      category
    } = req.body;
    
    // Verifica che i campi richiesti siano presenti
    if (!cryptoSymbol || !quantity) {
      return res.status(400).json({ 
        success: false,
        message: 'Simbolo della criptovaluta e quantità sono obbligatori' 
      });
    }
    
    // Crea una nuova transazione di tipo AIRDROP
    const newAirdrop = new Transaction({
      user: 'default_user',
      cryptoSymbol: cryptoSymbol.toUpperCase(),
      type: TransactionType.AIRDROP,
      quantity,
      pricePerUnit: 0, // Prezzo sempre a zero per gli airdrop
      totalAmount: 0,  // Importo totale sempre a zero per gli airdrop
      date: date || new Date(),
      notes,
      category
    });
    
    await newAirdrop.save();
    
    // Ricalcola l'intero portafoglio
    await recalculatePortfolio('default_user');
    
    res.status(201).json({
      success: true,
      message: `Airdrop di ${quantity} ${cryptoSymbol.toUpperCase()} registrato con successo`,
      transaction: newAirdrop
    });
  } catch (error) {
    console.error('Errore nella registrazione dell\'airdrop:', error);
    res.status(500).json({ 
      success: false,
      message: 'Errore nella registrazione dell\'airdrop',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Funzione per aggiornare una transazione esistente
const updateTransaction: RequestHandler = async (req, res) => {
  try {
    // Prima ottieni la transazione originale
    const originalTransaction = await Transaction.findById(req.params.id);
    if (!originalTransaction) {
      return res.status(404).json({ message: 'Transazione non trovata' });
    }
    
    // Aggiorna la transazione
    const { 
      cryptoSymbol, 
      type, 
      quantity, 
      pricePerUnit, 
      fees, 
      notes, 
      date,
      category 
    } = req.body;
    
    const totalAmount = quantity * pricePerUnit;
    
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        cryptoSymbol: cryptoSymbol.toUpperCase(),
        type,
        quantity,
        pricePerUnit,
        totalAmount,
        fees,
        notes,
        date: date || originalTransaction.date,
        category
      },
      { new: true }
    );
    
    // Ricalcola l'intero portafoglio
    await recalculatePortfolio('default_user');
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della transazione:', error);
    res.status(500).json({ message: 'Errore nell\'aggiornamento della transazione' });
  }
};

// Funzione per eliminare una transazione
const deleteTransaction: RequestHandler = async (req, res) => {
  try {
    // Prima ottieni la transazione
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transazione non trovata' });
    }
    
    // Elimina la transazione
    await Transaction.findByIdAndDelete(req.params.id);
    
    // Ricalcola l'intero portafoglio
    await recalculatePortfolio('default_user');
    
    res.json({ message: 'Transazione eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione della transazione:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione della transazione' });
  }
};

// Registra le route con le funzioni nominate
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.post('/', addTransaction);
router.post('/airdrop', recordAirdrop);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;