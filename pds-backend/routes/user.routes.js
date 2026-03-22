import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    enableFingerprint,
    updateMonthlyQuota,
    addFamilyMember,
    updateFamilyMember,
    getTransactionHistory,
    addUser,
    updateUser,
    deleteFamilyMember,
} from '../controllers/user.controller.js';
import { protect, dealer } from '../middleware/auth.middleware.js';

const router = express.Router();

// Role-Based User Management
router.post('/', protect, dealer, addUser);
router.put('/:id', protect, dealer, updateUser);

// Public/Self Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/fingerprint', protect, enableFingerprint);
router.get('/profile', protect, getUserProfile);
router.put('/quota', protect, updateMonthlyQuota);

// Family Management
router.post('/family', protect, addFamilyMember);
router.put('/family', protect, updateFamilyMember);
router.delete('/family/:id', protect, deleteFamilyMember);

router.get('/transactions', protect, getTransactionHistory);

export default router;
