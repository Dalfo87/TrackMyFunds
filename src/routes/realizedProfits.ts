// src/routes/realizedProfits.ts

import express from 'express';
import RealizedProfitController from '../controllers/realizedProfitController';

// Definisci esplicitamente il router
const router = express.Router();

// Route per i profitti realizzati
router.get('/', RealizedProfitController.getAllRealizedProfits);
router.get('/total', RealizedProfitController.getTotalRealizedProfits);
router.get('/by-period', RealizedProfitController.getRealizedProfitsByPeriod);
router.get('/by-crypto/:symbol', RealizedProfitController.getRealizedProfitsByCrypto);

export default router;