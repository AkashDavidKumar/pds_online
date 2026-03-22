import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      unique: true,
    },
    riceStock: {
      type: Number,
      default: 1000,
    },
    wheatStock: {
      type: Number,
      default: 500,
    },
    sugarStock: {
      type: Number,
      default: 200,
    },
    dalStock: {
      type: Number,
      default: 200,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
