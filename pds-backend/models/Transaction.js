import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        transactionNumber: { type: String, required: true, unique: true },
        rationCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'RationCard', required: true },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
        dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' }, // Can be null if automated/system
        items: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        remainingBalance: { type: Map, of: Number }, // Snapshot of balance after tx
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        authMethod: {
            type: String,
            enum: ['biometric', 'otp', 'qr'],
            required: true,
        },
        status: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success',
        },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
