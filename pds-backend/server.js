import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import shopRoutes from './routes/shop.routes.js';
import rationCardRoutes from './routes/rationCard.routes.js';
import quotaRoutes from './routes/quota.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import slotRoutes from './routes/slotRoutes.js';
import quotaV2Routes from './routes/quotaRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import dealerRoutes from './routes/dealerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { generateOfficialReceipt } from './controllers/receiptController.js';
import { protect } from './middleware/auth.middleware.js';
import { getFamilyMembers } from './controllers/user.controller.js';

import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5002",
    process.env.CLIENT_URL || "https://pds-frontend.onrender.com"
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/rationcard', rationCardRoutes);
app.use('/api/quota', quotaRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/v2/quota', quotaV2Routes);
app.use('/api/contact', contactRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dealer', dealerRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/family', protect, getFamilyMembers);
app.get('/api/receipt/:slotId', protect, generateOfficialReceipt);

// Error Handling Middleware
app.use(errorHandler);

// Serve Static Assets from Frontend
const frontendPath = path.join(__dirname, '../pds-web-frontend/dist');
app.use(express.static(frontendPath));

// Fallback for SPA Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
