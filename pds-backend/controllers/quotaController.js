import { calculateUsedQuota, calculateTotalQuota } from '../utils/quotaCalculator.js';

// @desc    Get TN Specific Monthly Quota (Calculated dynamically)
// @route   GET /api/v2/quota
// @access  Private
const getQuota = async (req, res, next) => {
  try {
    const total = await calculateTotalQuota(req.user);
    const used = await calculateUsedQuota(req.user._id);

    const response = {
      rice: total.rice,
      wheat: total.wheat,
      sugar: total.sugar,
      dal: total.dal,
      used,
      remaining: {
        rice: Math.max(0, total.rice - (used.rice || 0)),
        wheat: Math.max(0, total.wheat - (used.wheat || 0)),
        sugar: Math.max(0, total.sugar - (used.sugar || 0)),
        dal: Math.max(0, total.dal - (used.dal || 0))
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export { getQuota };
