// src/shared/utils/errorHandler.ts

export class ApiError extends Error {
    statusCode: number;
    
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class ErrorHandler {
    /**
     * Crea una risposta di errore standard
     */
    static createError(statusCode: number, message: string): ApiError {
      return new ApiError(statusCode, message);
    }
    
    /**
     * Estrae un messaggio di errore user-friendly da vari tipi di errori
     */
    static getErrorMessage(error: unknown): string {
      if (error instanceof ApiError) {
        return error.message;
      }
      
      if (error instanceof Error) {
        return error.message;
      }
      
      if (typeof error === 'string') {
        return error;
      }
      
      return 'Si è verificato un errore sconosciuto';
    }
    
    /**
     * Middleware Express per la gestione centralizzata degli errori
     */
    static middleware(err: any, req: any, res: any, next: any): void {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Errore interno del server';
      
      res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'production' ? undefined : err.stack
      });
    }
  }
  
  // Per compatibilità con il codice esistente
  export const errorResponse = (statusCode: number, message: string): ApiError => {
    return ErrorHandler.createError(statusCode, message);
  };