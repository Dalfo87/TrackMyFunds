// client/src/services/api.ts

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
  triggerUpdate: () => api.post('/cryptos/trigger-update')
};

// API per le transazioni
export const transactionApi = {
  getAll: () => api.get('/transactions'),
  getById: (id: string) => api.get(`/transactions/${id}`),
  add: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  recordAirdrop: (data: any) => api.post('/transactions/airdrop', data)
};

// API per il portafoglio
export const portfolioApi = {
  get: () => api.get('/portfolio'),
  getValue: () => api.get('/portfolio/value'),
  getByCategory: () => api.get('/portfolio/by-category')
};

// API per le analitiche
export const analyticsApi = {
  getPortfolioPerformance: () => api.get('/analytics/portfolio/performance'),
  getRealizedProfitLoss: (method: string = 'fifo') => 
    api.get(`/analytics/portfolio/realized-profit-loss?method=${method}`),
  getPortfolioStats: () => api.get('/analytics/portfolio/stats'),
  getHistoricalPerformance: (period: string = '1y') => 
    api.get(`/analytics/portfolio/historical?period=${period}`)
};

export default {
  crypto: cryptoApi,
  transaction: transactionApi,
  portfolio: portfolioApi,
  analytics: analyticsApi
};