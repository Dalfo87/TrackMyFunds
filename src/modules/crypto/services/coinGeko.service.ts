// src/modules/crypto/services/coinGecko.service.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Logger } from '../../../shared/utils/logger';
import { config } from '../../../shared/config';
import { ErrorHandler } from '../../../shared/utils/errorHandler';

export class CoinGeckoService {
  private api: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  
  constructor() {
    this.baseUrl = config.api.coingecko.baseUrl;
    this.apiKey = config.api.coingecko.apiKey;
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: this.getHeaders()
    });
    
    // Interceptor per gestire gli errori
    this.api.interceptors.response.use(
      response => response,
      error => this.handleApiError(error)
    );
  }
  
  /**
   * Ottiene gli headers per le richieste API
   */
  private getHeaders() {
    const headers: Record<string, string> = {};
    
    if (this.apiKey) {
      headers['x-cg-api-key'] = this.apiKey;
    }
    
    return headers;
  }
  
  /**
   * Gestisce gli errori delle richieste API
   */
  private handleApiError(error: AxiosError) {
    if (error.response) {
      // Errore con risposta dal server
      const status = error.response.status;
      const message = error.response.data && (error.response.data as any).message
        ? (error.response.data as any).message
        : `Errore API CoinGecko: ${status}`;
        
      if (status === 429) {
        Logger.error('Rate limit CoinGecko superato. Considera l\'upgrade a un piano a pagamento.');
      }
      
      throw ErrorHandler.createError(status, message);
    } else if (error.request) {
      // Errore senza risposta dal server
      throw ErrorHandler.createError(500, 'Nessuna risposta dall\'API CoinGecko. Verifica la tua connessione.');
    } else {
      // Altro tipo di errore
      throw ErrorHandler.createError(500, `Errore nella richiesta: ${error.message}`);
    }
  }
  
  /**
   * Recupera le migliori N criptovalute per market cap
   */
  async getTopCoins(limit: number = 100): Promise<any[]> {
    try {
      Logger.info(`Recupero top ${limit} criptovalute da CoinGecko`);
      
      const response = await this.api.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false
        }
      });
      
      // Mappiamo i dati nel formato che ci serve
      return response.data.map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap
      }));
    } catch (error) {
      Logger.error('Errore nel recupero delle top criptovalute da CoinGecko:', error);
      throw error;
    }
  }
  
  /**
   * Recupera i dettagli di una specifica criptovaluta tramite ID
   */
  async getCoinDetails(coinId: string): Promise<any> {
    try {
      Logger.info(`Recupero dettagli per criptovaluta: ${coinId}`);
      
      const response = await this.api.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });
      
      // Estraiamo i dati che ci interessano
      const coin = response.data;
      return {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.market_data.current_price.usd,
        priceChangePercentage24h: coin.market_data.price_change_percentage_24h,
        marketCap: coin.market_data.market_cap.usd,
        volume24h: coin.market_data.total_volume.usd,
        circulatingSupply: coin.market_data.circulating_supply,
        totalSupply: coin.market_data.total_supply,
        ath: coin.market_data.ath.usd,
        athDate: coin.market_data.ath_date.usd,
        imageUrl: coin.image?.large
      };
    } catch (error) {
      Logger.error(`Errore nel recupero dei dettagli per ${coinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Cerca criptovalute per nome o simbolo
   */
  async searchCoins(query: string, limit: number = 10): Promise<any[]> {
    try {
      Logger.info(`Ricerca criptovalute con query: "${query}"`);
      
      const response = await this.api.get('/search', {
        params: { query }
      });
      
      // Filtriamo e mappiamo i risultati
      const coins = response.data.coins.slice(0, limit);
      
      return coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        marketCapRank: coin.market_cap_rank,
        thumb: coin.thumb
      }));
    } catch (error) {
      Logger.error(`Errore nella ricerca di criptovalute per "${query}":`, error);
      throw error;
    }
  }
  
  /**
   * Recupera i dati storici dei prezzi per una criptovaluta
   */
  async getCoinHistory(coinId: string, days: string = '30'): Promise<any> {
    try {
      Logger.info(`Recupero storico prezzi per ${coinId} degli ultimi ${days} giorni`);
      
      const response = await this.api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days === '1' ? 'hourly' : 'daily'
        }
      });
      
      // Formatta i dati in un formato più utilizzabile
      const { prices, market_caps, total_volumes } = response.data;
      
      return {
        prices: prices.map((item: [number, number]) => ({
          timestamp: item[0],
          price: item[1]
        })),
        marketCaps: market_caps.map((item: [number, number]) => ({
          timestamp: item[0],
          marketCap: item[1]
        })),
        volumes: total_volumes.map((item: [number, number]) => ({
          timestamp: item[0],
          volume: item[1]
        }))
      };
    } catch (error) {
      Logger.error(`Errore nel recupero dello storico per ${coinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Testa se una chiave API di CoinGecko è valida
   */
  async testApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    try {
      Logger.info('Test chiave API CoinGecko');
      
      // Creiamo un'istanza temporanea dell'API con la chiave da testare
      const tempApi = axios.create({
        baseURL: this.baseUrl,
        headers: { 'x-cg-api-key': apiKey }
      });
      
      // Eseguiamo una semplice richiesta per verificare la chiave
      const response = await tempApi.get('/ping');
      
      if (response.status === 200) {
        return {
          valid: true,
          message: 'Chiave API valida e funzionante'
        };
      } else {
        return {
          valid: false,
          message: `Risposta non valida: codice ${response.status}`
        };
      }
    } catch (error) {
      Logger.error('Errore nel test della chiave API CoinGecko:', error);
      
      let message = 'Errore nel test della chiave API';
      
      if (error instanceof AxiosError) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          message = 'Chiave API non valida o non autorizzata';
        } else if (error.response?.status === 429) {
          message = 'Limite di richieste raggiunto, riprova più tardi';
        } else if (error.response) {
          message = `Errore ${error.response.status}: ${error.response.statusText || 'Errore della richiesta'}`;
        } else if (error.request) {
          message = 'Nessuna risposta dal server CoinGecko, verifica la tua connessione';
        }
      }
      
      return { valid: false, message };
    }
  }
}