// src/hooks/useUser.ts
import { useCallback } from 'react';
import { 
  useAppContext,
  selectUser, 
  selectIsAuthenticated, 
  selectUserLoading,
  loginRequest, 
  loginSuccess, 
  loginFailure, 
  logout, 
  updateProfile
} from '../context/AppContext';

interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface UseUserReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export function useUser(): UseUserReturn {
  const { state, dispatch } = useAppContext();
  
  const user = selectUser(state);
  const isAuthenticated = selectIsAuthenticated(state);
  const isLoading = selectUserLoading(state);
  
  // Funzione login migliorata con useCallback e gestione errori più robusta
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    dispatch(loginRequest());
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Gestione errore della risposta API
        const errorMessage = data.message || `Errore ${response.status}: ${response.statusText}`;
        dispatch(loginFailure(errorMessage));
        throw new Error(errorMessage);
      }
      
      // Login riuscito
      dispatch(loginSuccess(data.user));
      return data.user;
    } catch (error) {
      // Gestione degli errori di rete o altri errori
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto durante il login';
      dispatch(loginFailure(errorMessage));
      throw error;
    }
  }, [dispatch]);
  
  // Funzione logout con useCallback
  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);
  
  // Funzione updateProfile con useCallback
  const updateUserProfile = useCallback((data: Partial<User>) => {
    dispatch(updateProfile(data));
  }, [dispatch]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: logoutUser,
    updateProfile: updateUserProfile
  };
}