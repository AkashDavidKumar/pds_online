import express from 'express';
import { 
    updateQuotaRules, 
    freezeUser, 
    getSystemAnalytics,
    overrideUserQuota
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.put('/rules', updateQuotaRules);
router.patch('/users/:id/freeze', freezeUser);
router.patch('/users/:id/override', overrideUserQuota);
router.get('/analytics', getSystemAnalytics);

export default router;
