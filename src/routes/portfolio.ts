import express from 'express';
import Portfolio from '../models/Portfolio';
import Crypto from '../models/Crypto';

// Definisci esplicitamente il router
const router = express.Router();

// Definisci un tipo personalizzato per i gestori delle richieste
type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next?: express.NextFunction
) => Promise<any> | any;

// Funzione per recuperare il portafoglio dell'utente
const getPortfolio: RequestHandler = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: 'default_user' });
    
    // Se il portafoglio non esiste, creane uno vuoto
    if (!portfolio) {
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

// Funzione per ottenere il valore attuale del portafoglio
const getPortfolioValue: RequestHandler = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: 'default_user' });
    
    if (!portfolio || portfolio.assets.length === 0) {
      return res.json({ 
        totalValue: 0, 
        assets: [], 
        totalProfitLoss: 0, 
        totalProfitLossPercentage: 0 
      });
    }
    
    // Ottieni i prezzi attuali delle criptovalute
    const assets = await Promise.all(portfolio.assets.map(async (asset) => {
      const crypto = await Crypto.findOne({ symbol: asset.cryptoSymbol });
      
      const currentPrice = crypto ? crypto.currentPrice : 0;
      const currentValue = asset.quantity * currentPrice;
      const investmentValue = asset.quantity * asset.averagePrice;
      const profitLoss = currentValue - investmentValue;
      const profitLossPercentage = investmentValue > 0 
        ? (profitLoss / investmentValue) * 100 
        : 0;
      
      return {
        cryptoSymbol: asset.cryptoSymbol,
        quantity: asset.quantity,
        averagePrice: asset.averagePrice,
        currentPrice,
        currentValue,
        investmentValue,
        profitLoss,
        profitLossPercentage,
        category: asset.category
      };
    }));
    
    // Calcola il valore totale e il profitto/perdita totale
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalInvestment = assets.reduce((sum, asset) => sum + asset.investmentValue, 0);
    const totalProfitLoss = totalValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 
      ? (totalProfitLoss / totalInvestment) * 100 
      : 0;
    
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

// Registra le route con le funzioni nominate
router.get('/', getPortfolio);
router.get('/value', getPortfolioValue);
router.get('/by-category', getPortfolioByCategory);

export default router;