import express from 'express';
import { getMyQuota } from '../controllers/quota.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/me', protect, getMyQuota);

export default router;
