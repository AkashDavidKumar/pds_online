import express from 'express';
import { getMyShopStock, getAllShops } from '../controllers/shop.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/my-stock', protect, getMyShopStock);
router.get('/', getAllShops);

export default router;
