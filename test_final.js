const mongoose = require("mongoose");
const { refreshSportRadarToken, getSportRadarTokenData } = require("./services/sportradar/sportRadarAuth.service");
require("dotenv").config();

async function testFinal() {
    try {
        console.log("🚀 Starting Final Server-Side Test...");
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        console.log("\n--- RUNNING REFRESH WITH PROXY ---");
        const token = await refreshSportRadarToken();
        console.log("--- REFRESH FINISHED ---\n");

        const data = await getSportRadarTokenData();
        console.log("Metadata in DB:", JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("❌ FINAL TEST FAILED:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data));
        }
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

testFinal();
