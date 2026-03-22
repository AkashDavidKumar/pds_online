import express from 'express';
import { getInventory, updateInventory, getInventoryLogs } from '../controllers/inventoryController.js';
import { protect, dealer } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(dealer);

router.get('/', getInventory);
router.put('/', updateInventory);
router.get('/logs', getInventoryLogs);

export default router;
