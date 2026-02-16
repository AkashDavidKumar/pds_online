import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { rationCardNumber, headOfFamily, mobileNumber, password } = req.body;

        const userExists = await User.findOne({ rationCardNumber });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            rationCardNumber,
            headOfFamily,
            mobileNumber,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                rationCardNumber: user.rationCardNumber,
                headOfFamily: user.headOfFamily,
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

        const user = await User.findOne({ rationCardNumber });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                rationCardNumber: user.rationCardNumber,
                headOfFamily: user.headOfFamily,
                mobileNumber: user.mobileNumber,
                token: generateToken(user._id),
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
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                rationCardNumber: user.rationCardNumber,
                headOfFamily: user.headOfFamily,
                mobileNumber: user.mobileNumber,
                fingerprintEnabled: user.fingerprintEnabled,
                familyMembers: user.familyMembers,
                monthlyQuota: user.monthlyQuota,
                transactionHistory: user.transactionHistory,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Enable fingerprint
// @route   PUT /api/users/fingerprint
// @access  Private
const enableFingerprint = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fingerprintEnabled = true;
            const updatedUser = await user.save();
            res.json({
                fingerprintEnabled: updatedUser.fingerprintEnabled,
                message: 'Fingerprint enabled successfully',
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update Monthly Quota
// @route   PUT /api/users/quota
// @access  Private
const updateMonthlyQuota = async (req, res, next) => {
    try {
        const { rice, wheat, sugar } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            user.monthlyQuota = {
                rice: rice !== undefined ? rice : user.monthlyQuota.rice,
                wheat: wheat !== undefined ? wheat : user.monthlyQuota.wheat,
                sugar: sugar !== undefined ? sugar : user.monthlyQuota.sugar,
            };

            const updatedUser = await user.save();
            res.json(updatedUser.monthlyQuota);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Add Family Member
// @route   POST /api/users/family
// @access  Private
const addFamilyMember = async (req, res, next) => {
    try {
        const { name, age, relation } = req.body;
        const user = await User.findById(req.user._id);

        if (user) {
            const newMember = { name, age, relation };
            user.familyMembers.push(newMember);
            const updatedUser = await user.save();
            res.json(updatedUser.familyMembers);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get Transaction History
// @route   GET /api/users/transactions
// @access  Private
const getTransactionHistory = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json(user.transactionHistory);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

export {
    registerUser,
    loginUser,
    getUserProfile,
    enableFingerprint,
    updateMonthlyQuota,
    addFamilyMember,
    getTransactionHistory,
};
