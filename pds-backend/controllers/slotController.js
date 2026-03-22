import Slot from '../models/Slot.js';
import PDFDocument from 'pdfkit';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Book a visit slot
// @route   POST /api/slots/book
// @access  Private
const bookSlot = async (req, res, next) => {
  try {
    const { date, timeSlot } = req.body;

    const slot = await Slot.create({
      userId: req.user._id,
      shopId: req.user.shopId, // Link shop from user profile
      date,
      timeSlot,
    });

    res.status(201).json(slot);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user slots
// @route   GET /api/slots/me
// @access  Private
const getMySlots = async (req, res, next) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === 'dealer' || user.role === 'admin') {
        query = { shopId: user.shopId };
    } else {
        query = { userId: user._id };
    }

    const slots = await Slot.find(query).sort({ date: -1 }).populate('userId', 'name rationCardNumber');
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user latest active slot
// @route   GET /api/slots/my-slot
// @access  Private
const getMySlot = async (req, res, next) => {
  try {
    const user = req.user;
    let query = { status: 'booked' };
    
    if (user.role === 'dealer' || user.role === 'admin') {
        query.shopId = user.shopId;
    } else {
        query.userId = user._id;
    }

    const slot = await Slot.findOne(query).sort({ date: -1 });
    res.json(slot);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Slot Booking Receipt
// @route   GET /api/slots/:id/receipt
// @access  Private
const getSlotReceipt = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    // Security check: Only allow access to the slot's owner or shop dealer
    if (slot.userId.toString() !== req.user._id.toString() && 
        slot.shopId.toString() !== req.user.shopId?.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to this receipt' });
    }

    // Populate user and ration card details correctly
    const user = await User.findById(req.user._id).populate('rationCardId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const rationCard = user.rationCardId;
    
    // Calculate pending items for receipt (same logic as quotaController)
    const entitlements = {
      'PHH': { rice: 20, wheat: 5, sugar: 1, dal: 1 },
      'AAY': { rice: 35, wheat: 0, sugar: 1, dal: 1 },
      'NPHH': { rice: 0, wheat: 0, sugar: 1, dal: 1 },
      'NPHH-NC': { rice: 0, wheat: 0, sugar: 0, dal: 0 }
    };
    const rules = entitlements[user.cardType] || entitlements['NPHH-NC'];
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const transactions = await Transaction.find({
      rationCardId: user.rationCardId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: 'success'
    }).populate('items.productId');

    const used = { rice: 0, wheat: 0, sugar: 0, dal: 0 };
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        const name = item.productId?.name?.toLowerCase();
        if (name?.includes('rice')) used.rice += item.quantity;
        if (name?.includes('wheat')) used.wheat += item.quantity;
        if (name?.includes('sugar')) used.sugar += item.quantity;
        if (name?.includes('dal') || name?.includes('urad')) used.dal += item.quantity;
      });
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PDS_Booking_${slot._id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fillColor('#2563eb').fontSize(24).text('PDS Slot Booking Receipt', { align: 'center' });
    doc.moveDown();
    doc.fillColor('#475569').fontSize(10).text('Generated on: ' + new Date().toLocaleString(), { align: 'center' });
    doc.moveDown(2);

    // User Info Box
    doc.rect(50, 150, 500, 100).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#1e293b').fontSize(12).text(`User Name: ${rationCard?.headOfFamily || 'Resident'}`, 70, 165);
    doc.text(`Ration Card Number: ${user.rationCardNumber}`, 70, 185);
    doc.text(`Card Type: ${user.cardType}`, 70, 205);
    doc.text(`Status: CONFIRMED`, 70, 225, { bold: true });

    // Slot Info
    doc.moveDown(4);
    doc.fillColor('#000000').fontSize(14).text('Appointment Details', 50);
    doc.fontSize(12).text(`Date: ${new Date(slot.date).toDateString()}`, 50);
    doc.text(`Time Slot: ${slot.timeSlot}`, 50);
    doc.text(`Address: Anna Nagar PDS Center, Chennai`, 50);

    // Pending Items Table
    doc.moveDown(2);
    doc.fontSize(14).text('Pending Grocery Items for Collection', 50);
    doc.moveDown();
    
    const tableTop = doc.y;
    doc.fontSize(10).text('Item', 50, tableTop).text('Entitlement', 150, tableTop).text('Collected', 250, tableTop).text('Pending', 350, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let rowY = tableTop + 25;
    const items = [
        { name: 'Rice', total: rules.rice, used: used.rice },
        { name: 'Wheat', total: rules.wheat, used: used.wheat },
        { name: 'Sugar', total: rules.sugar, used: used.sugar },
        { name: 'Dal', total: rules.dal, used: used.dal }
    ];

    items.forEach(item => {
        doc.text(item.name, 50, rowY)
           .text(`${item.total} kg`, 150, rowY)
           .text(`${item.used} kg`, 250, rowY)
           .text(`${Math.max(0, item.total - item.used)} kg`, 350, rowY);
        rowY += 20;
    });

    // Footer
    doc.fontSize(10).fillColor('#94a3b8').text('Please bring your original Ration Card and Aadhaar for verification.', 50, 700, { align: 'center' });
    doc.end();

  } catch (error) {
    next(error);
  }
};

export { bookSlot, getMySlots, getMySlot, getSlotReceipt };
