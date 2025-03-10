// src/hooks/useErrorHandler.tsx

import { useState, useCallback } from 'react';
import { logError, getErrorMessage } from '../utils';

interface ErrorState {
  hasError: boolean;
  message: string | null;
  details?: any;
}

/**
 * Custom hook per gestire gli errori in modo consistente nell'applicazione
 * @param contextName Nome del contesto per il logging
 */
const useErrorHandler = (contextName: string) => {
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    message: null,
  });

  /**
   * Gestisce un errore in modo standardizzato
   * @param error L'errore da gestire
   * @param operation Nome opzionale dell'operazione che ha causato l'errore
   */
  const handleError = useCallback((err: any, operation?: string) => {
    const operationName = operation ? `${operation}` : '';
    const logContext = `${contextName}${operationName ? `:${operationName}` : ''}`;
    
    // Log l'errore con il contesto fornito
    logError(err, logContext);
    
    // Estrae un messaggio di errore leggibile
    const message = getErrorMessage(err);
    
    // Aggiorna lo stato dell'errore
    setError({
      hasError: true,
      message,
      details: err
    });
    
    return message;
  }, [contextName]);

  /**
   * Pulisce lo stato dell'errore
   */
  const clearError = useCallback(() => {
    setError({
      hasError: false,
      message: null
    });
  }, []);

  /**
   * Wrapper per eseguire una funzione asincrona con gestione degli errori
   * @param fn Funzione asincrona da eseguire
   * @param operation Nome dell'operazione (per il logging)
   * @param onSuccess Callback opzionale da eseguire in caso di successo
   * @returns Il risultato della funzione o undefined in caso di errore
   */
  const withErrorHandling = useCallback(async <T extends any>(
    fn: () => Promise<T>,
    operation?: string,
    onSuccess?: (result: T) => void
  ): Promise<T | undefined> => {
    try {
      clearError();
      const result = await fn();
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      handleError(err, operation);
      return undefined;
    }
  }, [handleError, clearError]);

  return {
    error,
    handleError,
    clearError,
    withErrorHandling
  };
};

export default useErrorHandler;