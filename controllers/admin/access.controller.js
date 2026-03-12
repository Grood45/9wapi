const ClientAccess = require('../../models/ClientAccess');

// Get all access configs for a client
exports.getClientAccesses = async (req, res) => {
    try {
        const accesses = await ClientAccess.find().populate('clientId', 'name').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: accesses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get access by Client ID
exports.getAccessByClient = async (req, res) => {
    try {
        const accesses = await ClientAccess.find({ clientId: req.params.clientId });
        res.status(200).json({ success: true, data: accesses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Create new access configuration
exports.createAccess = async (req, res) => {
    try {
        const access = await ClientAccess.create(req.body);
        res.status(201).json({ success: true, data: access });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Access config for this Provider already exists for this Client.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update access configuration
exports.updateAccess = async (req, res) => {
    try {
        const access = await ClientAccess.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!access) {
            return res.status(404).json({ success: false, message: 'Access configuration not found' });
        }
        res.status(200).json({ success: true, data: access });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete access configuration
exports.deleteAccess = async (req, res) => {
    try {
        const access = await ClientAccess.findByIdAndDelete(req.params.id);
        if (!access) {
            return res.status(404).json({ success: false, message: 'Access configuration not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
