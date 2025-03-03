// src/services/coinGeckoService.ts
import axios, { AxiosError } from 'axios';
import { ICrypto } from '../models/Crypto';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Carica le variabili d'ambiente
dotenv.config();

// Base URL dell'API CoinGecko
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
// Ottieni la chiave API dalle variabili d'ambiente
const API_KEY = process.env.COINGECKO_API_KEY;

/**
 * Servizio per interagire con l'API di CoinGecko
 */
export class CoinGeckoService {
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
   * Recupera il prezzo attuale per una criptovaluta specifica
   * @param coinId - ID della moneta in CoinGecko (es. 'bitcoin')
   * @returns Dati sul prezzo attuale
   */
  static async getCoinPrice(coinId: string): Promise<any> {
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
      
      return {
        symbol: response.data.symbol.toUpperCase(),
        name: response.data.name,
        currentPrice: response.data.market_data.current_price.usd,
        priceChangePercentage24h: response.data.market_data.price_change_percentage_24h,
        marketCap: response.data.market_data.market_cap.usd,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Errore nel recupero dati per ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Recupera la lista delle prime N criptovalute per capitalizzazione di mercato
   * @param maxCoins - Numero massimo di criptovalute da recuperare (0 per tutte)
   * @returns Lista delle criptovalute con i loro dati di mercato
   */
  static async getTopCoins(maxCoins: number = 100): Promise<Partial<ICrypto>[]> {
    // Se maxCoins è 0, recupera tutte le criptovalute
    if (maxCoins === 0) {
      logger.info('Richiesta di recuperare TUTTE le criptovalute (senza limiti)');
      return await this.getAllCoins();
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
      
      return response.data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        lastUpdated: new Date()
      }));
    } catch (error) {
      logger.error('Errore nel recupero lista criptovalute:', error);
      throw error;
    }
  }
  
  /**
   * Recupera tutte le criptovalute disponibili da CoinGecko tramite paginazione
   * @returns Lista completa delle criptovalute
   */
  private static async getAllCoins(): Promise<Partial<ICrypto>[]> {
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
      return allCoins;
      
    } catch (error) {
      logger.error('Errore nel recupero lista criptovalute:', error);
      throw error;
    }
  }

  /**
   * Cerca una criptovaluta per nome o simbolo
   * @param query - Stringa di ricerca
   * @returns Lista delle corrispondenze trovate
   */
  static async searchCoins(query: string): Promise<any[]> {
    try {
      logger.info(`Ricerca criptovalute con query: "${query}"`);
      
      const response = await axios.get(`${COINGECKO_API_URL}/search`, {
        headers: this.getHeaders(),
        params: { query }
      });
      
      logger.info(`Ricerca completata, trovati ${response.data.coins.length} risultati`);
      
      return response.data.coins;
    } catch (error) {
      logger.error(`Errore nella ricerca di "${query}":`, error);
      throw error;
    }
  }
}

export default CoinGeckoService;