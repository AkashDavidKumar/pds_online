import express from 'express';
import { fileComplaint, getMyComplaints } from '../controllers/complaint.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
    .post(protect, fileComplaint)
    .get(protect, getMyComplaints);

export default router;
