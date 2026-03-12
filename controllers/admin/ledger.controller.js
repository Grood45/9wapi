const Ledger = require('../../models/Ledger');

// Get all ledgers (with optional monthYear filter)
exports.getLedgers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.monthYear) {
            filter.monthYear = req.query.monthYear;
        }

        const ledgers = await Ledger.find(filter)
            .populate('clientId', 'name companyName')
            .sort({ monthYear: -1, createdAt: -1 });

        res.status(200).json({ success: true, data: ledgers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get ledger for a specific client
exports.getClientLedger = async (req, res) => {
    try {
        const ledgers = await Ledger.find({ clientId: req.params.clientId })
            .sort({ monthYear: -1 });
        res.status(200).json({ success: true, data: ledgers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Initialize or update a month's ledger for a client
exports.upsertLedger = async (req, res) => {
    const { clientId, monthYear, expectedAmount } = req.body;

    try {
        let ledger = await Ledger.findOne({ clientId, monthYear });

        if (ledger) {
            ledger.expectedAmount = expectedAmount !== undefined ? expectedAmount : ledger.expectedAmount;
            // recalculate status if needed
            if (ledger.collectedAmount >= ledger.expectedAmount && ledger.expectedAmount > 0) {
                ledger.status = 'paid';
            } else if (ledger.collectedAmount > 0) {
                ledger.status = 'partial';
            } else {
                ledger.status = 'pending';
            }
            await ledger.save();
        } else {
            ledger = await Ledger.create({
                clientId,
                monthYear,
                expectedAmount: expectedAmount || 0,
                collectedAmount: 0,
                transactions: [],
                status: 'pending'
            });
        }

        res.status(200).json({ success: true, data: ledger });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add a transaction (Payment received or Invoice added)
exports.addTransaction = async (req, res) => {
    const { amount, description, type } = req.body; // type: 'CREDIT' (payment) or 'DEBIT' (invoice adjustment)

    try {
        const ledger = await Ledger.findById(req.params.id);

        if (!ledger) {
            return res.status(404).json({ success: false, message: 'Ledger not found' });
        }

        // Add transaction
        ledger.transactions.push({
            amount,
            description,
            type,
            date: new Date()
        });

        // Update collected/expected amounts based on type
        if (type === 'CREDIT') {
            ledger.collectedAmount += amount;
        } else if (type === 'DEBIT') {
            // For example, extra charges added in the middle of the month
            ledger.expectedAmount += amount;
        }

        // Update status
        if (ledger.collectedAmount >= ledger.expectedAmount && ledger.expectedAmount > 0) {
            ledger.status = 'paid';
        } else if (ledger.collectedAmount > 0) {
            ledger.status = 'partial';
        }

        await ledger.save();
        res.status(200).json({ success: true, data: ledger });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Dashboard Stats Helper
exports.getDashboardStats = async (req, res) => {
    try {
        const { monthYear } = req.query; // Optional specific month check
        const filter = monthYear ? { monthYear } : {};

        const stats = await Ledger.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalExpected: { $sum: "$expectedAmount" },
                    totalCollected: { $sum: "$collectedAmount" },
                }
            }
        ]);

        const totals = stats.length > 0 ? stats[0] : { totalExpected: 0, totalCollected: 0 };

        res.status(200).json({
            success: true,
            data: {
                expectedIncome: totals.totalExpected,
                collectedIncome: totals.totalCollected,
                pendingDues: totals.totalExpected - totals.totalCollected
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
