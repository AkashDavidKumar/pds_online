import { Parser } from 'json2csv';
import Transaction from '../models/Transaction.js';

export const exportTransactions = async (req, res) => {
    try {
        const dealerId = req.user._id;
        
        // Find all transactions for this dealer
        const transactions = await Transaction.find({ dealerId })
            .populate('rationCardId', 'cardNumber')
            .populate('userId', 'name')
            .sort({ date: -1 });

        // Flatten data for CSV
        const csvData = transactions.map(tx => ({
            'Transaction ID': tx.transactionNumber,
            'Date': new Date(tx.date).toLocaleDateString(),
            'Time': new Date(tx.date).toLocaleTimeString(),
            'Ration Card': tx.rationCardId?.cardNumber || 'N/A',
            'Beneficiary': tx.userId?.name || 'N/A',
            'Rice (kg)': tx.items.find(i => i.productId?.name?.toLowerCase().includes('rice'))?.quantity || 0,
            'Wheat (kg)': tx.items.find(i => i.productId?.name?.toLowerCase().includes('wheat'))?.quantity || 0,
            'Sugar (kg)': tx.items.find(i => i.productId?.name?.toLowerCase().includes('sugar'))?.quantity || 0,
            'Dal (kg)': tx.items.find(i => i.productId?.name?.toLowerCase().includes('dal'))?.quantity || 0,
            'Auth Method': tx.authMethod,
            'Status': tx.status
        }));

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header('Content-Type', 'text/csv');
        res.attachment(`Report-${new Date().toISOString().split('T')[0]}.csv`);
        return res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
