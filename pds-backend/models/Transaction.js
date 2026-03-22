import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        transactionNumber: { type: String, required: true, unique: true },
        rationCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'RationCard', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
        slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' }, 
        items: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        remainingBalance: { type: Map, of: Number }, // Snapshot of balance after tx
        entitlementSnapshot: { type: Map, of: Number }, // Snapshot of TOTAL quota at tx time
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        authMethod: {
            type: String,
            enum: ['biometric', 'otp', 'qr'],
            required: true,
        },
        status: {
            type: String,
            enum: ['success', 'failed', 'completed'],
            default: 'completed',
        },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
