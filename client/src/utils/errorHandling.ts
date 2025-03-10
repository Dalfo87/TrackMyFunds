// client/src/utils/errorHandling.ts

/**
 * Funzioni di utility per la gestione degli errori
 */

import { AxiosError } from 'axios';

/**
 * Tipo per un errore API generico
 */
export interface ApiError {
  message: string;
  details?: string;
  errorCode?: string;
  status?: number;
}

/**
 * Estrae un messaggio di errore leggibile da un errore Axios o generico
 * @param error - L'errore da processare
 * @returns Un messaggio di errore user-friendly
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Gestione errori Axios
    if (error.response) {
      // Il server ha risposto con un codice di errore
      const data = error.response.data as any;
      
      if (data.message) {
        return data.message;
      }
      
      // Se non c'è un messaggio specifico, usa uno generico basato sullo status
      switch (error.response.status) {
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
          return `Errore (${error.response.status}): ${error.message}`;
      }
    } else if (error.request) {
      // La richiesta è stata fatta ma non è stata ricevuta alcuna risposta
      return 'Nessuna risposta dal server. Verifica la connessione e riprova.';
    } else {
      // Errore nella configurazione della richiesta
      return `Errore di configurazione: ${error.message}`;
    }
  } else if (error instanceof Error) {
    // Errore JavaScript generico
    return error.message;
  } else if (typeof error === 'string') {
    // Errore come stringa
    return error;
  } else {
    // Fallback generico
    return 'Si è verificato un errore sconosciuto.';
  }
};

/**
 * Processa un errore per trasformarlo in un oggetto ApiError
 * @param error - L'errore da processare
 * @returns Un oggetto ApiError strutturato
 */
export const processApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    if (error.response) {
      const data = error.response.data as any;
      return {
        message: data.message || getErrorMessage(error),
        details: data.error || error.message,
        errorCode: data.errorCode || String(error.response.status),
        status: error.response.status
      };
    }
  }
  
  return {
    message: getErrorMessage(error),
    details: error instanceof Error ? error.message : 'Dettagli non disponibili'
  };
};

/**
 * Log degli errori in modo consistente
 * @param error - L'errore da loggare
 * @param context - Contesto opzionale dell'errore
 */
export const logError = (error: unknown, context?: string): void => {
  const errorMessage = getErrorMessage(error);
  const contextPrefix = context ? `[${context}] ` : '';
  
  console.error(`${contextPrefix}Errore: ${errorMessage}`);
  
  if (error instanceof AxiosError && error.response) {
    console.error('Dettagli risposta:', error.response.data);
  } else if (error instanceof Error) {
    console.error('Stack:', error.stack);
  }
};

/**
 * Hook personalizzato per gestire uniformemente gli stati di errore, loading e dati
 * (Questo sarebbe un hook React, da implementare in un file separato)
 */