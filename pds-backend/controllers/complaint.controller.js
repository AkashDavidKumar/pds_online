import Complaint from '../models/Complaint.js';

// @desc    File a new complaint
// @route   POST /api/complaints
// @access  Private
const fileComplaint = async (req, res, next) => {
    try {
        const { type, description, shopId } = req.body;

        if (!req.user.rationCardId) {
            res.status(400);
            throw new Error('User not linked to ration card');
        }

        const complaint = await Complaint.create({
            rationCardId: req.user.rationCardId,
            shopId: shopId || null, // Optional, can complain about general issues
            type,
            description,
            status: 'pending'
        });

        res.status(201).json(complaint);
    } catch (error) {
        next(error);
    }
};

// @desc    Get My Complaints
// @route   GET /api/complaints
// @access  Private
const getMyComplaints = async (req, res, next) => {
    try {
        if (!req.user.rationCardId) {
            res.status(400);
            throw new Error('User not linked to ration card');
        }

        const complaints = await Complaint.find({ rationCardId: req.user.rationCardId })
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        next(error);
    }
};

export { fileComplaint, getMyComplaints };
