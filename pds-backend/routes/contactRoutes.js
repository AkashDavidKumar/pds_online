import express from 'express';
import { 
  sendContactMessage, 
  getAllMessages, 
  updateMessageStatus, 
  deleteMessage,
  getDealerMessages,
  replyToMessage
} from '../controllers/contactController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public/Private route to submit contact form
router.post('/', protect, sendContactMessage); // Now protected to capture IDs

// Dealer Routes
router.get('/dealer', protect, getDealerMessages);
router.post('/reply/:id', protect, replyToMessage);

// Admin/Private routes
router.get('/', protect, getAllMessages);
router.put('/:id', protect, updateMessageStatus);
router.delete('/:id', protect, deleteMessage);

export default router;
