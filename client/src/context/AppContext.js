// src/context/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';
import rootReducer, { initialState } from './reducers';

// Creazione del Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(rootReducer, initialState);

  // Memoizziamo il valore del context per evitare render non necessari
  const contextValue = React.useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook personalizzato per usare il context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve essere usato all\'interno di un AppProvider');
  }
  return context;
};