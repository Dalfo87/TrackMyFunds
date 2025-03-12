// src/shared/utils/logger.ts

import fs from 'fs';
import path from 'path';

// Crea la directory dei log se non esiste
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// File di log per diversi livelli
const logFile = path.join(logDir, 'app.log');
const errorFile = path.join(logDir, 'error.log');

// Funzione per scrivere nel file di log
function writeToFile(filePath: string, message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(filePath, logMessage);
}

export class Logger {
  static info(message: string): void {
    console.log(message);
    writeToFile(logFile, `INFO: ${message}`);
  }
  
  static error(message: string, error?: any): void {
    console.error(message);
    let errorDetails = '';
    
    if (error) {
      console.error(error);
      errorDetails = error instanceof Error 
        ? `\nError: ${error.message}\nStack: ${error.stack}` 
        : `\nError: ${JSON.stringify(error)}`;
      
      // Dettagli aggiuntivi per errori Axios
      if (error.response) {
        errorDetails += `\nResponse Status: ${error.response.status}`;
        errorDetails += `\nResponse Data: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorDetails += `\nRequest made but no response received`;
      }
    }
    
    writeToFile(errorFile, `ERROR: ${message}${errorDetails}`);
  }
  
  static debug(message: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(message);
      writeToFile(logFile, `DEBUG: ${message}`);
    }
  }
  
  static warn(message: string): void {
    console.warn(message);
    writeToFile(logFile, `WARN: ${message}`);
  }
}

// Export singleton per compatibilità con il vecchio codice
export default {
  info: Logger.info,
  error: Logger.error,
  debug: Logger.debug,
  warn: Logger.warn
};