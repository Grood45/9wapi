const mongoose = require("mongoose");

const sportEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    eventType: { type: String }, // Sport ID (4, 1, etc.)
    marketId: { type: String },
    openDate: { type: Date },
    rawData: { type: Object },
    updatedAt: { type: Date, default: Date.now }
});

// ⚡ High Performance Index
sportEventSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 172800 }); // Auto-cleanup

module.exports = mongoose.model("SportEvent", sportEventSchema, "sportevent");
