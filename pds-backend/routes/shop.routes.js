import express from 'express';
import { 
  createShop, 
  getShopById, 
  assignDealerToShop 
} from '../controllers/shop.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createShop);
router.get('/:id', protect, getShopById);
router.put('/:id/assign', protect, assignDealerToShop);

export default router;
