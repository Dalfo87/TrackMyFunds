// src/routes/transactions.ts

import express from 'express';
import TransactionController from '../controllers/transactionController';

// Definisci esplicitamente il router
const router = express.Router();

// Route base per le transazioni
router.get('/', TransactionController.getAllTransactions);
router.post('/', TransactionController.addTransaction);

// Route specializzate per tipi di transazione
router.post('/airdrop', TransactionController.recordAirdrop);
router.post('/farming', TransactionController.recordFarming);

// Route per operazioni su singola transazione
router.get('/:id', TransactionController.getTransactionById);
router.put('/:id', TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);

export default router;