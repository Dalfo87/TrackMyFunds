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
    
    // Aggiorna il portafoglio
    await updatePortfolio(
      'default_user', 
      cryptoSymbol.toUpperCase(), 
      type, 
      quantity, 
      pricePerUnit,
      category
    );
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Errore nell\'aggiunta della transazione:', error);
    res.status(500).json({ message: 'Errore nell\'aggiunta della transazione' });
  }
};

// Aggiungere alla sezione delle route nel file transactions.ts

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
    
    // Aggiorna il portafoglio
    await updatePortfolio(
      'default_user',
      cryptoSymbol.toUpperCase(),
      TransactionType.BUY, // Trattiamo l'airdrop come un acquisto per l'aggiornamento del portafoglio
      quantity,
      0,  // Prezzo zero
      category
    );
    
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

// Aggiungi la route
router.post('/airdrop', recordAirdrop);

// Funzione per aggiornare una transazione esistente
const updateTransaction: RequestHandler = async (req, res) => {
  try {
    // Prima ottieni la transazione originale
    const originalTransaction = await Transaction.findById(req.params.id);
    if (!originalTransaction) {
      return res.status(404).json({ message: 'Transazione non trovata' });
    }
    
    // Annulla l'effetto della transazione originale sul portafoglio
    await updatePortfolio(
      'default_user',
      originalTransaction.cryptoSymbol,
      originalTransaction.type === TransactionType.BUY ? TransactionType.SELL : TransactionType.BUY,
      originalTransaction.quantity,
      originalTransaction.pricePerUnit,
      originalTransaction.category
    );
    
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
    
    // Applica l'effetto della nuova transazione sul portafoglio
    await updatePortfolio(
      'default_user',
      cryptoSymbol.toUpperCase(),
      type,
      quantity,
      pricePerUnit,
      category
    );
    
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
    
    // Annulla l'effetto della transazione sul portafoglio
    await updatePortfolio(
      'default_user',
      transaction.cryptoSymbol,
      transaction.type === TransactionType.BUY ? TransactionType.SELL : TransactionType.BUY,
      transaction.quantity,
      transaction.pricePerUnit,
      transaction.category
    );
    
    // Elimina la transazione
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Transazione eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione della transazione:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione della transazione' });
  }
};

// Modifica della funzione updatePortfolio in transactions.ts

async function updatePortfolio(
  user: string,
  cryptoSymbol: string,
  type: string,
  quantity: number,
  pricePerUnit: number,
  category?: string
) {
  try {
    // Trova il portafoglio dell'utente
    let portfolio = await Portfolio.findOne({ user });

    // Se non esiste, creane uno nuovo
    if (!portfolio) {
      portfolio = new Portfolio({
        user,
        assets: [],
        lastUpdated: new Date()
      });
    }

    // Cerca l'asset nel portafoglio
    const assetIndex = portfolio.assets.findIndex(
      asset => asset.cryptoSymbol === cryptoSymbol
    );

    // Gestione dell'acquisto o airdrop
    if (type === TransactionType.BUY || type === TransactionType.AIRDROP) {
      if (assetIndex === -1) {
        // Se l'asset non esiste nel portafoglio, aggiungilo
        portfolio.assets.push({
          cryptoSymbol,
          quantity,
          averagePrice: pricePerUnit, // Per gli airdrop sarà 0
          category
        });
      } else {
        // Se l'asset esiste, aggiorna quantità e prezzo medio
        const asset = portfolio.assets[assetIndex];
        
        if (type === TransactionType.AIRDROP) {
          // Per gli airdrop, aumentiamo la quantità ma non alteriamo il prezzo medio
          // se non ci sono già acquisizioni
          if (asset.quantity === 0) {
            asset.averagePrice = 0;
          } else {
            // Se ci sono già acquisizioni, l'airdrop abbassa il prezzo medio
            const totalValue = asset.quantity * asset.averagePrice; // valore attuale
            asset.averagePrice = totalValue / (asset.quantity + quantity); // nuovo prezzo medio
          }
          asset.quantity += quantity;
        } else {
          // Per gli acquisti normali, aggiorniamo il prezzo medio pesato
          const totalValue = asset.quantity * asset.averagePrice + quantity * pricePerUnit;
          const newQuantity = asset.quantity + quantity;
          asset.averagePrice = totalValue / newQuantity;
          asset.quantity = newQuantity;
        }
        
        if (category) asset.category = category;
      }
    }

    // Gestione della vendita (invariata)
    if (type === TransactionType.SELL) {
      // ... codice esistente per la vendita ...
    }

    portfolio.lastUpdated = new Date();
    await portfolio.save();
    return portfolio;
  } catch (error) {
    console.error('Errore nell\'aggiornamento del portafoglio:', error);
    throw error;
  }
}

// Registra le route con le funzioni nominate
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.post('/', addTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;