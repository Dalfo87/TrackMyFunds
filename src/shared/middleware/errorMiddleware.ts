// src/shared/middleware/errorMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';

export function errorMiddleware(
  err: Error | ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = err.message || 'Errore interno del server';
  
  Logger.error(`[${req.method}] ${req.path} - Errore: ${message}`, err);
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}