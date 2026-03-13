const mongoose = require("mongoose");

const KingResultSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    marketId: { type: String, required: true },
    marketName: { type: String },
    sportId: { type: String },
    sportName: { type: String },
    eventName: { type: String },
    selectionId: { type: String },
    selectionName: { type: String },
    result: { type: String },
    marketType: { type: String },
    flag: { type: String },
    rawData: { type: Object },
    isSettled: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for fast lookups
KingResultSchema.index({ eventId: 1 });
KingResultSchema.index({ marketId: 1 }, { unique: true });
KingResultSchema.index({ lastSeen: 1 }); // For cleanup

module.exports = mongoose.model("KingResult", KingResultSchema);
