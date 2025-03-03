// src/routes/analytics.ts

import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';

// Definisci esplicitamente il router
const router = express.Router();

// Definisci un tipo personalizzato per i gestori delle richieste
type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next?: express.NextFunction
) => Promise<any> | any;

// Route per le analitiche
router.get('/portfolio/performance', AnalyticsController.getPortfolioPerformance);
router.get('/portfolio/realized-profit-loss', AnalyticsController.getRealizedProfitLoss);
router.get('/portfolio/stats', AnalyticsController.getPortfolioStats);
router.get('/portfolio/historical', AnalyticsController.getHistoricalPerformance);

export default router;