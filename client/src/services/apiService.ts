// client/src/services/apiService.ts

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Configurazione base
 */
const API_URL = 'http://localhost:2025/api';

/**
 * Tipi di risposta e errore API
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

export interface ApiError {
  message: string;
  details?: string;
  errorCode?: string;
  status?: number;
}

/**
 * Classe base per gestire le chiamate API
 */
class ApiService {
  private instance: AxiosInstance;

  constructor(baseURL = API_URL) {
    // Creazione dell'istanza axios con configurazione base
    this.instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 secondi di timeout
    });

    // Configura intercettori
    this.setupInterceptors();
  }

  /**
   * Configura gli intercettori per le richieste e le risposte
   */
  private setupInterceptors(): void {
    // Intercettore richieste
    this.instance.interceptors.request.use(
      (config) => {
        // Qui si possono aggiungere headers di autenticazione, ecc.
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercettore risposte
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        // Trasforma l'errore in un formato consistente
        const processedError = this.processApiError(error);
        return Promise.reject(processedError);
      }
    );
  }

  /**
   * Processa un errore API in un formato consistente
   */
  private processApiError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Errore con risposta dal server
        const data = error.response.data as any;
        return {
          message: data.message || this.getErrorMessageFromStatus(error.response.status),
          details: data.error || error.message,
          errorCode: data.errorCode || String(error.response.status),
          status: error.response.status
        };
      } else if (error.request) {
        // Richiesta fatta ma nessuna risposta
        return {
          message: 'Nessuna risposta dal server. Verifica la connessione.',
          details: 'Request made, but no response received'
        };
      }
    }
    
    // Errore generico
    return {
      message: error.message || 'Si è verificato un errore imprevisto',
      details: error.toString()
    };
  }

  /**
   * Genera un messaggio di errore basato sullo status HTTP
   */
  private getErrorMessageFromStatus(status: number): string {
    switch (status) {
      case 400:
        return 'Richiesta non valida.';
      case 401:
        return 'Accesso non autorizzato. Effettua il login e riprova.';
      case 403:
        return 'Non hai i permessi necessari per questa operazione.';
      case 404:
        return 'Risorsa non trovata.';
      case 422:
        return 'Dati inviati non validi.';
      case 429:
        return 'Troppe richieste. Attendi qualche minuto e riprova.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Errore del server. Riprova più tardi.';
      default:
        return `Errore (${status})`;
    }
  }

  /**
   * Metodi HTTP generici
   */
  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  }

  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  }

  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  }

  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<T>(url, config);
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  }
}

/**
 * API per le criptovalute
 */
class CryptoApi extends ApiService {
  async getAll() {
    return this.get('/cryptos');
  }

  async getBySymbol(symbol: string) {
    return this.get(`/cryptos/${symbol}`);
  }

  async search(query: string) {
    return this.get(`/cryptos/search?query=${query}`);
  }

  async triggerUpdate() {
    return this.post('/cryptos/update-prices');
  }

  async refreshAll() {
    return this.post('/cryptos/refresh-all');
  }

  async getCacheStats() {
    return this.get('/cryptos/cache/stats');
  }

  async invalidateCache(type?: string) {
    return this.post('/cryptos/cache/invalidate', { type });
  }
}

/**
 * API per le transazioni
 */
class TransactionApi extends ApiService {
  async getAll(params = {}) {
    return this.get('/transactions', { params });
  }

  async getById(id: string) {
    return this.get(`/transactions/${id}`);
  }

  async add(data: any) {
    return this.post('/transactions', data);
  }

  async update(id: string, data: any) {
    return this.put(`/transactions/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse> {
    return this.delete(`/transactions/${id}`);
  }

  async recordAirdrop(data: any) {
    return this.post('/transactions/airdrop', data);
  }

  async recordFarming(data: any) {
    return this.post('/transactions/farming', data);
  }
}

/**
 * API per il portafoglio
 */
class PortfolioApi extends ApiService {
  async getPortfolio() {
    return this.get('/portfolio');
  }

  async getValue() {
    return this.get('/portfolio/value');
  }

  async getByCategory() {
    return this.get('/portfolio/by-category');
  }

  async recalculate() {
    return this.post('/portfolio/recalculate');
  }
}

/**
 * API per i profitti realizzati
 */
class RealizedProfitApi extends ApiService {
  async getAll(params = {}) {
    return this.get('/realized-profits', { params });
  }

  async getTotal(params = {}) {
    return this.get('/realized-profits/total', { params });
  }

  async getByPeriod(groupBy = 'month') {
    return this.get('/realized-profits/by-period', { params: { groupBy } });
  }

  async getByCrypto(symbol: string) {
    return this.get(`/realized-profits/by-crypto/${symbol}`);
  }
}

/**
 * API per le analitiche
 */
class AnalyticsApi extends ApiService {
  async getPortfolioPerformance() {
    return this.get('/analytics/portfolio/performance');
  }

  async getRealizedProfitLoss(method: string = 'fifo') {
    return this.get(`/analytics/portfolio/realized-profit-loss?method=${method}`);
  }

  async getPortfolioStats() {
    return this.get('/analytics/portfolio/stats');
  }

  async getHistoricalPerformance(period: string = '1y') {
    return this.get(`/analytics/portfolio/historical?period=${period}`);
  }

  async getInvestmentByPaymentMethod() {
    return this.get('/analytics/portfolio/investment-by-payment-method');
  }
}

/**
 * API per le impostazioni
 */
class SettingsApi extends ApiService {
  async getSettings() {
    return this.get('/settings');
  }

  async updateSettings(data: any) {
    return this.put('/settings', data);
  }

  async testApiKey(apiKey: string) {
    return this.post('/settings/test-api-key', { apiKey });
  }
}

/**
 * Funzione di utilità per standardizzare il log degli errori
 */
export const logApiError = (error: ApiError, context?: string): void => {
  const contextPrefix = context ? `[${context}] ` : '';
  console.error(`${contextPrefix}Errore API: ${error.message}`);
  
  if (error.details) {
    console.error('Dettagli:', error.details);
  }
  
  if (error.status) {
    console.error('Status:', error.status);
  }
};

/**
 * Esportazione delle istanze API
 */
export const cryptoApi = new CryptoApi();
export const transactionApi = new TransactionApi();
export const portfolioApi = new PortfolioApi();
export const realizedProfitApi = new RealizedProfitApi();
export const analyticsApi = new AnalyticsApi();
export const settingsApi = new SettingsApi();

/**
 * Esportazione dell'oggetto API completo
 */
const api = {
  crypto: cryptoApi,
  transaction: transactionApi,
  portfolio: portfolioApi,
  realizedProfit: realizedProfitApi,
  analytics: analyticsApi,
  settings: settingsApi,
  logError: logApiError
};

export default api;