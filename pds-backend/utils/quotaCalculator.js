import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import EntitlementRule from '../models/EntitlementRule.js';
import User from '../models/User.js';

/**
 * Calculates the total monthly entitlement for a beneficiary
 * Only counts 'active' members for the current month.
 * Pulls rules dynamically from the database.
 */
export const calculateTotalQuota = async (user) => {
  // Production Rule: Only count active members (added in previous cycles)
  const activeFamily = (user.familyMembers || []).filter(m => m.status === 'active');
  const familySize = 1 + activeFamily.length; // ✅ FIX: Properly include head (1) + active members
  const effectiveFamilySize = Math.max(familySize, 1);

  const rule = await EntitlementRule.findOne({ cardType: user.cardType });

  let quota = {
    rice: 0,
    wheat: 0,
    sugar: 0,
    dal: 0
  };

  if (rule) {
    quota.rice = rule.fixedRice > 0 ? rule.fixedRice : (rule.ricePerPerson || 0) * effectiveFamilySize;
    quota.wheat = rule.wheat || 0;
    quota.sugar = rule.sugar || 0;
    quota.dal = rule.dal || 0; 
  } else {
    // Legacy/Fallback Logic
    if (user.cardType === "PHH") {
        quota.rice = effectiveFamilySize * 5; 
        quota.wheat = 5;
        quota.sugar = 1;
        quota.dal = 1;
    } else if (user.cardType === "AAY") {
        quota.rice = 35;
        quota.sugar = 1;
        quota.dal = 1;
    } else if (user.cardType === "NPHH") {
        quota.wheat = 5;
        quota.sugar = 1;
        quota.dal = 1;
    }
  }

  return quota;
};

/**
 * Handles monthly reset and promotes 'pending' family members to 'active'
 */
export const resetUserQuotaIfNeeded = async (user) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  if (user.lastResetMonth !== currentMonthStr) {
    // 1. Promote pending members to active
    let hasChanges = false;
    user.familyMembers?.forEach(m => {
      if (m.status === 'pending') {
        m.status = 'active';
        hasChanges = true;
      }
    });

    // 2. Clear used quantities (handled by Transaction filter, but we track here too)
    user.lastResetMonth = currentMonthStr;
    
    if (hasChanges || user.isModified('lastResetMonth')) {
       await user.save();
    }
  }
};

/**
 * Calculates current month's consumption for a user
 */
export const calculateUsedQuota = async (userId) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const transactions = await Transaction.find({ 
    userId,
    createdAt: { $gte: startOfMonth }
  }).populate('items.productId');

  let used = { rice: 0, wheat: 0, sugar: 0, dal: 0 };

  transactions.forEach(t => {
    (t.items || []).forEach(item => {
      const pName = item.productId?.name?.toLowerCase() || '';
      if (pName.includes('rice')) used.rice += item.quantity || 0;
      if (pName.includes('wheat')) used.wheat += item.quantity || 0;
      if (pName.includes('sugar')) used.sugar += item.quantity || 0;
      if (pName.includes('dal')) used.dal += item.quantity || 0;
    });
  });

  return used;
};
