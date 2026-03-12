const cron = require("node-cron");
const { fetchAndCacheSportEvents } = require("../../services/skyexchange/sportEvents.service");

// POPULAR SPORTS IDS
const SPORTS = ["4", "1", "2", "137"]; // Cricket, Soccer, Tennis, E-Soccer

// ⏰ EVERY 5 MINUTES (Refresh all sports)
cron.schedule("*/5 * * * *", async () => {
    for (const sportId of SPORTS) {
        await fetchAndCacheSportEvents(sportId);
        // Small 1s stagger to not slam provider in the same millisecond
        await new Promise(r => setTimeout(r, 1000));
    }
});

// 🔥 WARMUP
setTimeout(async () => {
    for (const sportId of SPORTS) {
        await fetchAndCacheSportEvents(sportId);
        await new Promise(r => setTimeout(r, 1500));
    }
}, 15000); // 15s after startup

module.exports = {};
