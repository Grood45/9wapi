const Client = require('../../models/Client');
const Ledger = require('../../models/Ledger');

// Get all clients with aggregated revenue stats
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 }).lean();

        // Enhance clients with ledger stats
        const clientsWithStats = await Promise.all(clients.map(async (client) => {
            const ledgers = await Ledger.find({ clientId: client._id });
            const stats = ledgers.reduce((acc, curr) => {
                acc.totalExpected += (curr.expectedAmount || 0);
                acc.totalCollected += (curr.collectedAmount || 0);
                return acc;
            }, { totalExpected: 0, totalCollected: 0 });

            return {
                ...client,
                revenueStats: {
                    ...stats,
                    pendingBalance: stats.totalExpected - stats.totalCollected
                }
            };
        }));

        res.status(200).json({ success: true, data: clientsWithStats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new client
exports.createClient = async (req, res) => {
    try {
        const client = await Client.create(req.body);

        if (req.body.monthlyAgreementAmount && Number(req.body.monthlyAgreementAmount) > 0) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            await Ledger.create({
                clientId: client._id,
                monthYear: currentMonth,
                expectedAmount: Number(req.body.monthlyAgreementAmount),
                collectedAmount: 0,
                status: 'pending'
            });
        }

        res.status(201).json({ success: true, data: client });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get single client
exports.getClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(200).json({ success: true, data: client });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update client
exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(200).json({ success: true, data: client });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete client
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
