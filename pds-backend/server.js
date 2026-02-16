import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import shopRoutes from './routes/shop.routes.js';
import rationCardRoutes from './routes/rationCard.routes.js';
import quotaRoutes from './routes/quota.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import complaintRoutes from './routes/complaint.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/rationcard', rationCardRoutes);
app.use('/api/quota', quotaRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/complaints', complaintRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('PDS Backend is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
