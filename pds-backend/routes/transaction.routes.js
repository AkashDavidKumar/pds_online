import express from 'express';
import { distributeRations, getUserTransactions, getTransactionReceipt, getDealerTransactions } from '../controllers/transaction.controller.js';
import { exportTransactions } from '../controllers/exportController.js';
import { protect, dealer } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/distribute', protect, distributeRations);
router.get('/me', protect, getUserTransactions);
router.get('/dealer', protect, dealer, getDealerTransactions);
router.get('/export', protect, dealer, exportTransactions);
router.get('/:id/receipt', protect, getTransactionReceipt);

export default router;
