import User from '../models/User.js';
import EntitlementRule from '../models/EntitlementRule.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Update Global Quota Rules
// @route   PUT /api/admin/rules
export const updateQuotaRules = async (req, res) => {
    try {
        const { cardType, rules } = req.body; // rules: { ricePerPerson, fixedRice, sugar, wheat, dal }
        
        const rule = await EntitlementRule.findOneAndUpdate(
            { cardType },
            { $set: rules },
            { upsert: true, new: true }
        );

        res.json({ success: true, rule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Freeze or Unfreeze User
// @route   PATCH /api/admin/users/:id/freeze
export const freezeUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isFrozen = !user.isFrozen;
        await user.save();

        res.json({ success: true, isFrozen: user.isFrozen });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Override User Quota
// @route   PATCH /api/admin/users/:id/override
export const overrideUserQuota = async (req, res) => {
    try {
        const { quota } = req.body; // { rice: 10, ... }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.overrideQuota = quota;
        await user.save();

        await AuditLog.create({
            action: 'TX_OVERRIDE',
            performerId: req.user._id,
            targetId: user._id,
            details: quota
        });

        res.json({ success: true, overrideQuota: user.overrideQuota });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get System Analytics for Admin
// @route   GET /api/admin/analytics
export const getSystemAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'beneficiary' });
        const totalTransactions = await Transaction.countDocuments({ status: 'completed' });
        
        // Count by Card Type
        const cardDistribution = await User.aggregate([
            { $group: { _id: "$cardType", count: { $sum: 1 } } }
        ]);

        res.json({
            users: totalUsers,
            transactions: totalTransactions,
            cardDistribution
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
