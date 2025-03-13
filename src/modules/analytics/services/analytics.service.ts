// src/modules/analytics/services/analytics.service.ts
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { 
  AnalyticsFilterDto, 
  PortfolioPerformanceDto, 
  RealizedProfitLossDto,
  HistoricalPerformanceDto,
  PortfolioStatsDto,
  InvestmentByPaymentMethodDto
} from '../dtos/analytics.dtos';
import { Logger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/utils/errorHandler';
import { TransactionType, PaymentMethod } from '../../../shared/types/transaction.types';
import { STABLECOINS } from '../../../shared/constants/crypto.constants';

export class AnalyticsService {
  constructor(
    private analyticsRepository: AnalyticsRepository
  ) {}

  /**
   * Calcola performance del portafoglio
   */
  async getPortfolioPerformance(userId: string): Promise<PortfolioPerformanceDto> {
    try {
      // Ottieni il portafoglio dell'utente
      const portfolio = await this.analyticsRepository.getPortfolio(userId);
      
      // Se il portafoglio non esiste o è vuoto, restituisci un risultato vuoto
      if (!portfolio || portfolio.assets.length === 0) {
        return {
          totalInvestment: 0,
          currentValue: 0,
          totalProfitLoss: 0,
          totalROI: 0,
          assets: []
        };
      }
      
      // Recupera i simboli unici delle criptovalute nel portafoglio
      const symbols = portfolio.assets.map((asset: any) => asset.cryptoSymbol.toUpperCase());
      
      // Ottieni i dati attuali delle criptovalute
      const cryptoMap = await this.analyticsRepository.getCryptoData(symbols);
      
      // Per ogni asset nel portafoglio, calcola le metriche di performance
      const assetsWithPerformance = portfolio.assets.map((asset: any) => {
        // Ottieni il prezzo attuale della criptovaluta
        const crypto = cryptoMap.get(asset.cryptoSymbol.toUpperCase());
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
      });
      
      // Calcola le metriche totali del portafoglio
      const totalInvestment = assetsWithPerformance.reduce((sum: number, asset: { investmentValue: number }) => sum + asset.investmentValue, 0);
      const totalCurrentValue = assetsWithPerformance.reduce((sum: number, asset: { currentValue: number }) => sum + asset.currentValue, 0);
      const totalProfitLoss = totalCurrentValue - totalInvestment;
      const totalROI = totalInvestment > 0 
        ? (totalProfitLoss / totalInvestment) * 100 
        : 0;
      
      // Organizza gli asset per categoria
      interface AssetPerformance {
        category: string;
        investmentValue: number;
        currentValue: number;
        profitLoss: number;
      }

      const categoriesMap = assetsWithPerformance.reduce((categories: Record<string, any>, asset: AssetPerformance) => {
        const category = asset.category;
        if (!categories[category]) {
          categories[category] = {
            assets: [],
            investmentValue: 0,
            currentValue: 0,
            profitLoss: 0,
            roi: 0
          };
        }
        
        categories[category].assets.push(asset);
        categories[category].investmentValue += asset.investmentValue;
        categories[category].currentValue += asset.currentValue;
        categories[category].profitLoss += asset.profitLoss;
        
        // Calcola ROI per categoria
        categories[category].roi = categories[category].investmentValue > 0 
          ? (categories[category].profitLoss / categories[category].investmentValue) * 100 
          : 0;
        
        return categories;
      }, {} as Record<string, any>);
      
      return {
        totalInvestment,
        currentValue: totalCurrentValue,
        totalProfitLoss,
        totalROI,
        assets: assetsWithPerformance,
        categories: categoriesMap
      };
    } catch (error) {
      Logger.error('Errore nel calcolo delle performance del portafoglio:', error);
      throw new ApiError(500, 'Errore nel calcolo delle performance del portafoglio');
    }
  }

  /**
   * Calcola profitti e perdite realizzati dalle transazioni completate
   */
  async getRealizedProfitLoss(userId: string, filters: AnalyticsFilterDto): Promise<RealizedProfitLossDto> {
    try {
      // Ottieni il metodo di calcolo dalla query (default: 'fifo')
      const calculationMethod = (filters.method || 'fifo').toLowerCase();
      
      // Validazione del metodo
      if (!['fifo', 'lifo', 'average'].includes(calculationMethod)) {
        throw new ApiError(400, 'Metodo di calcolo non valido. Usare "fifo", "lifo", o "average".');
      }
      
      // Ottieni tutte le transazioni dell'utente
      const transactions = await this.analyticsRepository.getTransactions(userId, filters);
      
      // Se non ci sono transazioni, restituisci un risultato vuoto
      if (transactions.length === 0) {
        return {
          realizedProfitLoss: 0,
          cryptoSummaries: [],
          methodDescription: this.getMethodDescription(calculationMethod)
        };
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
          Logger.warn(`Avviso: Vendita di ${tx.quantity} ${tx.cryptoSymbol} ma totale acquisito è solo ${tracker.totalAcquired}`);
          return;
        }
        
        // Calcola il profitto/perdita in base al metodo scelto
        if (calculationMethod === 'fifo') {
          // Metodo FIFO: First In, First Out
          profitLoss = this.calculateFIFO(tracker, tx.quantity, tx.pricePerUnit);
        } else if (calculationMethod === 'lifo') {
          // Metodo LIFO: Last In, First Out
          profitLoss = this.calculateLIFO(tracker, tx.quantity, tx.pricePerUnit);
        } else if (calculationMethod === 'average') {
          // Metodo Costo Medio
          profitLoss = this.calculateAverage(tracker, tx.quantity, tx.pricePerUnit);
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
      
      return {
        realizedProfitLoss: totalRealizedProfitLoss,
        cryptoSummaries,
        methodDescription: this.getMethodDescription(calculationMethod)
      };
    } catch (error) {
      Logger.error('Errore nel calcolo del profitto/perdita realizzato:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Errore nel calcolo del profitto/perdita realizzato');
    }
  }

  /**
   * Genera statistiche generali sul portafoglio
   */
  async getPortfolioStats(userId: string): Promise<PortfolioStatsDto> {
    try {
      // Ottieni portfolio e transazioni
      const portfolio = await this.analyticsRepository.getPortfolio(userId);
      const transactions = await this.analyticsRepository.getTransactions(userId);
      
      // Se non ci sono dati, restituisci un risultato vuoto
      if (!portfolio || portfolio.assets.length === 0) {
        return {
          assetCount: 0,
          transactionCount: 0,
          firstTransactionDate: null,
          lastTransactionDate: null,
          totalValue: 0,
          categories: {},
          distributionBySymbol: {},
          topPerformers: [],
          worstPerformers: []
        };
      }
      
      // Calcola le performance per poter identificare top e worst performers
      const portfolioPerformance = await this.getPortfolioPerformance(userId);
      
      // Statistiche base
      const transactionCount = transactions.length;
      const assetCount = portfolio.assets.length;
      const firstTransactionDate = transactions.length > 0 ? transactions[0].date : null;
      const lastTransactionDate = transactions.length > 0 ? transactions[transactions.length - 1].date : null;
      
      // Distribuzione percentuale per simbolo
      const distributionBySymbol = portfolioPerformance.assets.reduce((dist, asset) => {
        dist[asset.symbol] = portfolioPerformance.currentValue > 0 
          ? (asset.currentValue / portfolioPerformance.currentValue) * 100 
          : 0;
        return dist;
      }, {} as Record<string, number>);
      
      // Distribuzione per categoria
      interface CategoryStats {
        assetCount: number;
        symbols: string[];
      }

      const categoriesMap = portfolio.assets.reduce((categories: Record<string, CategoryStats>, asset: { category: string; cryptoSymbol: string; }) => {
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
      
      // Ordina gli asset per ROI per identificare top e worst performers
      const sortedByROI = [...portfolioPerformance.assets].sort((a, b) => b.roi - a.roi);
      
      // Top 3 e worst 3 performers
      const topPerformers = sortedByROI.slice(0, 3);
      const worstPerformers = sortedByROI.slice(-3).reverse();
      
      return {
        assetCount,
        transactionCount,
        firstTransactionDate,
        lastTransactionDate,
        totalValue: portfolioPerformance.currentValue,
        categories: categoriesMap,
        distributionBySymbol,
        topPerformers,
        worstPerformers
      };
    } catch (error) {
      Logger.error('Errore nel calcolo delle statistiche del portafoglio:', error);
      throw new ApiError(500, 'Errore nel calcolo delle statistiche del portafoglio');
    }
  }

  /**
   * Analizza l'andamento storico del portafoglio
   */
  async getHistoricalPerformance(userId: string, filters: AnalyticsFilterDto): Promise<HistoricalPerformanceDto> {
    try {
      const period = (filters.startDate && filters.endDate) ? 'custom' : '1y';
      
      // Determina la data di inizio in base al periodo
      const startDate = filters.startDate || new Date();
      if (!filters.startDate) {
        startDate.setFullYear(startDate.getFullYear() - 1); // Default: 1 anno
      }
      
      // Aggiorna i filtri con il periodo corretto
      const queryFilters = { ...filters };
      if (!queryFilters.startDate) {
        queryFilters.startDate = startDate;
      }
      
      // Ottieni tutte le transazioni dell'utente nel periodo
      const transactions = await this.analyticsRepository.getTransactions(userId, queryFilters);
      
      // Ottieni il portafoglio corrente per il confronto
      const currentPortfolio = await this.getPortfolioPerformance(userId);
      
      if (transactions.length === 0) {
        return {
          timeline: [],
          totalInvestment: currentPortfolio.totalInvestment,
          currentValue: currentPortfolio.currentValue,
          performancePercentage: currentPortfolio.totalROI
        };
      }
      
      // Ottieni le date delle transazioni per creare la timeline
      const transactionDates = [...new Set(transactions.map(tx => 
        tx.date.toISOString().split('T')[0]
      ))];
      
      // Aggiungi la data corrente per completare la timeline
      const today = new Date().toISOString().split('T')[0];
      if (!transactionDates.includes(today)) {
        transactionDates.push(today);
      }
      
      // Calcola snapshot a intervalli regolari (per evitare troppi punti)
      const maxDataPoints = 30; // Numero massimo di punti da visualizzare
      const step = Math.max(1, Math.floor(transactionDates.length / maxDataPoints));
      
      // Genera i punti storici
      const timeline: any[] = [];
      let lastInvestment = 0;
      let lastValue = 0;
      
      for (let i = 0; i < transactionDates.length; i += step) {
        const dateStr = transactionDates[i];
        const date = new Date(dateStr);
        
        // Simula il valore del portafoglio a questa data
        // Poiché non abbiamo i prezzi storici reali, facciamo una stima lineare
        const progress = i / transactionDates.length;
        const estimatedValue = lastValue + progress * (currentPortfolio.currentValue - lastValue);
        const estimatedInvestment = lastInvestment + progress * (currentPortfolio.totalInvestment - lastInvestment);
        
        timeline.push({
          date,
          totalInvestment: estimatedInvestment,
          estimatedValue: estimatedValue,
          transactions: transactions.filter(tx => tx.date <= date).length
        });
        
        lastValue = estimatedValue;
        lastInvestment = estimatedInvestment;
      }
      
      // Assicurati di includere sempre l'ultimo punto (data odierna)
      if (timeline.length > 0 && timeline[timeline.length - 1].date.toISOString() !== new Date().toISOString()) {
        timeline.push({
          date: new Date(),
          totalInvestment: currentPortfolio.totalInvestment,
          estimatedValue: currentPortfolio.currentValue,
          transactions: transactions.length
        });
      }
      
      return {
        timeline,
        totalInvestment: currentPortfolio.totalInvestment,
        currentValue: currentPortfolio.currentValue,
        performancePercentage: currentPortfolio.totalROI
      };
    } catch (error) {
      Logger.error('Errore nel calcolo della performance storica:', error);
      throw new ApiError(500, 'Errore nel calcolo della performance storica');
    }
  }

  /**
   * Ottiene statistiche di investimento per metodo di pagamento
   */
  async getInvestmentByPaymentMethod(userId: string, filters?: AnalyticsFilterDto): Promise<InvestmentByPaymentMethodDto> {
    try {
      // Ottieni statistiche dal repository
      const { methodStats, totalInvestment, transactionCount } = 
        await this.analyticsRepository.getInvestmentByPaymentMethod(userId, filters);
      
      interface MethodStats {
        totalAmount: number;
        currencies: Record<string, { totalAmount: number }>;
      }

      // Calcola le percentuali
      const percentageByMethod: Record<string, number> = {};
      const percentageByMethodAndCurrency: Record<string, Record<string, number>> = {};
      
      for (const [method, stats] of Object.entries(methodStats) as [string, MethodStats][]) {
        // Calcola la percentuale per ogni metodo
        if (totalInvestment > 0) {
          percentageByMethod[method] = (stats.totalAmount / totalInvestment) * 100;
        } else {
          percentageByMethod[method] = 0;
        }
        
        // Calcola la percentuale per ogni metodo e valuta
        percentageByMethodAndCurrency[method] = {};
        
        for (const [currency, currencyStats] of Object.entries(stats.currencies)) {
          if (totalInvestment > 0) {
            percentageByMethodAndCurrency[method][currency] = (currencyStats.totalAmount / totalInvestment) * 100;
          } else {
            percentageByMethodAndCurrency[method][currency] = 0;
          }
        }
      }
      
      // Prepara l'elenco dei metodi di pagamento
      const paymentMethods = Object.values(PaymentMethod).map(method => ({
        id: method,
        name: this.getPaymentMethodName(method)
      }));
      
      // Aggiungi il metodo per i non specificati
      paymentMethods.push({
        id: PaymentMethod.OTHER,
        name: 'Non specificato'
      });
      
      return {
        byMethod: methodStats,
        percentageByMethod,
        percentageByMethodAndCurrency,
        totalInvestment,
        transactionCount,
        paymentMethods
      };
    } catch (error) {
      Logger.error('Errore nel calcolo delle statistiche per metodo di pagamento:', error);
      throw new ApiError(500, 'Errore nel calcolo delle statistiche per metodo di pagamento');
    }
  }

  // --- Metodi privati di supporto ---

  /**
   * Calcola il profitto/perdita usando il metodo FIFO
   * @private
   */
  private calculateFIFO(tracker: any, quantityToSell: number, sellPrice: number): number {
    let remainingToSell = quantityToSell;
    let costBasis = 0;
    const saleProceeds = quantityToSell * sellPrice;
    
    // Ordina le acquisizioni per data
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
        const index = tracker.acquisitions.findIndex((a: any) => 
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
        const index = tracker.acquisitions.findIndex((a: any) => 
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

  /**
   * Calcola il profitto/perdita usando il metodo LIFO
   * @private
   */
  private calculateLIFO(tracker: any, quantityToSell: number, sellPrice: number): number {
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
        const index = tracker.acquisitions.findIndex((a: any) => 
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
        const index = tracker.acquisitions.findIndex((a: any) => 
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

  /**
   * Calcola il profitto/perdita usando il metodo del Costo Medio
   * @private
   */
  private calculateAverage(tracker: any, quantityToSell: number, sellPrice: number): number {
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

  /**
   * Funzione helper per generare descrizioni dei metodi
   * @private
   */
  private getMethodDescription(method: string): string {
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
   * Funzione helper per ottenere il nome del metodo di pagamento
   * @private
   */
  private getPaymentMethodName(method: string): string {
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
}