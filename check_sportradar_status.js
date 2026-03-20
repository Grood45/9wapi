const mongoose = require("mongoose");
const SystemConfig = require("./models/SystemConfig");
const { refreshSportRadarToken, getSportRadarToken } = require("./services/sportradar/sportRadarAuth.service");
require("dotenv").config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const token = await getSportRadarToken();
        console.log("Current SPORTRADAR_TOKEN in DB:", token);

        console.log("Attempting to refresh SportRadar token...");
        const newToken = await refreshSportRadarToken();
        console.log("New SPORTRADAR_TOKEN:", newToken);

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    } finally {
        await mongoose.disconnect();
    }
}

run();
