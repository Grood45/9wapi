const mongoose = require("mongoose");

const tomorrowEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    eventType: { type: String },
    marketId: { type: String },
    openDate: { type: Date },
    rawData: { type: Object },
    updatedAt: { type: Date, default: Date.now }
});

// ⚡ High Performance Indexes
tomorrowEventSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 172800 }); // AUTO-DELETE AFTER 48 HOURS

module.exports = mongoose.model("TomorrowEvent", tomorrowEventSchema, "tomorrowevent");
