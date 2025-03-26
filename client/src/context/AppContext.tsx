// src/context/AppContext.tsx

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import api, { cryptoApi, portfolioApi, transactionApi, logApiError } from '../services/apiService';

// Definizione dell'interfaccia User
interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

// Interfacce per le impostazioni
interface DisplaySettings {
  fontSize: string;
  compactMode: boolean;
  highContrast: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  frequency: string;
}

interface PrivacySettings {
  shareData: boolean;
  cookiePreferences: string;
}

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
  // Dati utente
  user: {
    data: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  // Impostazioni
  settings: {
    theme: string;
    language: string;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    display: DisplaySettings;
  };
}

// Valori di default per le impostazioni
const defaultSettings = {
  theme: 'light',
  language: 'it',
  notifications: {
    email: true,
    push: true,
    frequency: 'daily'
  },
  privacy: {
    shareData: false,
    cookiePreferences: 'essential'
  },
  display: {
    fontSize: 'medium',
    compactMode: false,
    highContrast: false
  }
};

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
  },
  user: {
    data: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  settings: defaultSettings
};

// Tipi di azioni
type Action =
  // Portfolio actions
  | { type: 'FETCH_PORTFOLIO_REQUEST' }
  | { type: 'FETCH_PORTFOLIO_SUCCESS'; payload: any }
  | { type: 'FETCH_PORTFOLIO_FAILURE'; payload: string }
  // Cryptos actions
  | { type: 'FETCH_CRYPTOS_REQUEST' }
  | { type: 'FETCH_CRYPTOS_SUCCESS'; payload: any[] }
  | { type: 'FETCH_CRYPTOS_FAILURE'; payload: string }
  | { type: 'UPDATE_CRYPTO_PRICES_SUCCESS'; payload: Date }
  // Transactions actions
  | { type: 'FETCH_TRANSACTIONS_REQUEST' }
  | { type: 'FETCH_TRANSACTIONS_SUCCESS'; payload: any[] }
  | { type: 'FETCH_TRANSACTIONS_FAILURE'; payload: string }
  // User actions
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  // Settings actions
  | { type: 'CHANGE_THEME'; payload: string }
  | { type: 'CHANGE_LANGUAGE'; payload: string }
  | { type: 'UPDATE_NOTIFICATION_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'UPDATE_PRIVACY_SETTINGS'; payload: Partial<PrivacySettings> }
  | { type: 'UPDATE_DISPLAY_SETTINGS'; payload: Partial<DisplaySettings> }
  | { type: 'RESET_SETTINGS' };

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

    // User actions
    case 'LOGIN_REQUEST':
      return {
        ...state,
        user: {
          ...state.user,
          loading: true,
          error: null
        }
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: {
          data: action.payload,
          isAuthenticated: true,
          loading: false,
          error: null
        }
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: {
          ...state.user,
          loading: false,
          isAuthenticated: false,
          error: action.payload
        }
      };
    case 'LOGOUT':
      return {
        ...state,
        user: {
          data: null,
          isAuthenticated: false,
          loading: false,
          error: null
        }
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: {
          ...state.user,
          data: state.user.data 
            ? { ...state.user.data, ...action.payload } 
            : null
        }
      };

    // Settings actions
    case 'CHANGE_THEME':
      return {
        ...state,
        settings: {
          ...state.settings,
          theme: action.payload
        }
      };
    case 'CHANGE_LANGUAGE':
      return {
        ...state,
        settings: {
          ...state.settings,
          language: action.payload
        }
      };
    case 'UPDATE_NOTIFICATION_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          notifications: {
            ...state.settings.notifications,
            ...action.payload
          }
        }
      };
    case 'UPDATE_PRIVACY_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          privacy: {
            ...state.settings.privacy,
            ...action.payload
          }
        }
      };
    case 'UPDATE_DISPLAY_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          display: {
            ...state.settings.display,
            ...action.payload
          }
        }
      };
    case 'RESET_SETTINGS':
      return {
        ...state,
        settings: defaultSettings
      };

    default:
      return state;
  }
};

// Creazione del context
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>; // Aggiungiamo il dispatch come parte dell'API pubblica
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
    } catch (error: any) {
      logApiError(error, 'AppContext:fetchPortfolio');
      dispatch({ 
        type: 'FETCH_PORTFOLIO_FAILURE', 
        payload: error.message || 'Errore nel caricamento del portafoglio'
      });
    }
  };

  // Fetch crypto data
  const fetchCryptos = async (): Promise<void> => {
    dispatch({ type: 'FETCH_CRYPTOS_REQUEST' });
    try {
      const response = await cryptoApi.getAll();
      dispatch({ type: 'FETCH_CRYPTOS_SUCCESS', payload: response.data });
    } catch (error: any) {
      logApiError(error, 'AppContext:fetchCryptos');
      dispatch({ 
        type: 'FETCH_CRYPTOS_FAILURE', 
        payload: error.message || 'Errore nel caricamento delle criptovalute'
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
    } catch (error: any) {
      logApiError(error, 'AppContext:updateCryptoPrices');
      // Show error in cryptos section
      dispatch({ 
        type: 'FETCH_CRYPTOS_FAILURE', 
        payload: error.message || 'Errore nell\'aggiornamento dei prezzi'
      });
    }
  };

  // Fetch transactions
  const fetchTransactions = async (): Promise<void> => {
    dispatch({ type: 'FETCH_TRANSACTIONS_REQUEST' });
    try {
      const response = await transactionApi.getAll();
      dispatch({ type: 'FETCH_TRANSACTIONS_SUCCESS', payload: response.data });
    } catch (error: any) {
      logApiError(error, 'AppContext:fetchTransactions');
      dispatch({ 
        type: 'FETCH_TRANSACTIONS_FAILURE', 
        payload: error.message || 'Errore nel caricamento delle transazioni'
      });
    }
  };

  // Add transaction
  const addTransaction = async (transaction: any): Promise<boolean> => {
    try {
      if (transaction.type === 'airdrop') {
        await transactionApi.recordAirdrop(transaction);
      } else if (transaction.type === 'farming') {
        await transactionApi.recordFarming(transaction);
      } else {
        await transactionApi.add(transaction);
      }
      
      // Refresh data after adding transaction
      await Promise.all([fetchTransactions(), fetchPortfolio()]);
      return true;
    } catch (error: any) {
      logApiError(error, 'AppContext:addTransaction');
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
    } catch (error: any) {
      logApiError(error, 'AppContext:updateTransaction');
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
    } catch (error: any) {
      logApiError(error, 'AppContext:deleteTransaction');
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
        dispatch, // Esportiamo il dispatch
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

// Action creators per compatibilità con gli hook
export const loginRequest = () => ({ type: 'LOGIN_REQUEST' as const });
export const loginSuccess = (user: User) => ({ type: 'LOGIN_SUCCESS' as const, payload: user });
export const loginFailure = (error: string) => ({ type: 'LOGIN_FAILURE' as const, payload: error });
export const logout = () => ({ type: 'LOGOUT' as const });
export const updateProfile = (userData: Partial<User>) => ({ type: 'UPDATE_PROFILE' as const, payload: userData });

export const changeTheme = (theme: string) => ({ type: 'CHANGE_THEME' as const, payload: theme });
export const changeLanguage = (language: string) => ({ type: 'CHANGE_LANGUAGE' as const, payload: language });
export const updateNotificationSettings = (settings: Partial<NotificationSettings>) => 
  ({ type: 'UPDATE_NOTIFICATION_SETTINGS' as const, payload: settings });
export const updatePrivacySettings = (settings: Partial<PrivacySettings>) => 
  ({ type: 'UPDATE_PRIVACY_SETTINGS' as const, payload: settings });
export const updateDisplaySettings = (settings: Partial<DisplaySettings>) => 
  ({ type: 'UPDATE_DISPLAY_SETTINGS' as const, payload: settings });
export const resetSettings = () => ({ type: 'RESET_SETTINGS' as const });

// Selettori per compatibilità con gli hook
export const selectUser = (state: AppState) => state.user.data;
export const selectIsAuthenticated = (state: AppState) => state.user.isAuthenticated;
export const selectUserLoading = (state: AppState) => state.user.loading;

export const selectTheme = (state: AppState) => state.settings.theme;
export const selectLanguage = (state: AppState) => state.settings.language;
export const selectNotificationSettings = (state: AppState) => state.settings.notifications;
export const selectPrivacySettings = (state: AppState) => state.settings.privacy;
export const selectDisplaySettings = (state: AppState) => state.settings.display;
export const selectAllSettings = (state: AppState) => state.settings;