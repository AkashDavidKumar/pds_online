import express from 'express';
import { bookSlot, getMySlots, getMySlot, getSlotReceipt } from '../controllers/slotController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/book', protect, bookSlot);
router.get('/me', protect, getMySlots);
router.get('/my-slot', protect, getMySlot);
router.get('/:id/receipt', protect, getSlotReceipt);

export default router;
