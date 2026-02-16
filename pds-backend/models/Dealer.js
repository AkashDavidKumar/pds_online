import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const dealerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        mobileNumber: { type: String, required: true, unique: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    },
    { timestamps: true }
);

dealerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

dealerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Dealer = mongoose.model('Dealer', dealerSchema);
export default Dealer;
