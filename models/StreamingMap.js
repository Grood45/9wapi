const mongoose = require("mongoose");

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Clean Mapping: Link disparate IDs (Diamond gmid vs Betfair eventId).
 * 2. Auto-Cleanup: TTL index ensures DB never bloats with old matches.
 * 3. Fast Retrieval: Indexed lookups for O(1) performance.
 */

const streamingMapSchema = new mongoose.Schema({
    betfairId: { type: String, required: true, index: true },
    diamondId: { type: String, index: true }, // Mapped from 'gmid'
    d247Id: { type: String, index: true },    // Mapped from D247 'event_id'
    eventName: { type: String, required: true },
    sportId: { type: Number, required: true }, // 1=Soccer, 2=Tennis, 4=Cricket
    status: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    eventTime: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// 🛡️ AUTO-DELETE AFTER 48 HOURS (172800 seconds)
streamingMapSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

// Compound index for unique pairs to prevent duplicates
streamingMapSchema.index({ betfairId: 1, diamondId: 1 }, { unique: true });

module.exports = mongoose.model("StreamingMap", streamingMapSchema, "streaming_map");
