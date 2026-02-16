import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    enableFingerprint,
    updateMonthlyQuota,
    addFamilyMember,
    getTransactionHistory,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/fingerprint', protect, enableFingerprint);
router.get('/profile', protect, getUserProfile);
router.put('/quota', protect, updateMonthlyQuota);
router.post('/family', protect, addFamilyMember);
router.get('/transactions', protect, getTransactionHistory);

export default router;
