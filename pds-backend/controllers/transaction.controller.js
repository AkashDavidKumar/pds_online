import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import MonthlyQuota from '../models/MonthlyQuota.js';
import ShopInventory from '../models/ShopInventory.js';
import RationCard from '../models/RationCard.js';
import EntitlementRule from '../models/EntitlementRule.js';
import Product from '../models/Product.js';
import PDFDocument from 'pdfkit';

// Helper to auto-create quota (duplicated logic to ensure atomic session usage)
const ensureMonthlyQuota = async (rationCardId, month, year, session) => {
    let quota = await MonthlyQuota.findOne({ rationCardId, month, year }).session(session);

    if (!quota) {
        const rationCard = await RationCard.findById(rationCardId).session(session);
        if (!rationCard) throw new Error('Ration Card not found');

        const rule = await EntitlementRule.findOne({ cardType: rationCard.cardType }).session(session);
        const products = await Product.find({}).session(session);

        const eligibleMap = new Map();
        const takenMap = new Map();
        const balanceMap = new Map();

        // Build Map: ProductID -> Qty
        const productMap = {};
        products.forEach(p => productMap[p.name] = p._id);

        if (rule) {
            // Rice
            let riceQty = 0;
            if (rule.fixedRice > 0) riceQty = rule.fixedRice;
            else riceQty = rule.ricePerPerson * rationCard.familyMembers.length;

            if (productMap['Rice'] && riceQty > 0) {
                eligibleMap.set(productMap['Rice'].toString(), riceQty);
                balanceMap.set(productMap['Rice'].toString(), riceQty);
                takenMap.set(productMap['Rice'].toString(), 0);
            }

            const addFixed = (name, qty) => {
                if (qty > 0 && productMap[name]) {
                    eligibleMap.set(productMap[name].toString(), qty);
                    balanceMap.set(productMap[name].toString(), qty);
                    takenMap.set(productMap[name].toString(), 0);
                }
            };

            addFixed('Sugar', rule.sugar);
            addFixed('Wheat', rule.wheat);
            addFixed('Oil', rule.oil);
        }

        // Upsert to be safe against race conditions
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

        // 3. Process Items
        const transactionItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const { productId, quantity } = item;

            // Check Quota Balance
            const currentBalance = quota.balance.get(productId) || 0;
            if (quantity > currentBalance) {
                throw new Error(`Exceeds balance for product ${productId}`);
            }

            // Check Shop Inventory
            const inventory = await ShopInventory.findOne({ shopId, productId }).session(session);
            if (!inventory || inventory.stock < quantity) {
                throw new Error(`Insufficient shop stock for product ${productId}`);
            }

            // Get Price for Tax/Total
            const product = await Product.findById(productId).session(session);
            const price = product.price * quantity;

            // Updates
            // A. Decrement Shop Stock
            inventory.stock -= quantity;
            await inventory.save({ session });

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
        if (!req.user.rationCardId) {
            res.status(404);
            throw new Error('User not linked to Ration Card');
        }

        const transactions = await Transaction.find({ rationCardId: req.user.rationCardId })
            .sort({ date: -1 })
            .populate('items.productId', 'name unit')
            .populate('shopId', 'name');

        res.json(transactions);
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

export { distributeRations, getUserTransactions, getTransactionReceipt };
