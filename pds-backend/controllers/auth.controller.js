import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import RationCard from '../models/RationCard.js';
import Shop from '../models/Shop.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { rationCardNumber, password } = req.body;

        const user = await User.findOne({ rationCardNumber });

        if (user && (await user.matchPassword(password))) {

            // Fetch additional details for the response
            let extraData = {};

            if (user.role === 'beneficiary') {
                const rationCard = await RationCard.findById(user.rationCardId).populate('shopId');
                if (rationCard) {
                    extraData.cardType = rationCard.cardType;
                    extraData.headOfFamily = rationCard.headOfFamily;
                    extraData.assignedShop = rationCard.shopId;
                }
            }

            res.json({
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.role === 'dealer' ? 'Dealer' : (extraData.headOfFamily || 'Resident'),
                    role: user.role,
                    shopId: user.shopId || (extraData.assignedShop ? extraData.assignedShop._id : null),
                    rationCardNumber: user.rationCardNumber,
                    ...extraData
                }
            });
        } else {
            res.status(401);
            throw new Error('Invalid ration card number or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Register a new user (Usually done by admin/system, but kept for demo)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { rationCardNumber, mobileNumber, password, role } = req.body;

        const userExists = await User.findOne({ rationCardNumber });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            rationCardNumber,
            mobileNumber,
            password,
            role: role || 'beneficiary'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                rationCardNumber: user.rationCardNumber,
                mobileNumber: user.mobileNumber,
                role: user.role,
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

export { loginUser, registerUser };
