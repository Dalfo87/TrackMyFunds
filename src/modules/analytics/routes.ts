// src/modules/analytics/routes.ts
import { Router } from 'express';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { authMiddleware } from '../../shared/middleware/authMiddleware'; // Assumiamo che esista un middleware di autenticazione

const router = Router();

// Inizializzazione delle dipendenze
const analyticsRepository = new AnalyticsRepository();
const analyticsService = new AnalyticsService(analyticsRepository);
const analyticsController = new AnalyticsController(analyticsService);

// Applica il middleware di autenticazione a tutte le routes
// Per ora lo commentiamo finché non viene implementato
// router.use(authMiddleware);

// Rotte per le analitiche
router.get('/portfolio/performance', (req, res) => analyticsController.getPortfolioPerformance(req, res));
router.get('/portfolio/realized-profit-loss', (req, res) => analyticsController.getRealizedProfitLoss(req, res));
router.get('/portfolio/stats', (req, res) => analyticsController.getPortfolioStats(req, res));
router.get('/portfolio/historical', (req, res) => analyticsController.getHistoricalPerformance(req, res));
router.get('/portfolio/investment-by-payment-method', (req, res) => analyticsController.getInvestmentByPaymentMethod(req, res));

export default router;