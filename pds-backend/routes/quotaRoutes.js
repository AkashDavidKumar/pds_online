import express from 'express';
import { getQuota } from '../controllers/quotaController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getQuota);

export default router;
