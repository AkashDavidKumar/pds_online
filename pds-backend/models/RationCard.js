import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    relation: { type: String, required: true }, // e.g., Head, Spouse, Child
    aadhaarNumber: { type: String, unique: true, sparse: true },
});

const rationCardSchema = new mongoose.Schema(
    {
        cardNumber: { type: String, required: true, unique: true },
        cardType: {
            type: String,
            required: true,
            enum: ['PHH', 'AAY', 'NPHH', 'NPHH-S'],
        },
        headOfFamily: { type: String, required: true },
        headAadhaarNumber: { type: String, required: true },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
        familyMembers: [familyMemberSchema],
    },
    { timestamps: true }
);

const RationCard = mongoose.model('RationCard', rationCardSchema);
export default RationCard;
