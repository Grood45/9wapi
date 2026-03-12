const mongoose = require("mongoose");

const BetfairMarketResultSchema = new mongoose.Schema({
    marketId: {
        type: String,
        required: true,
        unique: true, // Will be indexed automatically by MongoDB
    },
    eventId: {
        type: Number,
        required: true,
    },
    eventTypeId: {
        type: Number,
        required: true,
    },
    sportName: {
        type: String,
        default: "Unknown"
    },
    status: {
        type: String,
        default: "OPEN", // e.g. OPEN, CLOSED, SUSPENDED
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now,
    },
    runners: [{
        selectionId: { type: Number },
        runnerName: { type: String }, // Initially set to "Selection {ID}"
        handicap: { type: Number, default: 0 },
        state: {
            sortPriority: { type: Number },
            lastPriceTraded: { type: Number },
            totalMatched: { type: Number },
            status: { type: String }, // e.g. ACTIVE, WINNER, LOSER, REMOVED, SUSPENDED
            isResult: { type: String, default: 'Unsettled' }, // Unsettled or Settled based on Market Status
            result: { type: String, default: 'Unsettled' } // Mapped result: WINNER, LOSER, REMOVED, Unsettled
        }
    }],
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("BetfairMarketResult", BetfairMarketResultSchema);
