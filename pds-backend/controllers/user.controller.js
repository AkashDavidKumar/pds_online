import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import RationCard from '../models/RationCard.js';
import { calculateUsedQuota, calculateTotalQuota, resetUserQuotaIfNeeded } from '../utils/quotaCalculator.js';

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { name, email, mobileNumber, password, rationCardNumber } = req.body;

        const userExists = await User.findOne({ mobileNumber });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            mobileNumber,
            password,
            rationCardNumber,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { rationCardNumber, password } = req.body;

        const user = await User.findOne({ rationCardNumber }).populate('shopId');

        if (user && (await user.matchPassword(password))) {
            await resetUserQuotaIfNeeded(user);
            const used = await calculateUsedQuota(user._id);
            
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                rationCardNumber: user.rationCardNumber,
                mobileNumber: user.mobileNumber,
                role: user.role,
                cardType: user.cardType,
                familyMembers: user.familyMembers || [],
                shopId: user.shopId?._id,
                assignedShop: user.shopId,
                token: generateToken(user._id),
                totals: await calculateTotalQuota(user),
                used
            });
        } else {
            res.status(401);
            throw new Error('Invalid ration card number or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('shopId');

        if (user) {
            // PRODUCTION: Reset if month changed before calculating
            await resetUserQuotaIfNeeded(user);
            const used = await calculateUsedQuota(user._id);

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                rationCardNumber: user.rationCardNumber,
                mobileNumber: user.mobileNumber,
                role: user.role,
                cardType: user.cardType,
                familyMembers: user.familyMembers || [],
                assignedShop: user.shopId,
                totals: await calculateTotalQuota(user),
                used
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
    res.json({ message: 'User logged out' });
};

// GENERATE TOKEN
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// --- ADDITIONAL DEALER/UTILITY FEATURES ---

// @desc    Enable Fingerprint Auth
export const enableFingerprint = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.fingerprintEnabled = true;
        await user.save();
        res.json({ success: true, message: 'Fingerprint biometric enabled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMonthlyQuota = async (req, res) => {
    res.status(501).json({ message: 'Not implemented in SSOT architecture' });
};

// @desc    Add Family Member to Profile
export const addFamilyMember = async (req, res) => {
    try {
        const { name, age, relation } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.familyMembers.push({ name, age, relation });
        await user.save();

        res.json(user.familyMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Family Member from Profile
export const deleteFamilyMember = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.familyMembers = user.familyMembers.filter(
            (m) => m._id.toString() !== req.params.id
        );

        await user.save();
        res.json(user.familyMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Family Member in Profile
export const updateFamilyMember = async (req, res) => {
    try {
        const { memberId, name, age, relation } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const member = user.familyMembers.id(memberId);
        if (!member) return res.status(404).json({ message: 'Member not found' });

        if (name) member.name = name;
        if (age) member.age = age;
        if (relation) member.relation = relation;

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTransactionHistory = async (req, res) => {
    res.status(501).json({ message: 'Use transaction controller' });
};

// @desc    Get Family Members from RationCard
export const getFamilyMembers = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('rationCardId');
        if (user && user.rationCardId) {
            res.json(user.rationCardId.familyMembers || []);
        } else {
            res.json([]);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Add New Beneficiary (Dealer/Admin)
export const addUser = async (req, res) => {
    try {
        const userData = { ...req.body, shopId: req.user.shopId };
        userData.role = 'beneficiary';
        const user = await User.create(userData);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update User Data
export const updateUser = async (req, res) => {
    try {
        const { password, __v, _id, ...updateData } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Logic for "Pending" family members
        if (updateData.familyMembers) {
            const currentIds = new Set((user.familyMembers || []).map(m => m._id?.toString()));
            updateData.familyMembers = updateData.familyMembers.map(m => {
                // If the member is newly added (no _id or not in current list)
                if (!m._id || !currentIds.has(m._id.toString())) {
                    return { ...m, status: 'pending', enrolledAt: new Date() };
                }
                return m;
            });
        }

        Object.assign(user, updateData);
        if (password) user.password = password;

        await user.save();
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    logoutUser 
};
