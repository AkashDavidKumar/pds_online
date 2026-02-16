import RationCard from '../models/RationCard.js';
import EntitlementRule from '../models/EntitlementRule.js';
import MonthlyQuota from '../models/MonthlyQuota.js';
import Product from '../models/Product.js';

// @desc    Get Ration Card Details & Entitlement Logic
// @route   GET /api/rationcard/:cardNumber (or /me)
// @access  Private
const getRationCardDetails = async (req, res, next) => {
    try {
        let cardQuery;

        // If 'me', use query from user token (already in req.user from protect middleware)
        if (req.params.cardNumber === 'me') {
            if (!req.user.rationCardId) {
                res.status(404);
                throw new Error('User does not have a linked ration card');
            }
            cardQuery = req.user.rationCardId;
        } else {
            // Admin or Dealer search
            cardQuery = { cardNumber: req.params.cardNumber };
        }

        const rationCard = await RationCard.findOne(cardQuery === req.user.rationCardId ? { _id: cardQuery } : cardQuery)
            .populate('shopId');

        if (!rationCard) {
            res.status(404);
            throw new Error('Ration Card not found');
        }

        // Calculate Entitlement (Live Calculation)
        const rule = await EntitlementRule.findOne({ cardType: rationCard.cardType });
        let calculatedEntitlement = {};

        if (rule) {
            // Rice
            if (rule.fixedRice > 0) {
                calculatedEntitlement['Rice'] = rule.fixedRice;
            } else {
                calculatedEntitlement['Rice'] = rule.ricePerPerson * rationCard.familyMembers.length;
            }
            // Other fixed items
            if (rule.sugar > 0) calculatedEntitlement['Sugar'] = rule.sugar;
            if (rule.wheat > 0) calculatedEntitlement['Wheat'] = rule.wheat;
            if (rule.oil > 0) calculatedEntitlement['Oil'] = rule.oil;
        }

        res.json({
            rationCard,
            entitlementRules: calculatedEntitlement
        });

    } catch (error) {
        next(error);
    }
};

export { getRationCardDetails };
