import Inventory from '../models/Inventory.js';
import InventoryLog from '../models/InventoryLog.js';

// @desc    Get shop inventory
// @route   GET /api/inventory
// @access  Private (Dealer/Admin)
export const getInventory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId) {
      return res.status(400).json({ message: "Shop ID not linked to this user" });
    }

    const inventory = await Inventory.findOne({ shopId });
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found for this shop" });
    }

    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update shop inventory (Stock refill - ADDITIVE)
// @route   PUT /api/inventory
// @access  Private (Dealer/Admin)
export const updateInventory = async (req, res) => {
  try {
    const { riceStock, wheatStock, sugarStock, dalStock, reason = "Bulk Refill" } = req.body;
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({ message: "Shop ID not linked to this user" });
    }

    let inventory = await Inventory.findOne({ shopId });

    if (!inventory) {
      // Create if doesn't exist (initialization)
      inventory = new Inventory({ shopId });
    }

    // ✅ ADDITIVE Update
    if (riceStock !== undefined) inventory.riceStock += Number(riceStock);
    if (wheatStock !== undefined) inventory.wheatStock += Number(wheatStock);
    if (sugarStock !== undefined) inventory.sugarStock += Number(sugarStock);
    if (dalStock !== undefined) inventory.dalStock += Number(dalStock);

    inventory.lastUpdated = Date.now();
    await inventory.save();

    // 📜 Log the IN movement
    await InventoryLog.create({
      shopId,
      type: 'IN',
      items: {
        rice: riceStock || 0,
        wheat: wheatStock || 0,
        sugar: sugarStock || 0,
        dal: dalStock || 0
      },
      createdBy: req.user._id,
      reason
    });


    res.status(200).json({
      success: true,
      data: inventory
    });

  } catch (error) {
    // console.error("❌ Inventory Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory logs for dealer
// @route   GET /api/dealer/inventory-logs
// @access  Private (Dealer)
export const getInventoryLogs = async (req, res) => {
    try {
        const { timeframe } = req.query; // 'today' or 'month'
        const shopId = req.user.shopId;

        let dateQuery = {};
        const start = new Date();
        if (timeframe === 'today') {
            start.setHours(0, 0, 0, 0);
            dateQuery = { createdAt: { $gte: start } };
        } else if (timeframe === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            dateQuery = { createdAt: { $gte: start } };
        }

        const logs = await InventoryLog.find({ 
            shopId, 
            ...dateQuery 
        })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name');

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
