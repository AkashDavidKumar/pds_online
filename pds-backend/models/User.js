import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
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
        email: {
            type: String,
            required: [true, 'Email address is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
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
        cardType: {
            type: String,
            enum: ['PHH', 'AAY', 'NPHH', 'NPHH-NC'],
            default: 'NPHH',
        },
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shop',
        },
        lastResetMonth: { type: String, default: '' },
        isFrozen: { type: Boolean, default: false },
        overrideQuota: {
            type: Map,
            of: Number,
            default: {}
        },
        familyMembers: [
            {
                name: { type: String, required: true },
                age: { type: Number, required: true },
                relation: { 
                    type: String, 
                    required: true,
                    enum: ['Head of Family', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other']
                },
                status: { type: String, enum: ['active', 'pending'], default: 'active' },
                enrolledAt: { type: Date, default: Date.now }
            }
        ],
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
