// src/modules/transactions/routes.ts
import { Router } from 'express';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { authMiddleware } from '../../shared/middleware/authMiddleware'; // Assumiamo che esista un middleware di autenticazione

const router = Router();

// Inizializzazione delle dipendenze
const transactionRepository = new TransactionRepository();
const transactionService = new TransactionService(transactionRepository);
const transactionController = new TransactionController(transactionService);

// Applica il middleware di autenticazione a tutte le routes
// Per ora lo commentiamo finché non viene implementato
// router.use(authMiddleware);

// Rotte per operazioni di base
router.get('/', (req, res) => transactionController.getAllTransactions(req, res));
router.post('/', (req, res) => transactionController.addTransaction(req, res));
router.get('/:id', (req, res) => transactionController.getTransactionById(req, res));
router.put('/:id', (req, res) => transactionController.updateTransaction(req, res));
router.delete('/:id', (req, res) => transactionController.deleteTransaction(req, res));

// Rotte specializzate per tipi di transazione
router.post('/airdrop', (req, res) => transactionController.recordAirdrop(req, res));
router.post('/farming', (req, res) => transactionController.recordFarming(req, res));

// Rotte per operazioni su portafoglio
router.post('/recalculate-portfolio', (req, res) => transactionController.recalculatePortfolio(req, res));

export default router;