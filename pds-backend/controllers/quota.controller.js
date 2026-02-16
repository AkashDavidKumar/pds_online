import MonthlyQuota from '../models/MonthlyQuota.js';
import RationCard from '../models/RationCard.js';
import EntitlementRule from '../models/EntitlementRule.js';
import Product from '../models/Product.js';

// Helper: Calculate Entitlement Map for a specific card
const calculateEntitlementMap = async (rationCard) => {
    const rule = await EntitlementRule.findOne({ cardType: rationCard.cardType });
    const products = await Product.find({});

    // Map Product Name -> ID
    const productMap = {};
    products.forEach(p => productMap[p.name] = p._id);

    const entitlement = {};

    if (rule) {
        // Rice
        let riceQty = 0;
        if (rule.fixedRice > 0) riceQty = rule.fixedRice;
        else riceQty = rule.ricePerPerson * rationCard.familyMembers.length;

        if (productMap['Rice'] && riceQty > 0) entitlement[productMap['Rice']] = riceQty;

        // Sugar
        if (rule.sugar > 0 && productMap['Sugar']) entitlement[productMap['Sugar']] = rule.sugar;
        // Wheat
        if (rule.wheat > 0 && productMap['Wheat']) entitlement[productMap['Wheat']] = rule.wheat;
        // Oil
        if (rule.oil > 0 && productMap['Oil']) entitlement[productMap['Oil']] = rule.oil;
    }
    return entitlement;
};

// @desc    Get My Monthly Quota (Auto-creates if missing)
// @route   GET /api/quota/me
// @access  Private
const getMyQuota = async (req, res, next) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        if (!req.user.rationCardId) {
            res.status(404);
            throw new Error('No Ration Card linked');
        }

        // 1. Try to find existing quota
        let quota = await MonthlyQuota.findOne({
            rationCardId: req.user.rationCardId,
            month: currentMonth,
            year: currentYear
        });

        // 2. If missing, create one (Auto-detection logic)
        if (!quota) {
            const rationCard = await RationCard.findById(req.user.rationCardId);
            const eligibleMap = await calculateEntitlementMap(rationCard);

            // Initialize Taken as 0 for all keys in eligible
            const takenMap = {};
            const balanceMap = {};

            for (const [key, val] of Object.entries(eligibleMap)) {
                takenMap[key] = 0;
                balanceMap[key] = val;
            }

            quota = await MonthlyQuota.create({
                rationCardId: req.user.rationCardId,
                month: currentMonth,
                year: currentYear,
                eligible: eligibleMap,
                taken: takenMap,
                balance: balanceMap,
                isFullyCollected: false
            });
        }

        // 3. Format response with Product Names
        const products = await Product.find({});
        const productNameMap = {};
        products.forEach(p => productNameMap[p._id.toString()] = { name: p.name, unit: p.unit });

        const formatMap = (map) => {
            const formatted = [];
            if (map) {
                for (const [key, val] of map.entries()) { // Mongoose Map uses .entries()
                    const meta = productNameMap[key.toString()] || { name: 'Unknown', unit: '' };
                    formatted.push({
                        productId: key,
                        name: meta.name,
                        unit: meta.unit,
                        quantity: val
                    });
                }
            }
            return formatted;
        };

        res.json({
            month: quota.month,
            year: quota.year,
            status: quota.status,
            isFullyCollected: quota.isFullyCollected,
            eligible: formatMap(quota.eligible),
            taken: formatMap(quota.taken),
            balance: formatMap(quota.balance)
        });

    } catch (error) {
        next(error);
    }
};

export { getMyQuota, calculateEntitlementMap };
