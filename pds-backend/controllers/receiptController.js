import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import Slot from '../models/Slot.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Transaction from '../models/Transaction.js';

// @desc    Generate Official TN PDS Receipt with QR Code
// @route   GET /api/receipt/:slotId
// @access  Private
const generateOfficialReceipt = async (req, res, next) => {
  try {
    const { slotId } = req.params;

    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    const user = await User.findById(req.user._id).populate('rationCardId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const rationCard = user.rationCardId;
    const shop = await Shop.findById(user.shopId);

    // 1. Calculate Quota Details (TN Rules)
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

    // 2. Generate QR Code
    const qrData = JSON.stringify({
      userId: user._id,
      slotId: slot._id,
      date: slot.date,
      timeSlot: slot.timeSlot,
      rationNo: user.rationCardNumber
    });
    const qrBuffer = await QRCode.toBuffer(qrData, { 
        width: 150,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' }
    });

    // 3. Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TNPDS_Receipt_${slot._id}.pdf`);
    doc.pipe(res);

    // --- OFFICIAL HEADER ---
    doc.fillColor('#000000').fontSize(16).text('GOVERNMENT OF TAMIL NADU', { align: 'center', bold: true });
    doc.fontSize(14).text('DEPARTMENT OF FOOD AND CONSUMER PROTECTION', { align: 'center' });
    doc.fontSize(18).fillColor('#2563eb').text('Tamil Nadu Public Distribution System', { align: 'center', bold: true });
    doc.fontSize(10).fillColor('#64748b').text('Digital Ration Distribution Receipt (Web-Generated)', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cbd5e1').stroke();
    doc.moveDown(2);

    // --- USER INFORMATION ---
    doc.fillColor('#1e293b').fontSize(12).text('RECIPIENT INFORMATION', { bold: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Customer Name: ${rationCard?.headOfFamily || 'Resident'}`);
    doc.text(`Ration Card No: ${user.rationCardNumber}`);
    doc.text(`Card Category: ${user.cardType}`);
    doc.text(`Mobile Number: ${user.mobileNumber}`);
    doc.moveDown();

    // --- BOOKING INFORMATION ---
    const startY = doc.y;
    doc.fillColor('#1e293b').fontSize(12).text('APPOINTMENT DETAILS', 50, startY, { bold: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Scheduled Date: ${new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    doc.text(`Assigned Window: ${slot.timeSlot}`);
    doc.text(`Shop Name: ${shop?.name || 'Anna Nagar Circle-1 FPS'}`);
    doc.text(`Location: ${shop?.location || 'Chennai'}`);
    doc.text(`Status: BOOKING CONFIRMED`, { bold: true, color: '#059669' });

    // --- QR CODE EMBEDDING ---
    doc.image(qrBuffer, 400, startY - 20, { width: 120 });
    doc.fontSize(8).fillColor('#94a3b8').text('SCAN FOR VERIFICATION', 415, startY + 105);

    // --- COMMODITY ENTITLEMENT TABLE ---
    doc.moveDown(4);
    doc.fillColor('#1e293b').fontSize(12).text('MONTHLY ENTITLEMENT STATUS', 50, doc.y, { bold: true });
    doc.moveDown();

    const tableTop = doc.y;
    const colWidths = [150, 100, 100, 100];
    const headers = ['Commodity Item', 'Entitlement', 'Collected', 'Remaining'];

    // Table Header Background
    doc.rect(50, tableTop - 5, 495, 20).fill('#f8fafc');
    doc.fillColor('#475569').fontSize(10).text(headers[0], 65, tableTop);
    doc.text(headers[1], 215, tableTop);
    doc.text(headers[2], 315, tableTop);
    doc.text(headers[3], 415, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#e2e8f0').stroke();

    let rowY = tableTop + 25;
    const tableData = [
      { name: 'Rice (Arisi)', total: rules.rice, used: used.rice },
      { name: 'Wheat (Godhumai)', total: rules.wheat, used: used.wheat },
      { name: 'Sugar (Sarkarai)', total: rules.sugar, used: used.sugar },
      { name: 'Dal (Paruppu)', total: rules.dal, used: used.dal }
    ];

    tableData.forEach(item => {
      doc.fillColor('#334155').fontSize(10);
      doc.text(item.name, 65, rowY);
      doc.text(`${item.total} kg`, 215, rowY);
      doc.text(`${item.used} kg`, 315, rowY);
      doc.text(`${Math.max(0, item.total - item.used)} kg`, 415, rowY, { bold: true });
      doc.moveTo(50, rowY + 15).lineTo(545, rowY + 15).strokeColor('#f1f5f9').stroke();
      rowY += 25;
    });

    // --- FOOTER ---
    doc.moveDown(4);
    doc.fillColor('#94a3b8').fontSize(9).text('DISCLAIMER: This is a system-generated document issued by the Tamil Nadu Public Distribution System portal. It does not require a physical signature. Collection is subject to biometric verification at the FPS shop.', { align: 'center', italic: true });
    doc.moveDown();
    doc.text(`Digital Sign ID: ${slot._id}-${Date.now()}`, { align: 'center' });

    doc.end();

  } catch (error) {
    next(error);
  }
};

export { generateOfficialReceipt };
