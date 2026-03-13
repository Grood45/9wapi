const mongoose = require("mongoose");

const KingSportSchema = new mongoose.Schema({
    sportId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    provider: { type: String, default: "KingExchange" },
    rawData: { type: Object },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("KingSport", KingSportSchema);
