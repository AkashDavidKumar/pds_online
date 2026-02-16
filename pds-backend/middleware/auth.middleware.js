import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            const err = new Error('Not authorized, token failed');
            next(err);
        }
    }

    if (!token) {
        res.status(401);
        const err = new Error('Not authorized, no token');
        next(err);
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        const err = new Error('Not authorized as an admin');
        next(err);
    }
};

const dealer = (req, res, next) => {
    if (req.user && (req.user.role === 'dealer' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(401);
        const err = new Error('Not authorized as a dealer');
        next(err);
    }
};

export { protect, admin, dealer };
