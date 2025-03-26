// src/hooks/useUser.ts
import { useAppContext } from '../context/AppContext';
import { selectUser, selectIsAuthenticated, selectUserLoading } from '../context/selectors';
import { loginRequest, loginSuccess, loginFailure, logout, updateProfile } from '../context/actions';

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
  
  // Funzioni asincrone che utilizzano dispatch
  const login = async (credentials: LoginCredentials): Promise<User> => {
    dispatch(loginRequest());
    try {
      // Simulazione chiamata API
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      dispatch(loginSuccess(data.user));
      return data.user;
    } catch (error) {
      dispatch(loginFailure((error as Error).message));
      throw error;
    }
  };
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: () => dispatch(logout()),
    updateProfile: (data: Partial<User>) => dispatch(updateProfile(data))
  };
}