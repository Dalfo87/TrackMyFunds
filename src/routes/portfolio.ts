import express from 'express';
import Portfolio from '../models/Portfolio';
import Crypto from '../models/Crypto';

// Definizione del router
const router = express.Router();

// Tipo per i gestori delle richieste
type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next?: express.NextFunction
) => Promise<any> | any;

// Funzione per recuperare il portafoglio dell'utente
const getPortfolio: RequestHandler = async (req, res) => {
  try {
    console.log('Recupero portafoglio utente iniziato');
    
    let portfolio = await Portfolio.findOne({ user: 'default_user' });
    
    // Se il portafoglio non esiste, creane uno vuoto
    if (!portfolio) {
      console.log('Portafoglio non trovato, creazione di un nuovo portafoglio vuoto');
      portfolio = new Portfolio({
        user: 'default_user',
        assets: [],
        lastUpdated: new Date()
      });
      await portfolio.save();
    }
    
    res.json(portfolio);
  } catch (error) {
    console.error('Errore nel recupero del portafoglio:', error);
    res.status(500).json({ message: 'Errore nel recupero del portafoglio' });
  }
};

// Funzione per ottenere il valore attuale del portafoglio - Versione semplificata
// Funzione per ottenere il valore attuale del portafoglio
// Funzione per ottenere il valore attuale del portafoglio
const getPortfolioValue: RequestHandler = async (req, res) => {
  try {
    console.log('Calcolo del valore del portafoglio iniziato');
    
    const portfolio = await Portfolio.findOne({ user: 'default_user' });
    
    if (!portfolio || portfolio.assets.length === 0) {
      return res.json({ 
        totalValue: 0, 
        assets: [], 
        totalInvestment: 0,
        totalProfitLoss: 0,
        totalProfitLossPercentage: 0
      });
    }
    
    console.log(`Trovato portafoglio con ${portfolio.assets.length} asset`);
    
    // Ottieni i prezzi attuali delle criptovalute
    const assets = await Promise.all(portfolio.assets.map(async (asset) => {
      const normalizedSymbol = asset.cryptoSymbol.trim().toUpperCase();
      
      console.log(`Cerco criptovaluta per simbolo: ${normalizedSymbol}`);
      
      const crypto = await Crypto.findOne({ symbol: normalizedSymbol });
      
      if (!crypto) {
        console.log(`ATTENZIONE: Criptovaluta non trovata per simbolo: ${normalizedSymbol}`);
      }
      
      const currentPrice = crypto ? crypto.currentPrice : 0;
      const currentValue = asset.quantity * currentPrice;
      const investmentValue = asset.quantity * asset.averagePrice;
      const profitLoss = currentValue - investmentValue;
      const profitLossPercentage = investmentValue > 0 
        ? (profitLoss / investmentValue) * 100 
        : 0;
      
      return {
        cryptoSymbol: normalizedSymbol,
        quantity: asset.quantity,
        averagePrice: asset.averagePrice,
        currentPrice,
        currentValue,
        investmentValue,
        profitLoss,
        profitLossPercentage,
        category: asset.category,
        type: asset.type,
        cryptoInfo: crypto ? {
          name: crypto.name,
          lastUpdated: crypto.lastUpdated
        } : null
      };
    }));
    
    // Calcola il valore totale e il profitto/perdita totale
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalInvestment = assets.reduce((sum, asset) => sum + asset.investmentValue, 0);
    const totalProfitLoss = totalValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 
      ? (totalProfitLoss / totalInvestment) * 100 
      : 0;
    
    console.log(`Calcolo completato: Valore totale=${totalValue}, Investimento totale=${totalInvestment}`);
    
    res.json({
      totalValue,
      totalInvestment,
      totalProfitLoss,
      totalProfitLossPercentage,
      assets
    });
  } catch (error) {
    console.error('Errore nel calcolo del valore del portafoglio:', error);
    res.status(500).json({ message: 'Errore nel calcolo del valore del portafoglio' });
  }
};

// Funzione per ottenere il portafoglio raggruppato per categoria
const getPortfolioByCategory: RequestHandler = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: 'default_user' });
    
    if (!portfolio || portfolio.assets.length === 0) {
      return res.json({ categories: [] });
    }
    
    // Raggruppa gli asset per categoria
    const categorizedAssets = portfolio.assets.reduce((result, asset) => {
      const category = asset.category || 'Non categorizzato';
      
      if (!result[category]) {
        result[category] = [];
      }
      
      result[category].push(asset);
      return result;
    }, {} as Record<string, any[]>);
    
    // Formatta i risultati
    const categories = Object.keys(categorizedAssets).map(category => ({
      name: category,
      assets: categorizedAssets[category]
    }));
    
    res.json({ categories });
  } catch (error) {
    console.error('Errore nel recupero del portafoglio per categoria:', error);
    res.status(500).json({ message: 'Errore nel recupero del portafoglio per categoria' });
  }
};

// Nuova funzione di diagnostica semplificata
// Funzione di diagnostica migliorata
// Funzione di diagnostica che mostra la struttura completa degli asset
const diagnoseCryptoMatchingIssues: RequestHandler = async (req, res) => {
  try {
    console.log('Avvio diagnostica corrispondenza asset-crypto');
    
    // Recupera il portfolio completo senza trasformazioni
    const portfolio = await Portfolio.findOne({ user: 'default_user' }).lean();
    if (!portfolio) {
      return res.json({
        message: 'Nessun portafoglio trovato',
        portfolio: null
      });
    }
    
    // Esamina un campione di criptovalute dal database
    const cryptoSample = await Crypto.find().limit(5).lean();
    
    // Restituisci la struttura completa
    return res.json({
      portfolioCompleto: portfolio,
      strutturaPrimoAsset: portfolio.assets[0] ? Object.keys(portfolio.assets[0]) : [],
      valoriPrimiAsset: portfolio.assets.slice(0, 3),
      esempioCrypto: cryptoSample,
      strutturaCrypto: cryptoSample[0] ? Object.keys(cryptoSample[0]) : []
    });
  } catch (error) {
    console.error('Errore nella diagnostica:', error);
    return res.status(500).json({
      message: 'Errore nella diagnostica',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
};

// Registra le route
router.get('/', getPortfolio);
router.get('/value', getPortfolioValue);
router.get('/by-category', getPortfolioByCategory);
router.get('/diagnose', diagnoseCryptoMatchingIssues);

export default router;