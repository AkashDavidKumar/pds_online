import express from 'express';
import { getRationCardDetails } from '../controllers/rationCard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:cardNumber', protect, getRationCardDetails);

export default router;
