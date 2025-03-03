// src/services/coinGeckoService.ts
import axios from 'axios';
import { ICrypto } from '../models/Crypto';
import dotenv from 'dotenv';

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
      
      return {
        symbol: response.data.symbol.toUpperCase(),
        name: response.data.name,
        currentPrice: response.data.market_data.current_price.usd,
        priceChangePercentage24h: response.data.market_data.price_change_percentage_24h,
        marketCap: response.data.market_data.market_cap.usd,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Errore nel recupero dati per ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Recupera tutte le criptovalute disponibili da CoinGecko tramite paginazione
   * @param maxCoins - Numero massimo di criptovalute da recuperare (0 per tutte)
   * @returns Lista completa delle criptovalute con i loro dati di mercato
   */
  static async getTopCoins(maxCoins: number = 0): Promise<Partial<ICrypto>[]> {
    const perPage = 250; // Massimo consentito da CoinGecko per richiesta
    let page = 1;
    let allCoins: Partial<ICrypto>[] = [];
    let hasMoreData = true;
    
    try {
      // Continua a recuperare le pagine finché ci sono dati disponibili
      // o fino a raggiungere il limite massimo se specificato
      while (hasMoreData && (maxCoins === 0 || allCoins.length < maxCoins)) {
        console.log(`Recupero pagina ${page} di criptovalute...`);
        
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
        
        // Incrementa il numero di pagina per la prossima iterazione
        page++;
        
        // Aggiungi un breve ritardo per evitare di superare i limiti di rate dell'API
        // specialmente per chiamate senza API key
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
      
      // Se è stato specificato un limite massimo, taglia l'array
      if (maxCoins > 0 && allCoins.length > maxCoins) {
        allCoins = allCoins.slice(0, maxCoins);
      }
      
      console.log(`Recuperate ${allCoins.length} criptovalute in totale.`);
      return allCoins;
      
    } catch (error) {
      console.error('Errore nel recupero lista criptovalute:', error);
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
      const response = await axios.get(`${COINGECKO_API_URL}/search`, {
        headers: this.getHeaders(),
        params: { query }
      });
      
      return response.data.coins;
    } catch (error) {
      console.error(`Errore nella ricerca di "${query}":`, error);
      throw error;
    }
  }
}

export default CoinGeckoService;