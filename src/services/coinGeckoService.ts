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
   * Recupera la lista delle prime N criptovalute per capitalizzazione di mercato
   * @param count - Numero di criptovalute da recuperare (default: 100)
   * @returns Lista delle criptovalute con i loro dati di mercato
   */
  static async getTopCoins(count: number = 100): Promise<Partial<ICrypto>[]> {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
        headers: this.getHeaders(),
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: count,
          page: 1,
          sparkline: false
        }
      });
      
      return response.data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        lastUpdated: new Date()
      }));
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