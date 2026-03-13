const mongoose = require("mongoose");
const SystemConfig = require("./models/SystemConfig");
require("dotenv").config();

async function inspectDB() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const token = await SystemConfig.findOne({ key: "AUTH_TOKEN" });
    const cookie = await SystemConfig.findOne({ key: "COOKIE" });

    console.log("Current AUTH_TOKEN in DB:", token ? JSON.stringify(token.value).substring(0, 100) : "MISSING");
    console.log("Current COOKIE in DB:", cookie ? JSON.stringify(cookie.value) : "MISSING");

    if (process.argv.includes("--clear")) {
        await SystemConfig.deleteMany({ key: { $in: ["AUTH_TOKEN", "COOKIE"] } });
        console.log("✅ Cleared AUTH_TOKEN and COOKIE from DB");
    }

    await mongoose.disconnect();
}

inspectDB();
