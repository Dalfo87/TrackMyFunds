// src/modules/portfolio/routes.ts
import { Router } from 'express';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioService } from './services/portfolio.service';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { authMiddleware } from '../../shared/middleware/authMiddleware'; // Assumiamo che esista un middleware di autenticazione

const router = Router();

// Inizializzazione delle dipendenze
const portfolioRepository = new PortfolioRepository();
const portfolioService = new PortfolioService(portfolioRepository);
const portfolioController = new PortfolioController(portfolioService);

// Applica il middleware di autenticazione a tutte le routes
// Per ora lo commentiamo finché non viene implementato
// router.use(authMiddleware);

// Rotte per operazioni di base
router.get('/', (req, res) => portfolioController.getPortfolio(req, res));
router.get('/value', (req, res) => portfolioController.getPortfolioValue(req, res));
router.get('/by-category', (req, res) => portfolioController.getPortfolioByCategory(req, res));
router.get('/historical', (req, res) => portfolioController.getHistoricalPerformance(req, res));
router.get('/distribution', (req, res) => portfolioController.getAssetDistributionByType(req, res));
router.get('/stats', (req, res) => portfolioController.getPortfolioStats(req, res));

// Rotte per operazioni sugli asset
router.put('/asset/:cryptoSymbol/category', (req, res) => portfolioController.updateAssetCategory(req, res));

export default router;