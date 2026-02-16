import mongoose from 'mongoose';

const shopInventorySchema = new mongoose.Schema(
    {
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        stock: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

// Compound index to ensure one record per product per shop
shopInventorySchema.index({ shopId: 1, productId: 1 }, { unique: true });

const ShopInventory = mongoose.model('ShopInventory', shopInventorySchema);
export default ShopInventory;
