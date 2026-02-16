import Shop from '../models/Shop.js';
import ShopInventory from '../models/ShopInventory.js';
import RationCard from '../models/RationCard.js';

// @desc    Get Shop Metadata & Inventory for the logged-in user's assigned shop
// @route   GET /api/shop/my-stock
// @access  Private (Beneficiary)
const getMyShopStock = async (req, res, next) => {
    try {
        // 1. Get User's Ration Card to find assigned shop
        const rationCard = await RationCard.findById(req.user.rationCardId);

        if (!rationCard) {
            res.status(404);
            throw new Error('Ration Card not linked to user');
        }

        const shopId = rationCard.shopId;

        // 2. Fetch Shop Details
        const shop = await Shop.findById(shopId);
        if (!shop) {
            res.status(404);
            throw new Error('Assigned Shop not found');
        }

        // 3. Fetch Inventory with Product Details
        const inventory = await ShopInventory.find({ shopId }).populate('productId', 'name unit price');

        // 4. Format response
        const formattedInventory = inventory.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            unit: item.productId.unit,
            price: item.productId.price,
            stock: item.stock
        }));

        res.json({
            shop: {
                name: shop.name,
                fpsCode: shop.fpsCode,
                dealerName: shop.dealerName,
                location: shop.location
            },
            inventory: formattedInventory
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get All Shops (Admin/Map View)
// @route   GET /api/shop
// @access  Public
const getAllShops = async (req, res, next) => {
    try {
        const shops = await Shop.find({});
        res.json(shops);
    } catch (error) {
        next(error);
    }
};

export { getMyShopStock, getAllShops };
