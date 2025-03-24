// src/hooks/useUser.js
import { useAppContext } from '../context/AppContext';
import { selectUser, selectIsAuthenticated, selectUserLoading } from '../context/selectors';
import { loginRequest, loginSuccess, loginFailure, logout, updateProfile } from '../context/actions';

export function useUser() {
  const { state, dispatch } = useAppContext();
  
  const user = selectUser(state);
  const isAuthenticated = selectIsAuthenticated(state);
  const isLoading = selectUserLoading(state);
  
  // Funzioni asincrone che utilizzano dispatch
  const login = async (credentials) => {
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
      dispatch(loginFailure(error.message));
      throw error;
    }
  };
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: () => dispatch(logout()),
    updateProfile: (data) => dispatch(updateProfile(data))
  };
}