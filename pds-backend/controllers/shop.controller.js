import Shop from '../models/Shop.js';

// @desc    Create a new shop
// @route   POST /api/shops
// @access  Private/Admin
export const createShop = async (req, res) => {
  try {
    const { name, location, dealerId, fpsCode } = req.body;
    
    const shop = await Shop.create({
      name,
      location,
      dealerId,
      fpsCode
    });
    
    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get shop details by ID
// @route   GET /api/shops/:id
// @access  Private
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('dealerId', 'name mobileNumber');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a dealer to a shop
// @route   PUT /api/shops/:id/assign
// @access  Private/Admin
export const assignDealerToShop = async (req, res) => {
  try {
    const { dealerId } = req.body;
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { dealerId },
      { new: true }
    );
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
