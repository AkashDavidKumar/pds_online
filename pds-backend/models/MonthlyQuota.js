import mongoose from 'mongoose';

const monthlyQuotaSchema = new mongoose.Schema(
    {
        rationCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'RationCard', required: true },
        month: { type: Number, required: true }, // 1-12
        year: { type: Number, required: true },
        eligible: { type: Map, of: Number, default: {} }, // productId -> quantity
        taken: { type: Map, of: Number, default: {} },
        balance: { type: Map, of: Number, default: {} },
        status: {
            type: String,
            enum: ['active', 'completed', 'expired'],
            default: 'active',
        },
        isFullyCollected: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Compound index to ensure uniqueness per card per month
monthlyQuotaSchema.index({ rationCardId: 1, month: 1, year: 1 }, { unique: true });

const MonthlyQuota = mongoose.model('MonthlyQuota', monthlyQuotaSchema);
export default MonthlyQuota;
