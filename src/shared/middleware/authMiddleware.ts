// src/shared/middleware/authMiddleware.ts
// Questo è uno stub del middleware di autenticazione, che verrà implementato in futuro

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

// Estendi l'interfaccia Request per includere l'utente
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        // Altri campi dell'utente...
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Per ora, assegna un utente default a tutte le richieste
  // In futuro, questa logica sarà sostituita da una vera autenticazione
  req.user = { id: 'default_user' };
  
  Logger.info(`Utente autenticato: ${req.user.id}`);
  next();
}