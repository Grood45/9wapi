const mongoose = require("mongoose");
const { syncEvents } = require("./cron/streaming/streamingSync.cron");

async function run() {
    console.log("🚀 STARTING MANUAL SYNC...");
    await mongoose.connect("mongodb+srv://sherykhan:shara%40786@sky.nd6fi1v.mongodb.net/GLIVE?retryWrites=true&w=majority&appName=sky");
    console.log("✅ DB CONNECTED");
    await syncEvents();
    console.log("🏁 SYNC FINISHED");
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
