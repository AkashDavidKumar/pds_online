import Slot from '../models/Slot.js';
import User from '../models/User.js';
import OTPModel from '../models/OTP.js';
import Inventory from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';
import RationCard from '../models/RationCard.js';
import Product from '../models/Product.js';
import InventoryLog from '../models/InventoryLog.js';
import Shop from '../models/Shop.js';
import { calculateUsedQuota, calculateTotalQuota } from '../utils/quotaCalculator.js';
import { generateOTP, hashOTP, verifyOTPHash, sendOTPEmail, maskEmail, sendReceiptEmail } from '../utils/otpUtils.js';
import mongoose from 'mongoose';

// @desc    Get today's slots (User list for Verify page)
// @route   GET /api/dealer/slots/today
export const getTodaySlots = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const slots = await Slot.find({
      shopId: req.user.shopId,
      date: { $gte: today, $lt: tomorrow }
    })
    .populate('userId', 'name rationCardNumber mobileNumber email cardType')
    .sort({ createdAt: 1 });

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP to user email (DB-backed + Nodemailer)
// @route   POST /api/dealer/send-otp
export const sendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const email = user.email;
    if (!email) {
      return res.status(400).json({
        message: 'No email address registered for this beneficiary. Please ask them to update their profile.',
      });
    }

    // 1. Delete any existing OTP for this user (prevent reuse)
    await OTPModel.deleteMany({ userId });

    // 2. Generate and hash the OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // 3. Save to DB (TTL index handles expiry after 5 minutes)
    await OTPModel.create({ userId, email, otpHash });

    // 4. Send via Nodemailer (falls back to console.log if SMTP not configured)
    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      maskedEmail: maskEmail(email),
      message: `OTP dispatched to ${maskEmail(email)}`,
    });
  } catch (error) {
    // console.error('❌ sendOTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

// @desc    Verify OTP (DB-backed, max 3 attempts)
// @route   POST /api/dealer/verify-otp  
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // 1. Find the active OTP record
    const record = await OTPModel.findOne({ userId });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired or was never sent. Please request a new one.',
        code: 'OTP_EXPIRED',
      });
    }

    // 2. Check max attempt limit
    const MAX_ATTEMPTS = 3;
    if (record.attempts >= MAX_ATTEMPTS) {
      await OTPModel.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. OTP invalidated. Please request a new one.',
        code: 'MAX_ATTEMPTS_REACHED',
      });
    }

    // 3. Verify the hash
    const isMatch = await verifyOTPHash(otp, record.otpHash);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      const remaining = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        code: 'INVALID_OTP',
        attemptsRemaining: remaining,
      });
    }

    // 4. Success! Delete OTP record to prevent reuse
    await OTPModel.deleteOne({ _id: record._id });

    res.json({
      success: true,
      message: 'Identity verified. Distribution authorized.',
      code: 'OTP_VERIFIED',
    });
  } catch (error) {
    // console.error('❌ verifyOTP error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Distribute ration (Complete Logic)
// @route   POST /api/dealer/distribute
export const distributeRation = async (req, res) => {
  try {
    const { slotId, items, authMethod = 'biometric' } = req.body; 

    // 1. Validations
    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ message: 'Slot invalid' });
    if (slot.status === 'completed') return res.status(400).json({ message: 'Ration already distributed for this allotment' });

    const inventory = await Inventory.findOne({ shopId: req.user.shopId });
    if (!inventory) return res.status(404).json({ message: 'Inventory link missing for this shop' });

    const user = await User.findById(slot.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isFrozen) return res.status(403).json({ message: 'Account Frozen: Distribution Suspended' });
 
    const now = new Date();
    
    // 2. Dynamic Quota Calculation (Real-time Audit)
    const used = await calculateUsedQuota(user._id);

    // 2. Resource Processing
    const transactionItems = [];
    const itemEntries = Object.entries(items);
    const allProducts = await Product.find({});

    for (const [name, qtyRequested] of itemEntries) {
      if (qtyRequested <= 0) continue;

      const prod = allProducts.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
      if (!prod) throw new Error(`Product ${name} unrecognized`);

      const totalQuota = await calculateTotalQuota(user);
      let remaining = 0;
      if (name.toLowerCase().includes('rice')) remaining = totalQuota.rice - used.rice;
      else if (name.toLowerCase().includes('wheat')) remaining = totalQuota.wheat - used.wheat;
      else if (name.toLowerCase().includes('sugar')) remaining = totalQuota.sugar - used.sugar;
      else if (name.toLowerCase().includes('dal')) remaining = totalQuota.dal - used.dal;

      if (qtyRequested > remaining) {
        throw new Error(`${name} exceeds remaining quota (${remaining}kg)`);
      }

      const stockField = `${name.toLowerCase()}Stock`;
      if (inventory[stockField] < qtyRequested) {
        throw new Error(`Insufficient ${name} in shop stocks`);
      }

      // DEDUCTIONS (Inventory only, Quota is dynamically computed next time)
      inventory[stockField] -= qtyRequested;

      transactionItems.push({
        productId: prod._id,
        quantity: qtyRequested,
        price: prod.price * qtyRequested
      });
    }

    if (transactionItems.length === 0) throw new Error('No commodities selected');

    // 3. PERSISTENCE
    await inventory.save();
    
    slot.status = 'completed';
    slot.completedAt = new Date();
    await slot.save();


    // Create Transaction Record (Single Source of Truth Ledger Entry)
    await Transaction.create({
        transactionNumber: 'PDS' + Date.now().toString().slice(-8),
        rationCardId: user.rationCardId,
        userId: user._id,
        shopId: req.user.shopId,
        slotId: slot._id,
        dealerId: req.user._id,
        items: transactionItems,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        authMethod,
        status: 'completed'
    });

    await InventoryLog.create({
      shopId: req.user.shopId,
      type: 'OUT',
      items: {
        rice: items.rice || 0,
        wheat: items.wheat || 0,
        sugar: items.sugar || 0,
        dal: items.dal || 0
      },
      createdBy: req.user._id,
      reason: `Distribution to RC: ${user.rationCardNumber}`
    });

    // 📧 Send distribution receipt email (non-blocking — errors are only logged)
    if (user.email) {
      try {
        const usedAfter = await calculateUsedQuota(user._id);
        const totalQ = await calculateTotalQuota(user);
        const shop = await Shop.findById(req.user.shopId).select('name fpsCode');
        const txNumber = 'PDS' + Date.now().toString().slice(-8);

        await sendReceiptEmail(user.email, {
          user: {
            name: user.name,
            rationCardNumber: user.rationCardNumber,
            cardType: user.cardType,
          },
          shop,
          items: {
            rice: items.rice || 0,
            wheat: items.wheat || 0,
            sugar: items.sugar || 0,
            dal: items.dal || 0,
          },
          remaining: {
            rice: Math.max(0, totalQ.rice - usedAfter.rice),
            wheat: Math.max(0, totalQ.wheat - usedAfter.wheat),
            sugar: Math.max(0, totalQ.sugar - usedAfter.sugar),
            dal: Math.max(0, totalQ.dal - usedAfter.dal),
          },
          transactionNumber: txNumber,
          date: now,
        });
      } catch (emailErr) {
        // console.error('⚠️  Receipt email failed (non-critical):', emailErr.message);
      }
    } else {
      // console.warn(`⚠️  No email on record for ${user.name} — receipt not sent.`);
    }

    res.json({ success: true, message: 'Distribution finalized and reported to TNPDS server', receiptSent: !!user.email });

  } catch (error) {
    // console.error("❌ Distribution Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Users linked to Shop
export const getDealerUsers = async (req, res) => {
    try {
        const users = await User.find({ shopId: req.user.shopId, role: 'beneficiary' })
            .populate('rationCardId', 'cardType');
        
        // Enrich with completion status
        const enrichedUsers = await Promise.all(users.map(async (u) => {
            const total = await calculateTotalQuota(u);
            const used = await calculateUsedQuota(u._id);
            
            const isCompleted = (total.rice - used.rice <= 0) && 
                               (total.wheat - used.wheat <= 0) &&
                               (total.sugar - used.sugar <= 0) &&
                               (total.dal - used.dal <= 0);
            
            return {
                ...u.toObject(),
                isCompleted,
                remaining: {
                    rice: Math.max(0, total.rice - used.rice),
                    wheat: Math.max(0, total.wheat - used.wheat),
                    sugar: Math.max(0, total.sugar - used.sugar),
                    dal: Math.max(0, total.dal - used.dal)
                }
            };
        }));

        res.json(enrichedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Today's Live Queue (FIFO + Completed last)
export const getTodayUsers = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);

        const slots = await Slot.find({
            shopId: req.user.shopId,
            date: { $gte: today, $lt: nextDay }
        }).populate('userId');

        // SMART SORT: Booked first (FIFO), Completed last
        slots.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            // Both same status -> FIFO by date (original order)
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Dashboard Stats
export const getDealerDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalToday = await Slot.countDocuments({
      shopId: req.user.shopId,
      date: { $gte: today, $lt: tomorrow }
    });

    const completedToday = await Slot.countDocuments({
      shopId: req.user.shopId,
      date: { $gte: today, $lt: tomorrow },
      status: 'completed'
    });

    const inventory = await Inventory.findOne({ shopId: req.user.shopId });

    // Today distributed volume
    const todayLogs = await InventoryLog.find({
        shopId: req.user.shopId,
        type: 'OUT',
        createdAt: { $gte: today }
    });

    const totalKgToday = todayLogs.reduce((acc, log) => {
        acc += (log.items.rice || 0) + (log.items.wheat || 0) + (log.items.sugar || 0) + (log.items.dal || 0);
        return acc;
    }, 0);

    const lowStockThreshold = 50; // kg
    const lowStockAlerts = [];
    if (inventory.riceStock < lowStockThreshold) lowStockAlerts.push('Rice');
    if (inventory.wheatStock < lowStockThreshold) lowStockAlerts.push('Wheat');
    if (inventory.sugarStock < lowStockThreshold) lowStockAlerts.push('Sugar');
    if (inventory.dalStock < lowStockThreshold) lowStockAlerts.push('Dal');

    res.json({
      todayStats: {
        total: totalToday,
        completed: completedToday,
        pending: totalToday - completedToday,
        totalKg: totalKgToday
      },
      lowStockAlerts,
      inventory: {
        rice: inventory.riceStock,
        wheat: inventory.wheatStock,
        sugar: inventory.sugarStock,
        dal: inventory.dalStock
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... (verifySlot, etc. inherited) ...
export const verifySlot = async (req, res) => {
    try {
      const { slotId } = req.body;
      const slot = await Slot.findById(slotId).populate('userId');
      
      if (!slot) return res.status(404).json({ message: 'Slot not found' });
  
      const user = slot.userId;
      const rationCard = await RationCard.findById(user.rationCardId);
      
      const totalQuota = await calculateTotalQuota(user);
      const used = await calculateUsedQuota(user._id); // ✅ Fixed: was missing, caused ReferenceError
  
      res.json({
        user: {
          id: user._id,
          name: user.name || 'Resident',
          rationCardNumber: user.rationCardNumber,
          cardType: user.cardType,
          mobileNumber: user.mobileNumber
        },
        familyMembers: rationCard ? rationCard.familyMembers : [],
        quota: {
          eligible: {
            Rice: totalQuota.rice,
            Wheat: totalQuota.wheat,
            Sugar: totalQuota.sugar,
            urad_dal: totalQuota.dal
          },
          balance: {
            Rice: Math.max(0, totalQuota.rice - used.rice),
            Wheat: Math.max(0, totalQuota.wheat - used.wheat),
            Sugar: Math.max(0, totalQuota.sugar - used.sugar),
            urad_dal: Math.max(0, totalQuota.dal - used.dal)
          }
        },
        slotStatus: slot.status
      });
    } catch (error) {
      // console.error('❌ verifySlot error:', error);
      res.status(500).json({ message: error.message });
    }
};

export const getSlotDetails = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await Slot.findById(slotId)
      .populate("userId")
      .populate("shopId");

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        user: slot.userId,
        slot,
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
