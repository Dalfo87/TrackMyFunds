// src/context/AppContext.tsx

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { cryptoApi, portfolioApi, transactionApi } from '../services/api';
import { logError, getErrorMessage } from '../utils';

// Definizione dello stato
interface AppState {
  // Dati del portafoglio
  portfolio: {
    data: any;
    assets: any[];
    loading: boolean;
    error: string | null;
  };
  // Dati dei prezzi delle criptovalute
  cryptos: {
    data: any[];
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
  };
  // Dati delle transazioni
  transactions: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

// Stato iniziale
const initialState: AppState = {
  portfolio: {
    data: null,
    assets: [],
    loading: false,
    error: null
  },
  cryptos: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  },
  transactions: {
    data: [],
    loading: false,
    error: null
  }
};

// Tipi di azioni
type Action =
  | { type: 'FETCH_PORTFOLIO_REQUEST' }
  | { type: 'FETCH_PORTFOLIO_SUCCESS'; payload: any }
  | { type: 'FETCH_PORTFOLIO_FAILURE'; payload: string }
  | { type: 'FETCH_CRYPTOS_REQUEST' }
  | { type: 'FETCH_CRYPTOS_SUCCESS'; payload: any[] }
  | { type: 'FETCH_CRYPTOS_FAILURE'; payload: string }
  | { type: 'FETCH_TRANSACTIONS_REQUEST' }
  | { type: 'FETCH_TRANSACTIONS_SUCCESS'; payload: any[] }
  | { type: 'FETCH_TRANSACTIONS_FAILURE'; payload: string }
  | { type: 'UPDATE_CRYPTO_PRICES_SUCCESS'; payload: Date };

// Reducer
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    // Portfolio actions
    case 'FETCH_PORTFOLIO_REQUEST':
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          loading: true,
          error: null
        }
      };
    case 'FETCH_PORTFOLIO_SUCCESS':
      return {
        ...state,
        portfolio: {
          data: action.payload,
          assets: action.payload.assets || [],
          loading: false,
          error: null
        }
      };
    case 'FETCH_PORTFOLIO_FAILURE':
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          loading: false,
          error: action.payload
        }
      };

    // Cryptos actions
    case 'FETCH_CRYPTOS_REQUEST':
      return {
        ...state,
        cryptos: {
          ...state.cryptos,
          loading: true,
          error: null
        }
      };
    case 'FETCH_CRYPTOS_SUCCESS':
      return {
        ...state,
        cryptos: {
          data: action.payload,
          loading: false,
          error: null,
          lastUpdated: new Date()
        }
      };
    case 'FETCH_CRYPTOS_FAILURE':
      return {
        ...state,
        cryptos: {
          ...state.cryptos,
          loading: false,
          error: action.payload
        }
      };
    case 'UPDATE_CRYPTO_PRICES_SUCCESS':
      return {
        ...state,
        cryptos: {
          ...state.cryptos,
          lastUpdated: action.payload
        }
      };

    // Transactions actions
    case 'FETCH_TRANSACTIONS_REQUEST':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          loading: true,
          error: null
        }
      };
    case 'FETCH_TRANSACTIONS_SUCCESS':
      return {
        ...state,
        transactions: {
          data: action.payload,
          loading: false,
          error: null
        }
      };
    case 'FETCH_TRANSACTIONS_FAILURE':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          loading: false,
          error: action.payload
        }
      };

    default:
      return state;
  }
};

// Creazione del context
interface AppContextProps {
  state: AppState;
  fetchPortfolio: () => Promise<void>;
  fetchCryptos: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  updateCryptoPrices: () => Promise<void>;
  addTransaction: (transaction: any) => Promise<boolean>;
  updateTransaction: (id: string, transaction: any) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch portfolio data
  const fetchPortfolio = async (): Promise<void> => {
    dispatch({ type: 'FETCH_PORTFOLIO_REQUEST' });
    try {
      const response = await portfolioApi.getValue();
      dispatch({ type: 'FETCH_PORTFOLIO_SUCCESS', payload: response.data });
    } catch (error) {
      logError(error, 'AppContext:fetchPortfolio');
      dispatch({ 
        type: 'FETCH_PORTFOLIO_FAILURE', 
        payload: getErrorMessage(error) 
      });
    }
  };

  // Fetch crypto data
  const fetchCryptos = async (): Promise<void> => {
    dispatch({ type: 'FETCH_CRYPTOS_REQUEST' });
    try {
      const response = await cryptoApi.getAll();
      dispatch({ type: 'FETCH_CRYPTOS_SUCCESS', payload: response.data });
    } catch (error) {
      logError(error, 'AppContext:fetchCryptos');
      dispatch({ 
        type: 'FETCH_CRYPTOS_FAILURE', 
        payload: getErrorMessage(error) 
      });
    }
  };

  // Update crypto prices
  const updateCryptoPrices = async (): Promise<void> => {
    try {
      await cryptoApi.triggerUpdate();
      dispatch({ type: 'UPDATE_CRYPTO_PRICES_SUCCESS', payload: new Date() });
      // Reload data after price update
      await Promise.all([fetchCryptos(), fetchPortfolio()]);
    } catch (error) {
      logError(error, 'AppContext:updateCryptoPrices');
      // Show error in cryptos section
      dispatch({ 
        type: 'FETCH_CRYPTOS_FAILURE', 
        payload: getErrorMessage(error) 
      });
    }
  };

  // Fetch transactions
  const fetchTransactions = async (): Promise<void> => {
    dispatch({ type: 'FETCH_TRANSACTIONS_REQUEST' });
    try {
      const response = await transactionApi.getAll();
      dispatch({ type: 'FETCH_TRANSACTIONS_SUCCESS', payload: response.data });
    } catch (error) {
      logError(error, 'AppContext:fetchTransactions');
      dispatch({ 
        type: 'FETCH_TRANSACTIONS_FAILURE', 
        payload: getErrorMessage(error) 
      });
    }
  };

  // Add transaction
  const addTransaction = async (transaction: any): Promise<boolean> => {
    try {
      if (transaction.type === 'airdrop') {
        await transactionApi.recordAirdrop(transaction);
      } else {
        await transactionApi.add(transaction);
      }
      
      // Refresh data after adding transaction
      await Promise.all([fetchTransactions(), fetchPortfolio()]);
      return true;
    } catch (error) {
      logError(error, 'AppContext:addTransaction');
      return false;
    }
  };

  // Update transaction
  const updateTransaction = async (id: string, transaction: any): Promise<boolean> => {
    try {
      await transactionApi.update(id, transaction);
      
      // Refresh data after updating transaction
      await Promise.all([fetchTransactions(), fetchPortfolio()]);
      return true;
    } catch (error) {
      logError(error, 'AppContext:updateTransaction');
      return false;
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      await transactionApi.delete(id);
      
      // Refresh data after deleting transaction
      await Promise.all([fetchTransactions(), fetchPortfolio()]);
      return true;
    } catch (error) {
      logError(error, 'AppContext:deleteTransaction');
      return false;
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchPortfolio(),
        fetchCryptos(),
        fetchTransactions()
      ]);
    };

    loadInitialData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        fetchPortfolio,
        fetchCryptos,
        fetchTransactions,
        updateCryptoPrices,
        addTransaction,
        updateTransaction,
        deleteTransaction
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};