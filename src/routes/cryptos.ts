import express from 'express';
import Crypto, { ICrypto } from '../models/Crypto';
import CryptoController from '../controllers/cryptoController';

// Definisci esplicitamente il router
const router = express.Router();

// Definisci un tipo personalizzato per i gestori delle richieste
type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next?: express.NextFunction
) => Promise<any> | any;

// Funzione per recuperare tutte le criptovalute
const getAllCryptos: RequestHandler = async (req, res) => {
  try {
    const cryptos = await Crypto.find().sort({ marketCap: -1 });
    res.json(cryptos);
  } catch (error) {
    console.error('Errore nel recupero delle criptovalute:', error);
    res.status(500).json({ message: 'Errore nel recupero delle criptovalute' });
  }
};

// Funzione per recuperare una criptovaluta specifica tramite simbolo
const getCryptoBySymbol: RequestHandler = async (req, res) => {
  try {
    const crypto = await Crypto.findOne({ 
      symbol: req.params.symbol.toUpperCase() 
    });
    
    if (!crypto) {
      return res.status(404).json({ message: 'Criptovaluta non trovata' });
    }
    
    res.json(crypto);
  } catch (error) {
    console.error('Errore nel recupero della criptovaluta:', error);
    res.status(500).json({ message: 'Errore nel recupero della criptovaluta' });
  }
};

// Funzione per aggiungere una nuova criptovaluta
const addCrypto: RequestHandler = async (req, res) => {
  try {
    const { symbol, name, currentPrice, priceChangePercentage24h, marketCap } = req.body;
    
    // Verifica se la criptovaluta esiste già
    const existingCrypto = await Crypto.findOne({ symbol: symbol.toUpperCase() });
    if (existingCrypto) {
      return res.status(400).json({ message: 'Questa criptovaluta esiste già' });
    }
    
    // Crea una nuova criptovaluta
    const newCrypto = new Crypto({
      symbol: symbol.toUpperCase(),
      name,
      currentPrice,
      priceChangePercentage24h,
      marketCap,
      lastUpdated: new Date()
    });
    
    await newCrypto.save();
    res.status(201).json(newCrypto);
  } catch (error) {
    console.error('Errore nell\'aggiunta della criptovaluta:', error);
    res.status(500).json({ message: 'Errore nell\'aggiunta della criptovaluta' });
  }
};

// Funzione per aggiornare una criptovaluta esistente
const updateCrypto: RequestHandler = async (req, res) => {
  try {
    const { currentPrice, priceChangePercentage24h, marketCap } = req.body;
    
    // Trova e aggiorna la criptovaluta
    const updatedCrypto = await Crypto.findOneAndUpdate(
      { symbol: req.params.symbol.toUpperCase() },
      { 
        currentPrice, 
        priceChangePercentage24h, 
        marketCap,
        lastUpdated: new Date()
      },
      { new: true } // Ritorna il documento aggiornato
    );
    
    if (!updatedCrypto) {
      return res.status(404).json({ message: 'Criptovaluta non trovata' });
    }
    
    res.json(updatedCrypto);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della criptovaluta:', error);
    res.status(500).json({ message: 'Errore nell\'aggiornamento della criptovaluta' });
  }
};

// Funzione per eliminare una criptovaluta
const deleteCrypto: RequestHandler = async (req, res) => {
  try {
    const deletedCrypto = await Crypto.findOneAndDelete({ symbol: req.params.symbol.toUpperCase() });
    
    if (!deletedCrypto) {
      return res.status(404).json({ message: 'Criptovaluta non trovata' });
    }
    
    res.json({ message: 'Criptovaluta eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione della criptovaluta:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione della criptovaluta' });
  }
};

// Registra le route con le funzioni nominate
router.get('/', getAllCryptos);
router.get('/:symbol', getCryptoBySymbol);
router.post('/', addCrypto);
router.put('/:symbol', updateCrypto);
router.delete('/:symbol', deleteCrypto);
router.post('/update-prices', CryptoController.updateAllCryptoPrices);
router.post('/update/:coinGeckoId', CryptoController.updateCryptoByCoinGeckoId);
router.get('/search', CryptoController.searchCrypto);

export default router;