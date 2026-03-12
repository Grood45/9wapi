const cron = require("node-cron");
const { fetchAndCacheLiveEventsCount } = require("../../services/skyexchange/liveEventsCount.service");

// ⏰ EVERY 1 MINUTE (Total Live Count - Lightweight)
cron.schedule("*/1 * * * *", fetchAndCacheLiveEventsCount);

// 🔥 WARMUP IMMEDIATELY ON STARTUP
setTimeout(fetchAndCacheLiveEventsCount, 3000);

module.exports = {};
