// Classe per la gestione degli errori nell'API
class ApiError extends Error {
    statusCode: number;
    
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // Utility per la creazione di risposte di errore
  const errorResponse = (statusCode: number, message: string): ApiError => {
    return new ApiError(statusCode, message);
  };
  
  export { ApiError, errorResponse };