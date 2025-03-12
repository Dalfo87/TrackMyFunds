// src/shared/middleware/requestLoggerMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export function requestLoggerMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  const start = Date.now();
  const { method, url, ip } = req;
  
  Logger.info(`Ricevuta richiesta: ${method} ${url} da ${ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    Logger.info(
      `Richiesta completata: ${method} ${url} ${statusCode} in ${duration}ms`
    );
  });
  
  next();
}