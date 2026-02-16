import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
    {
        rationCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'RationCard', required: true },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
        type: { type: String, required: true }, // e.g., 'Quality Issue', 'Dealer Behavior'
        description: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'resolved', 'rejected'],
            default: 'pending',
        },
        adminResponse: { type: String },
    },
    { timestamps: true }
);

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
