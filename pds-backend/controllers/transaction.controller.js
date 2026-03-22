import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import MonthlyQuota from '../models/MonthlyQuota.js';
import Inventory from '../models/Inventory.js';
import RationCard from '../models/RationCard.js';
import EntitlementRule from '../models/EntitlementRule.js';
import Product from '../models/Product.js';
import User from '../models/User.js'; // Added User import
import PDFDocument from 'pdfkit';

import { calculateTotalQuota, resetUserQuotaIfNeeded } from '../utils/quotaCalculator.js';

// Helper to auto-create quota (TN PDS Enhanced)
const ensureMonthlyQuota = async (rationCardId, month, year, session) => {
    let quota = await MonthlyQuota.findOne({ rationCardId, month, year }).session(session);

    if (!quota) {
        // Find User linked to this Ration Card
        const user = await User.findOne({ rationCardId }).session(session);
        if (!user) throw new Error('User/Beneficiary not found for this card');

        // PRODUCTION: Reset if month changed before calculating
        await resetUserQuotaIfNeeded(user);

        const products = await Product.find({}).session(session);
        const calcQuota = calculateTotalQuota(user);

        const eligibleMap = new Map();
        const takenMap = new Map();
        const balanceMap = new Map();

        // Build Map: ProductID -> Qty
        const productMap = {};
        products.forEach(p => productMap[p.name] = p._id);

        const addCalculated = (name, qty) => {
            if (qty > 0 && productMap[name]) {
                const pId = productMap[name].toString();
                eligibleMap.set(pId, qty);
                balanceMap.set(pId, qty);
                takenMap.set(pId, 0);
            }
        };

        addCalculated('Rice', calcQuota.rice);
        addCalculated('Wheat', calcQuota.wheat);
        addCalculated('Sugar', calcQuota.sugar);
        addCalculated('Dal', calcQuota.dal);
        addCalculated('Oil', 1); // Fixed default for TN PDS if not in calc

        // Upsert to be safe
        // against race conditions
        quota = await MonthlyQuota.findOneAndUpdate(
            { rationCardId, month, year },
            {
                $setOnInsert: {
                    eligible: eligibleMap,
                    taken: takenMap,
                    balance: balanceMap,
                    isFullyCollected: false,
                    status: 'active'
                }
            },
            { upsert: true, new: true, session }
        );
    }
    return quota;
};

// @desc    Distribute Rations (Dealer/Admin)
// @route   POST /api/transactions/distribute
// @access  Private (Dealer/Admin)
const distributeRations = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { rationCardNumber, items, authMethod } = req.body; // items: [{ productId, quantity }]

        // 1. Validate Dealer & Shop
        // For simplicity in demo, assume dealer is logged in and linked to a shop
        // Or if admin, they must provide shopId. 
        // Let's assume Dealer login for now.
        const dealer = req.user;
        /*
        if (dealer.role !== 'dealer' && dealer.role !== 'admin') {
             throw new Error('Unauthorized');
        }
        */
        // Find Shop ID - for demo, if user doesn't have shop, fail (or use card's shop)
        const rationCard = await RationCard.findOne({ cardNumber: rationCardNumber }).session(session);
        if (!rationCard) throw new Error('Invalid Ration Card Number');

        const shopId = rationCard.shopId; // Distribute from Assigned Shop

        // 2. Ensure Monthly Quota exists
        const date = new Date();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const quota = await ensureMonthlyQuota(rationCard._id, month, year, session);
        
        // PRODUCTION: Snapshot current entitlements for history
        const userForSnapshot = await User.findOne({ rationCardId: rationCard._id }).session(session);
        const snapshotRaw = calculateTotalQuota(userForSnapshot);
        const entitlementSnapshot = new Map(Object.entries(snapshotRaw));

        // 3. Process Items
        const transactionItems = [];
        let totalAmount = 0;

        // Fetch flattened inventory for the shop
        const inventory = await Inventory.findOne({ shopId }).session(session);
        if (!inventory) throw new Error('Shop inventory not initialized');

        for (const item of items) {
            const { productId, quantity } = item;

            // Check Quota Balance
            const currentBalance = quota.balance.get(productId) || 0;
            if (quantity > currentBalance) {
                throw new Error(`Exceeds balance for product ${productId}`);
            }

            // Get Product Details to know which stock to reduce
            const product = await Product.findById(productId).session(session);
            if (!product) throw new Error(`Product not found: ${productId}`);

            const prodName = product.name.toLowerCase();
            let stockField = '';
            
            if (prodName.includes('rice')) stockField = 'riceStock';
            else if (prodName.includes('wheat')) stockField = 'wheatStock';
            else if (prodName.includes('sugar')) stockField = 'sugarStock';
            else if (prodName.includes('dal') || prodName.includes('urad') || prodName.includes('toor')) stockField = 'dalStock';

            if (stockField && inventory[stockField] < quantity) {
                throw new Error(`Insufficient shop stock for ${product.name}. Available: ${inventory[stockField]}kg`);
            }

            // Price calculation
            const price = product.price * quantity;

            // Updates
            // A. Decrement Shop Stock (Flattened Inventory)
            if (stockField) {
                inventory[stockField] -= quantity;
            }

            // B. Update Quota
            const newTaken = (quota.taken.get(productId) || 0) + quantity;
            const newBalance = currentBalance - quantity;

            quota.taken.set(productId, newTaken);
            quota.balance.set(productId, newBalance);

            transactionItems.push({
                productId,
                quantity,
                price
            });
            totalAmount += price;
        }

        // Save Inventory Updates
        inventory.lastUpdated = Date.now();
        await inventory.save({ session });

        // Check if fully collected
        let allZero = true;
        for (const bal of quota.balance.values()) {
            if (bal > 0) allZero = false;
        }
        quota.isFullyCollected = allZero;
        if (allZero) quota.status = 'completed';

        await quota.save({ session });

        // 4. Create Transaction Record
        const txNumber = 'TX' + Date.now() + Math.floor(Math.random() * 1000);

        const transaction = await Transaction.create([{
            transactionNumber: txNumber,
            rationCardId: rationCard._id,
            shopId,
            dealerId: dealer.role === 'dealer' ? dealer._id : null,
            items: transactionItems,
            remainingBalance: quota.balance,
            entitlementSnapshot: entitlementSnapshot,
            month,
            year,
            authMethod,
            status: 'success'
        }], { session });

        await session.commitTransaction();
        res.status(201).json(transaction[0]);

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// @desc    Get User Transactions
// @route   GET /api/transactions/me
// @access  Private
const getUserTransactions = async (req, res, next) => {
    try {
        const user = req.user;
        let query = {};

        if (user.role === 'dealer' || user.role === 'admin') {
            query = { shopId: user.shopId };
        } else {
            // Beneficiary sees only their transactions by userId (Single Source of Truth)
            query = { userId: user._id };
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .populate('items.productId', 'name unit')
            .populate('shopId', 'name location');

        res.status(200).json(transactions);
    } catch (error) {
        next(error);
    }
};

// @desc    Generate Receipt PDF
// @route   GET /api/transactions/:id/receipt
// @access  Private (User/Dealer)
const getTransactionReceipt = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('rationCardId', 'cardNumber headOfFamily')
            .populate('shopId', 'name dealerName')
            .populate('items.productId', 'name unit price');

        if (!transaction) {
            res.status(404);
            throw new Error('Transaction not found');
        }

        // Generate PDF
        const doc = new PDFDocument();
        let filename = `Receipt-${transaction.transactionNumber}.pdf`;
        filename = encodeURIComponent(filename);

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Content
        doc.fontSize(20).text('PDS Transaction Receipt', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Transaction ID: ${transaction.transactionNumber}`);
        doc.text(`Date: ${new Date(transaction.date).toLocaleString()}`);
        doc.text(`Shop: ${transaction.shopId.name}`);
        doc.text(`Ration Card: ${transaction.rationCardId.cardNumber}`);
        doc.text(`Head of Family: ${transaction.rationCardId.headOfFamily}`);
        doc.moveDown();

        doc.text('------------------------------------------------');
        doc.text('Items Distributed:');
        doc.moveDown();

        let total = 0;
        transaction.items.forEach(item => {
            const lineTotal = item.price; // Stored price is total for line item in our logic above? No, Price in product is per unit.
            // Wait, in distributeRations I stored: price = product.price * quantity. So it is line total.

            doc.text(`${item.productId.name}: ${item.quantity} ${item.productId.unit} - Rs. ${item.price}`);
            total += item.price;
        });

        doc.moveDown();
        doc.text('------------------------------------------------');
        doc.fontSize(14).text(`Total Amount: Rs. ${total}`, { align: 'right' });

        doc.end();

    } catch (error) {
        next(error);
    }
};

// @desc    Get Dealer-Specific History (Last 3 Months)
// @route   GET /api/transactions/dealer
// @access  Private (Dealer)
const getDealerTransactions = async (req, res, next) => {
    try {
        const dealerId = req.user._id;

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const transactions = await Transaction.find({
            dealerId,
            date: { $gte: threeMonthsAgo }
        })
        .sort({ date: -1 })
        .populate('userId', 'name rationCardNumber')
        .populate('shopId', 'name');

        res.status(200).json(transactions);
    } catch (error) {
        next(error);
    }
};

export { distributeRations, getUserTransactions, getDealerTransactions, getTransactionReceipt };
