import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  items: {
    rice: { type: Number, default: 0 },
    wheat: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    dal: { type: Number, default: 0 }
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: 'Manual Update'
  }
}, { timestamps: true });

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
export default InventoryLog;
