const mongoose = require("mongoose");

const todayEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    eventType: { type: String }, // 4=Cricket, 1=Soccer, etc.
    marketId: { type: String },
    openDate: { type: Date },
    rawData: { type: Object }, // Store the full object for future flexibility
    updatedAt: { type: Date, default: Date.now }
});

// ⚡ High Performance Indexes
todayEventSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 172800 }); // ✨ AUTO-DELETE AFTER 48 HOURS (172800 sec) to keep DB clean

module.exports = mongoose.model("TodayEvent", todayEventSchema, "todayevent"); // Explicitly named 'todayevent'
