// src/services/coinGeckoService.ts
import axios, { AxiosError } from 'axios';
import { ICrypto } from '../models/Crypto';
import dotenv from 'dotenv';
import logger from '../utils/logger';
import cacheService from './cacheService';

// Carica le variabili d'ambiente
dotenv.config();

// Base URL dell'API CoinGecko
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
// Ottieni la chiave API dalle variabili d'ambiente
const API_KEY = process.env.COINGECKO_API_KEY;

// Configurazione TTL (in secondi) per diversi tipi di richieste
const CACHE_TTL = {
  COIN_PRICE: 5 * 60,       // 5 minuti per i prezzi singoli
  TOP_COINS: 15 * 60,       // 15 minuti per le top N criptovalute
  ALL_COINS: 30 * 60,       // 30 minuti per l'elenco completo
  SEARCH: 10 * 60           // 10 minuti per le ricerche
};

// Prefissi per le chiavi di cache
const CACHE_KEY = {
  COIN_PRICE: 'coin_price_',
  TOP_COINS: 'top_coins_',
  ALL_COINS: 'all_coins',
  SEARCH: 'search_'
};

/**
 * Servizio per interagire con l'API di CoinGecko
 */
class CoinGeckoService {
  /**
   * Crea gli headers di base per le richieste API
   * @returns Headers con API Key se disponibile
   */
  private static getHeaders() {
    // Se la chiave API è presente, aggiungi l'header di autenticazione
    if (API_KEY) {
      return {
        'x-cg-api-key': API_KEY
      };
    }
    return {};
  }

  /**
   * Testa la validità di una chiave API di CoinGecko
   * @param apiKey - Chiave API da testare
   * @returns Oggetto con stato di validità e messaggio
   */
  static async testApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
      logger.info(`Test della chiave API CoinGecko: ${apiKey.substring(0, 4)}...`);
      
      const response = await axios.get(`${COINGECKO_API_URL}/ping`, {
        params: {
          x_cg_demo_api_key: apiKey
        }
      });
      
      // Se la richiesta va a buon fine e restituisce uno stato 200, la chiave è valida
      if (response.status === 200) {
        logger.info('Test della chiave API CoinGecko completato con successo');
        return {
          valid: true,
          message: 'Chiave API valida e funzionante'
        };
      } else {
        logger.warn(`Test della chiave API CoinGecko fallito con status: ${response.status}`);
        return {
          valid: false,
          message: `Risposta non valida: codice ${response.status}`
        };
      }
    } catch (error) {
      logger.error('Errore nel test della chiave API CoinGecko:', error);
      
      let errorMessage = 'Errore durante il test della chiave API';
      
      if (error instanceof AxiosError) {
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            errorMessage = 'Chiave API non valida o non autorizzata';
          } else if (error.response.status === 429) {
            errorMessage = 'Limite di richieste raggiunto, riprova più tardi';
          } else {
            errorMessage = `Errore ${error.response.status}: ${error.response.statusText || 'Errore della richiesta'}`;
          }
        } else if (error.request) {
          errorMessage = 'Nessuna risposta dal server CoinGecko, verifica la tua connessione';
        }
      }
      
      return {
        valid: false,
        message: errorMessage
      };
    }
  }

  /**
   * Recupera il prezzo attuale per una criptovaluta specifica
   * @param coinId - ID della moneta in CoinGecko (es. 'bitcoin')
   * @param useCache - Se true, verifica prima nella cache (default: true)
   * @returns Dati sul prezzo attuale
   */
  static async getCoinPrice(coinId: string, useCache: boolean = true): Promise<any> {
    const cacheKey = `${CACHE_KEY.COIN_PRICE}${coinId}`;
    
    // Verifica se i dati sono già in cache e non sono scaduti
    if (useCache) {
      const cachedData = cacheService.get<any>(cacheKey);
      if (cachedData) {
        logger.info(`Dati per ${coinId} ottenuti dalla cache`);
        return cachedData;
      }
    }
    
    try {
      logger.info(`Recupero dati per la criptovaluta con ID: ${coinId}`);
      
      const response = await axios.get(`${COINGECKO_API_URL}/coins/${coinId}`, {
        headers: this.getHeaders(),
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });
      
      logger.info(`Dati recuperati con successo per ${response.data.name}`);
      
      const result = {
        symbol: response.data.symbol.toUpperCase(),
        name: response.data.name,
        currentPrice: response.data.market_data.current_price.usd,
        priceChangePercentage24h: response.data.market_data.price_change_percentage_24h,
        marketCap: response.data.market_data.market_cap.usd,
        lastUpdated: new Date()
      };
      
      // Memorizza i dati in cache
      cacheService.set(cacheKey, result, CACHE_TTL.COIN_PRICE);
      
      return result;
    } catch (error) {
      logger.error(`Errore nel recupero dati per ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Recupera la lista delle prime N criptovalute per capitalizzazione di mercato
   * @param maxCoins - Numero massimo di criptovalute da recuperare (0 per tutte)
   * @param useCache - Se true, verifica prima nella cache (default: true)
   * @returns Lista delle criptovalute con i loro dati di mercato
   */
  static async getTopCoins(maxCoins: number = 100, useCache: boolean = true): Promise<Partial<ICrypto>[]> {
    // Se maxCoins è 0, recupera tutte le criptovalute
    if (maxCoins === 0) {
      logger.info('Richiesta di recuperare TUTTE le criptovalute (senza limiti)');
      return await this.getAllCoins(useCache);
    }
    
    const cacheKey = `${CACHE_KEY.TOP_COINS}${maxCoins}`;
    
    // Verifica se i dati sono già in cache e non sono scaduti
    if (useCache) {
      const cachedData = cacheService.get<Partial<ICrypto>[]>(cacheKey);
      if (cachedData) {
        logger.info(`Top ${maxCoins} criptovalute ottenute dalla cache`);
        return cachedData;
      }
    }
    
    try {
      logger.info(`Recupero delle top ${maxCoins} criptovalute...`);
      
      const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
        headers: this.getHeaders(),
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: maxCoins,
          page: 1,
          sparkline: false
        }
      });
      
      logger.info(`Recuperate ${response.data.length} criptovalute con successo`);
      
      const result = response.data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        lastUpdated: new Date()
      }));
      
      // Memorizza i dati in cache
      cacheService.set(cacheKey, result, CACHE_TTL.TOP_COINS);
      
      return result;
    } catch (error) {
      logger.error('Errore nel recupero lista criptovalute:', error);
      throw error;
    }
  }
  
  /**
   * Recupera tutte le criptovalute disponibili da CoinGecko tramite paginazione
   * @param useCache - Se true, verifica prima nella cache (default: true)
   * @returns Lista completa delle criptovalute
   */
  private static async getAllCoins(useCache: boolean = true): Promise<Partial<ICrypto>[]> {
    const cacheKey = CACHE_KEY.ALL_COINS;
    
    // Verifica se i dati sono già in cache e non sono scaduti
    if (useCache) {
      const cachedData = cacheService.get<Partial<ICrypto>[]>(cacheKey);
      if (cachedData) {
        logger.info(`Elenco completo criptovalute ottenuto dalla cache (${cachedData.length} elementi)`);
        return cachedData;
      }
    }
    
    const perPage = 250; // Massimo consentito da CoinGecko per richiesta
    let page = 1;
    let allCoins: Partial<ICrypto>[] = [];
    let hasMoreData = true;
    
    try {
      // Continua a recuperare le pagine finché ci sono dati disponibili
      while (hasMoreData) {
        logger.info(`Recupero pagina ${page} di criptovalute...`);
        
        try {
          const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
            headers: this.getHeaders(),
            params: {
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: perPage,
              page: page,
              sparkline: false
            }
          });
          
          // Se non ci sono più risultati, interrompi il ciclo
          if (response.data.length === 0) {
            hasMoreData = false;
            logger.info('Nessun altro risultato disponibile, terminata l\'estrazione dei dati');
            break;
          }
          
          // Mappa i dati e aggiungili all'array completo
          const pageCoins = response.data.map((coin: any) => ({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            currentPrice: coin.current_price,
            priceChangePercentage24h: coin.price_change_percentage_24h,
            marketCap: coin.market_cap,
            lastUpdated: new Date()
          }));
          
          allCoins = [...allCoins, ...pageCoins];
          logger.info(`Pagina ${page}: recuperate ${pageCoins.length} criptovalute, totale finora: ${allCoins.length}`);
          
          // Incrementa il numero di pagina per la prossima iterazione
          page++;
          
          // Aggiungi un breve ritardo per evitare di superare i limiti di rate dell'API
          // specialmente per chiamate senza API key
          logger.debug('Pausa di 1.1 secondi per rispettare i rate limits dell\'API...');
          await new Promise(resolve => setTimeout(resolve, 1100));
        } catch (error) {
          // Se riceviamo un errore 429 (Too Many Requests), aspettiamo di più e riproviamo
          if (error instanceof AxiosError && error.response?.status === 429) {
            const waitTime = 10000; // 10 secondi
            logger.warn(`Limite di frequenza raggiunto (429), aspetto ${waitTime/1000} secondi prima di riprovare...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Non incrementiamo la pagina così riproveremo la stessa pagina
            continue;
          }
          
          // Per altri errori, registriamo e rilanciamo
          logger.error(`Errore nel recupero della pagina ${page}:`, error);
          throw error;
        }
      }
      
      logger.info(`Recuperate ${allCoins.length} criptovalute in totale.`);
      
      // Memorizza i dati in cache
      cacheService.set(cacheKey, allCoins, CACHE_TTL.ALL_COINS);
      
      return allCoins;
      
    } catch (error) {
      logger.error('Errore nel recupero lista criptovalute:', error);
      throw error;
    }
  }

  /**
   * Cerca una criptovaluta per nome o simbolo
   * @param query - Stringa di ricerca
   * @param useCache - Se true, verifica prima nella cache (default: true)
   * @returns Lista delle corrispondenze trovate
   */
  static async searchCoins(query: string, useCache: boolean = true): Promise<any[]> {
    // Normalizza la query per l'uso come chiave di cache
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `${CACHE_KEY.SEARCH}${normalizedQuery}`;
    
    // Verifica se i dati sono già in cache e non sono scaduti
    if (useCache) {
      const cachedData = cacheService.get<any[]>(cacheKey);
      if (cachedData) {
        logger.info(`Risultati di ricerca per "${query}" ottenuti dalla cache`);
        return cachedData;
      }
    }
    
    try {
      logger.info(`Ricerca criptovalute con query: "${query}"`);
      
      const response = await axios.get(`${COINGECKO_API_URL}/search`, {
        headers: this.getHeaders(),
        params: { query }
      });
      
      logger.info(`Ricerca completata, trovati ${response.data.coins.length} risultati`);
      
      // Memorizza i dati in cache
      cacheService.set(cacheKey, response.data.coins, CACHE_TTL.SEARCH);
      
      return response.data.coins;
    } catch (error) {
      logger.error(`Errore nella ricerca di "${query}":`, error);
      throw error;
    }
  }
  
  /**
   * Invalida tutta la cache o parti specifiche
   * @param cacheType - Tipo di cache da invalidare (opzionale, se omesso invalida tutto)
   */
  static invalidateCache(cacheType?: string): void {
    if (!cacheType) {
      // Invalida tutta la cache
      cacheService.clear();
      logger.info('Tutta la cache CoinGecko è stata invalidata');
      return;
    }
    
    // Invalida specifici tipi di cache
    switch (cacheType) {
      case 'prices':
        cacheService.deleteByPrefix(CACHE_KEY.COIN_PRICE);
        logger.info('Cache dei prezzi delle criptovalute invalidata');
        break;
      case 'top':
        cacheService.deleteByPrefix(CACHE_KEY.TOP_COINS);
        logger.info('Cache delle top criptovalute invalidata');
        break;
      case 'all':
        cacheService.delete(CACHE_KEY.ALL_COINS);
        logger.info('Cache dell\'elenco completo invalidata');
        break;
      case 'search':
        cacheService.deleteByPrefix(CACHE_KEY.SEARCH);
        logger.info('Cache delle ricerche invalidata');
        break;
      default:
        logger.warn(`Tipo di cache sconosciuto: ${cacheType}, nessuna invalidazione eseguita`);
    }
  }
  
  /**
   * Ottiene statistiche sulla cache
   */
  static getCacheStats(): any {
    return cacheService.getStats();
  }
}

export default CoinGeckoService;