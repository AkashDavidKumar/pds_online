import mongoose from 'mongoose';

const entitlementRuleSchema = new mongoose.Schema(
    {
        cardType: {
            type: String,
            required: true,
            enum: ['PHH', 'AAY', 'NPHH', 'NPHH-S'],
            unique: true,
        },
        ricePerPerson: { type: Number, default: 0 },
        fixedRice: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 },
        wheat: { type: Number, default: 0 },
        oil: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const EntitlementRule = mongoose.model('EntitlementRule', entitlementRuleSchema);
export default EntitlementRule;
