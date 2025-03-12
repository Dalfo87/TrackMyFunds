// src/shared/utils/index.ts

// Esporta tutte le utility
export * from './logger';
export * from './errorHandler';
export * from './formatters';
export * from './apiResponse';

// Riexport per retrocompatibilità
import logger from './logger';
export default logger;