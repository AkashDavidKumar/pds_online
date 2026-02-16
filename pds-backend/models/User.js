import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        rationCardNumber: {
            type: String,
            required: true,
            unique: true,
        },
        mobileNumber: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['beneficiary', 'dealer', 'admin'],
            default: 'beneficiary',
        },
        biometricEnabled: {
            type: Boolean,
            default: false,
        },
        biometricRegisteredAt: {
            type: Date,
        },
        rationCardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RationCard',
        },
        address: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to match entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
