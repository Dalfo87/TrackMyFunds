// src/modules/realizedprofit/routes.ts
import { Router } from 'express';
import { RealizedProfitController } from './controllers/realizedprofit.controller';
import { RealizedProfitService } from './services/realizedprofit.service';
import { RealizedProfitRepository } from './repositories/realizedprofit.repository';
import { authMiddleware } from '../../shared/middleware/authMiddleware'; // Assumiamo che esista un middleware di autenticazione

const router = Router();

// Inizializzazione delle dipendenze
const realizedProfitRepository = new RealizedProfitRepository();
const realizedProfitService = new RealizedProfitService(realizedProfitRepository);
const realizedProfitController = new RealizedProfitController(realizedProfitService);

// Applica il middleware di autenticazione a tutte le routes
// Per ora lo commentiamo finché non viene implementato
// router.use(authMiddleware);

// Definizione delle routes
router.get('/', (req, res) => realizedProfitController.getAllRealizedProfits(req, res));
router.get('/total', (req, res) => realizedProfitController.getTotalRealizedProfits(req, res));
router.get('/by-period', (req, res) => realizedProfitController.getRealizedProfitsByPeriod(req, res));
router.get('/performance-stats', (req, res) => realizedProfitController.getPerformanceStats(req, res));
router.get('/by-crypto/:symbol', (req, res) => realizedProfitController.getRealizedProfitsByCrypto(req, res));

export default router;