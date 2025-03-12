// client/src/services/enhancedApi.ts

import axios from 'axios';

// Base URL per le API
const API_URL = 'http://localhost:2025/api';

// Crea un'istanza di axios con la configurazione di base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API per le criptovalute
export const cryptoApi = {
  getAll: () => api.get('/cryptos'),
  getBySymbol: (symbol: string) => api.get(`/cryptos/${symbol}`),
  search: (query: string) => api.get(`/cryptos/search?query=${query}`),
  triggerUpdate: () => api.post('/cryptos/update-prices'),
  refreshAll: () => api.post('/cryptos/refresh-all'),
  getCacheStats: () => api.get('/cryptos/cache/stats'),
  invalidateCache: (type?: string) => api.post('/cryptos/cache/invalidate', { type })
};

// API per le transazioni
export const transactionApi = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  add: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  recordAirdrop: (data: any) => api.post('/transactions/airdrop', data),
  recordFarming: (data: any) => api.post('/transactions/farming', data)
};

// API per il portafoglio
export const portfolioApi = {
  get: () => api.get('/portfolio'),
  getValue: () => api.get('/portfolio/value'),
  getByCategory: () => api.get('/portfolio/by-category'),
  recalculate: () => api.post('/portfolio/recalculate')
};

// API per i profitti realizzati
export const realizedProfitApi = {
  getAll: (params = {}) => api.get('/realized-profits', { params }),
  getTotal: (params = {}) => api.get('/realized-profits/total', { params }),
  getByPeriod: (groupBy = 'month') => api.get('/realized-profits/by-period', { params: { groupBy } }),
  getByCrypto: (symbol: string) => api.get(`/realized-profits/by-crypto/${symbol}`)
};

// API per le analitiche
export const analyticsApi = {
  getPortfolioPerformance: () => api.get('/analytics/portfolio/performance'),
  getRealizedProfitLoss: (method: string = 'fifo') => 
    api.get(`/analytics/portfolio/realized-profit-loss?method=${method}`),
  getPortfolioStats: () => api.get('/analytics/portfolio/stats'),
  getHistoricalPerformance: (period: string = '1y') => 
    api.get(`/analytics/portfolio/historical?period=${period}`),
  getInvestmentByPaymentMethod: () => 
    api.get('/analytics/portfolio/investment-by-payment-method')
};

// API per le impostazioni
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.put('/settings', data),
  testApiKey: (apiKey: string) => api.post('/settings/test-api-key', { apiKey })
};

// Gestione centralizzata degli errori
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Il server ha risposto con un codice di errore
    const data = error.response.data;
    return data.message || `Errore ${error.response.status}: ${error.response.statusText}`;
  } else if (error.request) {
    // La richiesta è stata fatta ma non è stata ricevuta alcuna risposta
    return 'Il server non risponde. Verifica la tua connessione.';
  } else {
    // Si è verificato un errore durante la configurazione della richiesta
    return `Errore di richiesta: ${error.message}`;
  }
};

// Crea un oggetto con tutti i servizi API
const enhancedApi = {
  crypto: cryptoApi,
  transaction: transactionApi,
  portfolio: portfolioApi,
  realizedProfit: realizedProfitApi,
  analytics: analyticsApi,
  settings: settingsApi,
  handleError: handleApiError
};

export default enhancedApi;