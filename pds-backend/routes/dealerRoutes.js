import express from 'express';
import { 
    getTodaySlots, 
    verifySlot, 
    distributeRation, 
    getDealerDashboard,
    sendOTP,
    verifyOTP,
    getSlotDetails,
    getDealerUsers,
    getTodayUsers
} from '../controllers/dealerController.js';
import { protect, dealer } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(dealer);

router.get('/dashboard', getDealerDashboard);
router.get('/slots/today', getTodaySlots);
router.get('/queue/today', getTodayUsers);
router.get('/users', getDealerUsers);
router.get('/slot/:slotId', getSlotDetails);
router.post('/verify-slot', verifySlot);
router.post('/distribute', distributeRation);

// Verification APIs
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

export default router;
