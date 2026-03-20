const mongoose = require("mongoose");
const ClientAccess = require("./models/ClientAccess");
require("dotenv").config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const access = await ClientAccess.find({});
        console.log("Client Access Configs:", JSON.stringify(access, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
