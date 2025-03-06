// src/controllers/analyticsController.ts

import express from 'express';
import Transaction, { TransactionType, PaymentMethod } from '../models/Transaction';
import Portfolio from '../models/Portfolio';
import Crypto from '../models/Crypto';

type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next?: express.NextFunction
) => Promise<any> | any;

class AnalyticsController {
  /**
   * Calcola performance del portafoglio
   * Fornisce una panoramica dettagliata del valore attuale, ROI, e profitti/perdite
   */
  static getPortfolioPerformance: RequestHandler = async (req, res) => {
    try {
      const userId = 'default_user'; // In futuro, questo verrà estratto dall'autenticazione
      
      // Ottieni il portafoglio dell'utente
      const portfolio = await Portfolio.findOne({ user: userId });
      
      // Se il portafoglio non esiste o è vuoto, restituisci un risultato vuoto
      if (!portfolio || portfolio.assets.length === 0) {
        return res.json({
          success: true,
          data: {
            totalInvestment: 0,
            currentValue: 0,
            totalProfitLoss: 0,
            totalROI: 0,
            assets: []
          }
        });
      }
      
      // Per ogni asset nel portafoglio, calcola le metriche di performance
      const assetsWithPerformance = await Promise.all(portfolio.assets.map(async (asset) => {
        // Ottieni il prezzo attuale della criptovaluta
        const crypto = await Crypto.findOne({ symbol: asset.cryptoSymbol });
        const currentPrice = crypto ? crypto.currentPrice : 0;
        
        // Calcola il valore investito (quantità * prezzo medio di acquisto)
        const investmentValue = asset.quantity * asset.averagePrice;
        
        // Calcola il valore attuale (quantità * prezzo attuale)
        const currentValue = asset.quantity * currentPrice;
        
        // Calcola profitto/perdita in valore assoluto
        const profitLoss = currentValue - investmentValue;
        
        // Calcola ROI percentuale
        const roi = investmentValue > 0 
          ? (profitLoss / investmentValue) * 100 
          : 0;
          
        return {
          symbol: asset.cryptoSymbol,
          name: crypto ? crypto.name : asset.cryptoSymbol,
          quantity: asset.quantity,
          averagePrice: asset.averagePrice,
          currentPrice: currentPrice,
          investmentValue: investmentValue,
          currentValue: currentValue,
          profitLoss: profitLoss,
          roi: roi,
          category: asset.category || 'Non categorizzato'
        };
      }));
      
      // Calcola le metriche totali del portafoglio
      const totalInvestment = assetsWithPerformance.reduce((sum, asset) => sum + asset.investmentValue, 0);
      const totalCurrentValue = assetsWithPerformance.reduce((sum, asset) => sum + asset.currentValue, 0);
      const totalProfitLoss = totalCurrentValue - totalInvestment;
      const totalROI = totalInvestment > 0 
        ? (totalProfitLoss / totalInvestment) * 100 
        : 0;
      
      // Organizza gli asset per categoria
      const assetsByCategory = assetsWithPerformance.reduce((categories, asset) => {
        const category = asset.category;
        if (!categories[category]) {
          categories[category] = {
            assets: [],
            investmentValue: 0,
            currentValue: 0,
            profitLoss: 0
          };
        }
        
        categories[category].assets.push(asset);
        categories[category].investmentValue += asset.investmentValue;
        categories[category].currentValue += asset.currentValue;
        categories[category].profitLoss += asset.profitLoss;
        
        return categories;
      }, {} as Record<string, any>);
      
      // Calcola ROI per categoria
      Object.keys(assetsByCategory).forEach(category => {
        const categoryData = assetsByCategory[category];
        categoryData.roi = categoryData.investmentValue > 0 
          ? (categoryData.profitLoss / categoryData.investmentValue) * 100 
          : 0;
      });
      
      // Restituisci i risultati
      return res.json({
        success: true,
        data: {
          totalInvestment,
          currentValue: totalCurrentValue,
          totalProfitLoss,
          totalROI,
          assets: assetsWithPerformance,
          categories: assetsByCategory
        }
      });
    } catch (error) {
      console.error('Errore nel calcolo delle performance del portafoglio:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nel calcolo delle performance del portafoglio',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  /**
   * Calcola profitti e perdite realizzati dalle transazioni completate
   * Supporta diversi metodi di calcolo: FIFO, LIFO, e Costo Medio
   */
  static getRealizedProfitLoss: RequestHandler = async (req, res) => {
    try {
      const userId = 'default_user';
      
      // Ottieni il metodo di calcolo dalla query (default: 'fifo')
      const { method = 'fifo' } = req.query;
      const calculationMethod = (method as string).toLowerCase();
      
      // Validazione del metodo
      if (!['fifo', 'lifo', 'average'].includes(calculationMethod)) {
        return res.status(400).json({
          success: false,
          message: 'Metodo di calcolo non valido. Usare "fifo", "lifo", o "average".'
        });
      }
      
      // Ottieni tutte le transazioni dell'utente
      const transactions = await Transaction.find({ user: userId }).sort({ date: 1 });
      
      // Se non ci sono transazioni, restituisci un risultato vuoto
      if (transactions.length === 0) {
        return res.json({
          success: true,
          method: calculationMethod,
          data: {
            realizedProfitLoss: 0,
            transactions: []
          }
        });
      }
      
      // Struttura per tracciare gli acquisti e le vendite per ogni criptovaluta
      interface TransactionItem {
        quantity: number;
        price: number;
        date: Date;
        type: string;
        paymentMethod?: string;
        paymentCurrency?: string;
      }
      
      interface CryptoTracker {
        acquisitions: TransactionItem[]; // Acquisti e airdrop
        sells: { 
          quantity: number; 
          price: number; 
          date: Date; 
          profitLoss: number;
          method: string;
        }[];
        totalAcquired: number;
        totalAcquisitionCost: number;
        totalSold: number;
        realizedProfitLoss: number;
      }
      
      const cryptoTrackers: Record<string, CryptoTracker> = {};
      
      // Inizializza i tracker per ogni criptovaluta unica
      transactions.forEach(tx => {
        if (!cryptoTrackers[tx.cryptoSymbol]) {
          cryptoTrackers[tx.cryptoSymbol] = {
            acquisitions: [],
            sells: [],
            totalAcquired: 0,
            totalAcquisitionCost: 0,
            totalSold: 0,
            realizedProfitLoss: 0
          };
        }
      });
      
      // Prima registra tutte le acquisizioni (acquisti e airdrop)
      transactions.forEach(tx => {
        const tracker = cryptoTrackers[tx.cryptoSymbol];
        
        if (tx.type === TransactionType.BUY || tx.type === TransactionType.AIRDROP) {
          // Registra l'acquisizione
          tracker.acquisitions.push({
            quantity: tx.quantity,
            price: tx.pricePerUnit,
            date: tx.date,
            type: tx.type,
            paymentMethod: tx.paymentMethod,
            paymentCurrency: tx.paymentCurrency
          });
          
          tracker.totalAcquired += tx.quantity;
          tracker.totalAcquisitionCost += tx.totalAmount; // Per airdrop sarà 0
        }
      });
      
      // Ora elabora le vendite in base al metodo scelto
      transactions.forEach(tx => {
        if (tx.type !== TransactionType.SELL) return;
        
        const tracker = cryptoTrackers[tx.cryptoSymbol];
        let profitLoss = 0;
        
        // Se non ci sono abbastanza acquisizioni, salta
        if (tracker.totalAcquired < tx.quantity) {
          console.warn(`Avviso: Vendita di ${tx.quantity} ${tx.cryptoSymbol} ma totale acquisito è solo ${tracker.totalAcquired}`);
          return;
        }
        
        // Calcola il profitto/perdita in base al metodo scelto
        if (calculationMethod === 'fifo') {
          // Metodo FIFO: First In, First Out
          profitLoss = calculateFIFO(tracker, tx.quantity, tx.pricePerUnit);
        } else if (calculationMethod === 'lifo') {
          // Metodo LIFO: Last In, First Out
          profitLoss = calculateLIFO(tracker, tx.quantity, tx.pricePerUnit);
        } else if (calculationMethod === 'average') {
          // Metodo Costo Medio
          profitLoss = calculateAverage(tracker, tx.quantity, tx.pricePerUnit);
        }
        
        // Registra la vendita
        tracker.sells.push({
          quantity: tx.quantity,
          price: tx.pricePerUnit,
          date: tx.date,
          profitLoss: profitLoss,
          method: calculationMethod
        });
        
        tracker.totalSold += tx.quantity;
        tracker.realizedProfitLoss += profitLoss;
      });
      
      // Funzione per calcolare il profitto/perdita usando il metodo FIFO
      function calculateFIFO(tracker: CryptoTracker, quantityToSell: number, sellPrice: number): number {
        let remainingToSell = quantityToSell;
        let costBasis = 0;
        const saleProceeds = quantityToSell * sellPrice;
        
        // Ordina le acquisizioni per data (già fatto nella query, ma per sicurezza)
        const sortedAcquisitions = [...tracker.acquisitions].sort((a, b) => 
          a.date.getTime() - b.date.getTime()
        );
        
        // Rimuovi le acquisizioni utilizzate completamente
        while (remainingToSell > 0 && sortedAcquisitions.length > 0) {
          const oldestAcquisition = sortedAcquisitions[0];
          
          if (oldestAcquisition.quantity <= remainingToSell) {
            // L'acquisizione viene utilizzata completamente
            costBasis += oldestAcquisition.quantity * oldestAcquisition.price;
            remainingToSell -= oldestAcquisition.quantity;
            
            // Rimuovi questa acquisizione dal tracker
            const index = tracker.acquisitions.findIndex(a => 
              a.date === oldestAcquisition.date && 
              a.quantity === oldestAcquisition.quantity &&
              a.price === oldestAcquisition.price
            );
            
            if (index !== -1) {
              tracker.acquisitions.splice(index, 1);
            }
            
            // Rimuovi dall'array temporaneo
            sortedAcquisitions.shift();
          } else {
            // L'acquisizione viene utilizzata parzialmente
            costBasis += remainingToSell * oldestAcquisition.price;
            
            // Aggiorna la quantità rimanente nell'acquisizione
            oldestAcquisition.quantity -= remainingToSell;
            
            // Aggiorna anche nel tracker originale
            const index = tracker.acquisitions.findIndex(a => 
              a.date === oldestAcquisition.date && 
              a.price === oldestAcquisition.price
            );
            
            if (index !== -1) {
              tracker.acquisitions[index].quantity -= remainingToSell;
            }
            
            remainingToSell = 0;
          }
        }
        
        // Calcola il profitto/perdita
        return saleProceeds - costBasis;
      }
      
      // Funzione per calcolare il profitto/perdita usando il metodo LIFO
      function calculateLIFO(tracker: CryptoTracker, quantityToSell: number, sellPrice: number): number {
        let remainingToSell = quantityToSell;
        let costBasis = 0;
        const saleProceeds = quantityToSell * sellPrice;
        
        // Ordina le acquisizioni per data inversa (più recente prima)
        const sortedAcquisitions = [...tracker.acquisitions].sort((a, b) => 
          b.date.getTime() - a.date.getTime()
        );
        
        // Rimuovi le acquisizioni utilizzate completamente
        while (remainingToSell > 0 && sortedAcquisitions.length > 0) {
          const newestAcquisition = sortedAcquisitions[0];
          
          if (newestAcquisition.quantity <= remainingToSell) {
            // L'acquisizione viene utilizzata completamente
            costBasis += newestAcquisition.quantity * newestAcquisition.price;
            remainingToSell -= newestAcquisition.quantity;
            
            // Rimuovi questa acquisizione dal tracker
            const index = tracker.acquisitions.findIndex(a => 
              a.date === newestAcquisition.date && 
              a.quantity === newestAcquisition.quantity &&
              a.price === newestAcquisition.price
            );
            
            if (index !== -1) {
              tracker.acquisitions.splice(index, 1);
            }
            
            // Rimuovi dall'array temporaneo
            sortedAcquisitions.shift();
          } else {
            // L'acquisizione viene utilizzata parzialmente
            costBasis += remainingToSell * newestAcquisition.price;
            
            // Aggiorna la quantità rimanente nell'acquisizione
            newestAcquisition.quantity -= remainingToSell;
            
            // Aggiorna anche nel tracker originale
            const index = tracker.acquisitions.findIndex(a => 
              a.date === newestAcquisition.date && 
              a.price === newestAcquisition.price
            );
            
            if (index !== -1) {
              tracker.acquisitions[index].quantity -= remainingToSell;
            }
            
            remainingToSell = 0;
          }
        }
        
        // Calcola il profitto/perdita
        return saleProceeds - costBasis;
      }
      
      // Funzione per calcolare il profitto/perdita usando il metodo del Costo Medio
      function calculateAverage(tracker: CryptoTracker, quantityToSell: number, sellPrice: number): number {
        const saleProceeds = quantityToSell * sellPrice;
        
        // Calcola il costo medio per unità
        const averageCost = tracker.totalAcquired > 0 
          ? tracker.totalAcquisitionCost / tracker.totalAcquired
          : 0;
        
        // Calcola il costo base usando il costo medio
        const costBasis = quantityToSell * averageCost;
        
        // Aggiorna il totale acquisito
        tracker.totalAcquired -= quantityToSell;
        
        // Aggiorna il costo totale di acquisizione proporzionalmente
        if (tracker.totalAcquired > 0) {
          tracker.totalAcquisitionCost = tracker.totalAcquired * averageCost;
        } else {
          tracker.totalAcquisitionCost = 0;
        }
        
        // Rimuovi la quantità venduta dal tracker
        // Nel metodo del costo medio, non è necessario tenere traccia delle singole acquisizioni
        // ma aggiorniamo comunque il tracker per coerenza
        let remainingToRemove = quantityToSell;
        
        while (remainingToRemove > 0 && tracker.acquisitions.length > 0) {
          const acquisition = tracker.acquisitions[0];
          
          if (acquisition.quantity <= remainingToRemove) {
            remainingToRemove -= acquisition.quantity;
            tracker.acquisitions.shift();
          } else {
            acquisition.quantity -= remainingToRemove;
            remainingToRemove = 0;
          }
        }
        
        // Calcola il profitto/perdita
        return saleProceeds - costBasis;
      }
      
      // Calcola il profitto/perdita realizzato totale
      const totalRealizedProfitLoss = Object.values(cryptoTrackers).reduce(
        (sum, tracker) => sum + tracker.realizedProfitLoss, 
        0
      );
      
      // Prepara i dati di riepilogo per ogni criptovaluta
      const cryptoSummaries = Object.entries(cryptoTrackers).map(([symbol, tracker]) => ({
        symbol,
        totalAcquired: tracker.totalAcquired,
        totalSold: tracker.totalSold,
        remainingQuantity: tracker.totalAcquired - tracker.totalSold,
        realizedProfitLoss: tracker.realizedProfitLoss,
        sells: tracker.sells,
        acquisitions: tracker.acquisitions.map(acq => ({
          ...acq,
          type: acq.type  // Include il tipo di acquisizione (BUY o AIRDROP)
        }))
      }));
      
      return res.json({
        success: true,
        method: calculationMethod,
        data: {
          realizedProfitLoss: totalRealizedProfitLoss,
          cryptoSummaries,
          methodDescription: AnalyticsController.getMethodDescription(calculationMethod)
        }
      });
    } catch (error) {
      console.error('Errore nel calcolo del profitto/perdita realizzato:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nel calcolo del profitto/perdita realizzato',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // Funzione helper per generare descrizioni dei metodi
  private static getMethodDescription(method: string): string {
    switch (method) {
      case 'fifo':
        return 'First In, First Out: le prime unità acquistate sono le prime ad essere vendute.';
      case 'lifo':
        return 'Last In, First Out: le unità acquistate più recentemente sono le prime ad essere vendute.';
      case 'average':
        return 'Costo Medio: ogni unità venduta ha lo stesso costo base, calcolato come media di tutti gli acquisti precedenti.';
      default:
        return '';
    }
  }

  /**
   * Genera statistiche generali sul portafoglio
   * Fornisce informazioni aggregate come distribuzione per categoria, performance nel tempo, ecc.
   */
  static getPortfolioStats: RequestHandler = async (req, res) => {
    try {
      const userId = 'default_user';
      
      // Ottieni portfolio e transazioni
      const portfolio = await Portfolio.findOne({ user: userId });
      const transactions = await Transaction.find({ user: userId }).sort({ date: 1 });
      
      // Se non ci sono dati, restituisci un risultato vuoto
      if (!portfolio || portfolio.assets.length === 0) {
        return res.json({
          success: true,
          data: {
            assetCount: 0,
            transactionCount: 0,
            firstTransactionDate: null,
            categories: {},
            distributionBySymbol: {},
            topPerformers: [],
            worstPerformers: []
          }
        });
      }
      
      // Statistiche base
      const transactionCount = transactions.length;
      const assetCount = portfolio.assets.length;
      const firstTransactionDate = transactions.length > 0 ? transactions[0].date : null;
      const lastTransactionDate = transactions.length > 0 ? transactions[transactions.length - 1].date : null;
      
      // Calcola il valore totale del portafoglio
      let totalValue = 0;
      const assetValues = await Promise.all(portfolio.assets.map(async (asset) => {
        const crypto = await Crypto.findOne({ symbol: asset.cryptoSymbol });
        const currentPrice = crypto ? crypto.currentPrice : 0;
        const value = asset.quantity * currentPrice;
        totalValue += value;
        
        return {
          symbol: asset.cryptoSymbol,
          value,
          quantity: asset.quantity,
          price: currentPrice
        };
      }));
      
      // Distribuzione percentuale per simbolo
      const distributionBySymbol = assetValues.reduce((dist, asset) => {
        dist[asset.symbol] = (asset.value / totalValue) * 100;
        return dist;
      }, {} as Record<string, number>);
      
      // Distribuzione per categoria
      const categoriesMap = portfolio.assets.reduce((categories, asset) => {
        const category = asset.category || 'Non categorizzato';
        if (!categories[category]) {
          categories[category] = {
            assetCount: 0,
            symbols: []
          };
        }
        
        categories[category].assetCount++;
        categories[category].symbols.push(asset.cryptoSymbol);
        
        return categories;
      }, {} as Record<string, { assetCount: number; symbols: string[] }>);
      
      // Calcola performance per asset per identificare top e worst performers
      const assetPerformances = await Promise.all(portfolio.assets.map(async (asset) => {
        const crypto = await Crypto.findOne({ symbol: asset.cryptoSymbol });
        const currentPrice = crypto ? crypto.currentPrice : 0;
        
        const investmentValue = asset.quantity * asset.averagePrice;
        const currentValue = asset.quantity * currentPrice;
        const profitLoss = currentValue - investmentValue;
        const roi = investmentValue > 0 ? (profitLoss / investmentValue) * 100 : 0;
        
        return {
          symbol: asset.cryptoSymbol,
          roi,
          profitLoss,
          currentValue
        };
      }));
      
      // Ordina gli asset per ROI
      const sortedByROI = [...assetPerformances].sort((a, b) => b.roi - a.roi);
      
      // Top 3 e worst 3 performers
      const topPerformers = sortedByROI.slice(0, 3);
      const worstPerformers = sortedByROI.slice(-3).reverse();
      
      return res.json({
        success: true,
        data: {
          assetCount,
          transactionCount,
          firstTransactionDate,
          lastTransactionDate,
          totalValue,
          categories: categoriesMap,
          distributionBySymbol,
          topPerformers,
          worstPerformers
        }
      });
    } catch (error) {
      console.error('Errore nel calcolo delle statistiche del portafoglio:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nel calcolo delle statistiche del portafoglio',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  /**
   * Analizza l'andamento storico del portafoglio
   * Ricostruisce il valore del portafoglio nel tempo in base alle transazioni
   */
  static getHistoricalPerformance: RequestHandler = async (req, res) => {
    try {
      const userId = 'default_user';
      const { period = '1y' } = req.query;
      
      // Determina la data di inizio in base al periodo richiesto
      const startDate = new Date();
      switch (period) {
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case 'all':
          // Non imposta una data di inizio, include tutte le transazioni
          break;
        default:
          startDate.setFullYear(startDate.getFullYear() - 1); // Default: 1 anno
      }
      
      // Ottieni tutte le transazioni dell'utente, ordinate per data
      const transactions = await Transaction.find({ 
        user: userId,
        date: { $gte: period === 'all' ? new Date(0) : startDate }
      }).sort({ date: 1 });
      
      if (transactions.length === 0) {
        return res.json({
          success: true,
          data: {
            timeline: [],
            totalInvestment: 0,
            currentValue: 0
          }
        });
      }
      
      // Struttura per tracciare il portafoglio nel tempo
      interface PortfolioSnapshot {
        date: Date;
        holdings: Record<string, { quantity: number; investmentValue: number }>;
        totalInvestment: number;
        estimatedValue: number; // Il valore stimato in quel momento (ricostruito)
      }
      
      // Array di date da analizzare (dai snapshot in punti significativi)
      // Includi le date di tutte le transazioni e punti intermedi
      const transactionDates = transactions.map(tx => tx.date);
      
      // Genera punti di snapshot nel tempo
      const snapshotDates: Date[] = [...transactionDates];
      
      // Inizia con un portafoglio vuoto
      let currentHoldings: Record<string, { quantity: number; investmentValue: number }> = {};
      let totalInvestment = 0;
      
      // Timeline che conterrà tutti gli snapshot
      const timeline: PortfolioSnapshot[] = [];
      
      // Elabora ogni data di snapshot
      for (const date of snapshotDates) {
        // Applica tutte le transazioni fino a questa data
        const relevantTransactions = transactions.filter(tx => tx.date <= date);
        
        // Resetta il portafoglio e ricostruiscilo applicando tutte le transazioni
        currentHoldings = {};
        totalInvestment = 0;
        
        for (const tx of relevantTransactions) {
          if (!currentHoldings[tx.cryptoSymbol]) {
            currentHoldings[tx.cryptoSymbol] = { quantity: 0, investmentValue: 0 };
          }
          
          if (tx.type === TransactionType.BUY) {
            const prevQuantity = currentHoldings[tx.cryptoSymbol].quantity;
            const prevInvestment = currentHoldings[tx.cryptoSymbol].investmentValue;
            
            currentHoldings[tx.cryptoSymbol].quantity += tx.quantity;
            currentHoldings[tx.cryptoSymbol].investmentValue += tx.totalAmount;
            
            totalInvestment += tx.totalAmount;
          } else if (tx.type === TransactionType.SELL) {
            // Per le vendite, riduciamo la quantità ma non modifichiamo l'investimento
            // proporzionalmente (questo simula il FIFO per il calcolo del costo base)
            if (currentHoldings[tx.cryptoSymbol].quantity >= tx.quantity) {
              const sellRatio = tx.quantity / currentHoldings[tx.cryptoSymbol].quantity;
              
              // Riduci l'investimento proporzionalmente
              const investmentReduction = currentHoldings[tx.cryptoSymbol].investmentValue * sellRatio;
              currentHoldings[tx.cryptoSymbol].investmentValue -= investmentReduction;
              currentHoldings[tx.cryptoSymbol].quantity -= tx.quantity;
              
              totalInvestment -= investmentReduction;
            }
          }
        }
        
        // Calcola il valore stimato del portafoglio a questa data
        // Nota: idealmente, useremmo dati storici dei prezzi per una stima più precisa
        // Per ora, facciamo una stima basata sui prezzi attuali
        let estimatedValue = 0;
        for (const [symbol, holding] of Object.entries(currentHoldings)) {
          if (holding.quantity > 0) {
            const crypto = await Crypto.findOne({ symbol });
            const price = crypto ? crypto.currentPrice : 0;
            estimatedValue += holding.quantity * price;
          }
        }
        
        // Aggiungi lo snapshot alla timeline
        timeline.push({
          date,
          holdings: { ...currentHoldings },
          totalInvestment,
          estimatedValue
        });
      }
      
      // Aggiungi uno snapshot finale con i valori attuali
      const now = new Date();
      let finalEstimatedValue = 0;
      
      for (const [symbol, holding] of Object.entries(currentHoldings)) {
        if (holding.quantity > 0) {
          const crypto = await Crypto.findOne({ symbol });
          const price = crypto ? crypto.currentPrice : 0;
          finalEstimatedValue += holding.quantity * price;
        }
      }
      
      timeline.push({
        date: now,
        holdings: { ...currentHoldings },
        totalInvestment,
        estimatedValue: finalEstimatedValue
      });
      
      return res.json({
        success: true,
        data: {
          timeline,
          totalInvestment,
          currentValue: finalEstimatedValue,
          performancePercentage: totalInvestment > 0 
            ? ((finalEstimatedValue - totalInvestment) / totalInvestment) * 100 
            : 0
        }
      });
    } catch (error) {
      console.error('Errore nel calcolo della performance storica:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nel calcolo della performance storica',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Ottiene statistiche di investimento per metodo di pagamento
   * Utile per analizzare acquisizioni tramite bonifico vs stablecoin
   */
  static getInvestmentByPaymentMethod: RequestHandler = async (req, res) => {
    try {
      const userId = 'default_user';
      
      // Ottieni tutte le transazioni di acquisto
      const buyTransactions = await Transaction.find({
        user: userId,
        type: TransactionType.BUY
      }).sort({ date: 1 });
      
      if (buyTransactions.length === 0) {
        return res.json({
          success: true,
          data: {
            totalInvestmentByMethod: {},
            totalInvestmentByMethodAndCurrency: {},
            totalInvestment: 0,
            transactionCount: 0
          }
        });
      }
      
      // Inizializza i contatori per ogni metodo di pagamento
      interface PaymentMethodStats {
        totalAmount: number;
        transactionCount: number;
        firstDate: Date | null;
        lastDate: Date | null;
        currencies: Record<string, {
          totalAmount: number;
          transactionCount: number;
        }>;
      }
      
      const methodStats: Record<string, PaymentMethodStats> = {};
      
      // Inizializza le statistiche per ogni metodo di pagamento
      const allMethods = Object.values(PaymentMethod);
      allMethods.forEach(method => {
        methodStats[method] = {
          totalAmount: 0,
          transactionCount: 0,
          firstDate: null,
          lastDate: null,
          currencies: {}
        };
      });
      
      // Aggiungi un 'metodo' indefinito per le transazioni senza metodo specificato
      methodStats['undefined'] = {
        totalAmount: 0,
        transactionCount: 0,
        firstDate: null,
        lastDate: null,
        currencies: {}
      };
      
      // Calcola le statistiche per ogni metodo di pagamento
      let totalInvestment = 0;
      for (const tx of buyTransactions) {
        const method = tx.paymentMethod || 'undefined';
        const currency = tx.paymentCurrency || 'undefined';
        
        // Aggiorna le statistiche del metodo
        if (!methodStats[method]) {
          methodStats[method] = {
            totalAmount: 0,
            transactionCount: 0,
            firstDate: null,
            lastDate: null,
            currencies: {}
          };
        }
        
        methodStats[method].totalAmount += tx.totalAmount;
        methodStats[method].transactionCount++;
        
        // Aggiorna le date
        if (!methodStats[method].firstDate || tx.date < methodStats[method].firstDate) {
          methodStats[method].firstDate = tx.date;
        }
        if (!methodStats[method].lastDate || tx.date > methodStats[method].lastDate) {
          methodStats[method].lastDate = tx.date;
        }
        
        // Aggiorna le statistiche della valuta
        if (!methodStats[method].currencies[currency]) {
          methodStats[method].currencies[currency] = {
            totalAmount: 0,
            transactionCount: 0
          };
        }
        
        methodStats[method].currencies[currency].totalAmount += tx.totalAmount;
        methodStats[method].currencies[currency].transactionCount++;
        
        // Aggiorna il totale degli investimenti
        totalInvestment += tx.totalAmount;
      }
      
      // Calcola le percentuali
      const methodPercentages: Record<string, number> = {};
      const methodAndCurrencyPercentages: Record<string, Record<string, number>> = {};
      
      for (const [method, stats] of Object.entries(methodStats)) {
        if (totalInvestment > 0) {
          methodPercentages[method] = (stats.totalAmount / totalInvestment) * 100;
        } else {
          methodPercentages[method] = 0;
        }
        
        methodAndCurrencyPercentages[method] = {};
        
        for (const [currency, currencyStats] of Object.entries(stats.currencies)) {
          if (totalInvestment > 0) {
            methodAndCurrencyPercentages[method][currency] = (currencyStats.totalAmount / totalInvestment) * 100;
          } else {
            methodAndCurrencyPercentages[method][currency] = 0;
          }
        }
      }
      
      // Prepara il risultato
      return res.json({
        success: true,
        data: {
          byMethod: methodStats,
          percentageByMethod: methodPercentages,
          percentageByMethodAndCurrency: methodAndCurrencyPercentages,
          totalInvestment,
          transactionCount: buyTransactions.length,
          paymentMethods: Object.values(PaymentMethod).map(method => ({
            id: method,
            name: getPaymentMethodName(method)
          }))
        }
      });
    } catch (error) {
      console.error('Errore nel calcolo delle statistiche per metodo di pagamento:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nel calcolo delle statistiche per metodo di pagamento',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}

// Funzione helper per ottenere il nome del metodo di pagamento
function getPaymentMethodName(method: string): string {
  switch (method) {
    case PaymentMethod.BANK_TRANSFER:
      return 'Bonifico Bancario';
    case PaymentMethod.CREDIT_CARD:
      return 'Carta di Credito';
    case PaymentMethod.DEBIT_CARD:
      return 'Carta di Debito';
    case PaymentMethod.CRYPTO:
      return 'Cryptocurrency/Stablecoin';
    case PaymentMethod.OTHER:
      return 'Altro';
    case 'undefined':
      return 'Non specificato';
    default:
      return method;
  }
}

export { AnalyticsController };