const mongoose = require('mongoose');

const clientAccessSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    providerName: {
        type: String, // e.g., 'SportRadar', 'Betfair', 'SkyExchange'
        required: true
    },
    endpoints: [{
        type: String // specific routes or 'ALL'
    }],
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    whitelistedIPs: [{
        type: String
    }],
    domains: [{
        type: String
    }],
    requestLimitPerSecond: {
        type: Number,
        default: -1 // -1 means unlimited
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'revoked'],
        default: 'active'
    }
}, { timestamps: true });

// Prevent duplicate active access for same provider
clientAccessSchema.index({ clientId: 1, providerName: 1 }, { unique: true });

module.exports = mongoose.model('ClientAccess', clientAccessSchema);
