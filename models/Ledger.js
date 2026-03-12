const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    monthYear: {
        type: String, // e.g., '2026-03'
        required: true
    },
    expectedAmount: {
        type: Number,
        required: true,
        default: 0
    },
    collectedAmount: {
        type: Number,
        required: true,
        default: 0
    },
    transactions: [
        {
            amount: Number,
            date: { type: Date, default: Date.now },
            type: { type: String, enum: ['CREDIT', 'DEBIT'] }, // Payment collected is CREDIT, Invoice added is DEBIT
            description: String
        }
    ],
    status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'overdue'],
        default: 'pending'
    }
}, { timestamps: true });

// Ensure one ledger per client per month
ledgerSchema.index({ clientId: 1, monthYear: 1 }, { unique: true });

// Virtual for pending balance
ledgerSchema.virtual('pendingAmount').get(function () {
    return this.expectedAmount - this.collectedAmount;
});

// Ensure virtuals are included in JSON/Object conversions
ledgerSchema.set('toJSON', { virtuals: true });
ledgerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
