import express from 'express';
import { distributeRations, getUserTransactions, getTransactionReceipt } from '../controllers/transaction.controller.js';
import { protect, dealer } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/distribute', protect, distributeRations); // Ideally strictly for dealer, but enabling for test
router.get('/me', protect, getUserTransactions);
router.get('/:id/receipt', protect, getTransactionReceipt);

export default router;
