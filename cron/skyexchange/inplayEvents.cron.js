const cron = require("node-cron");
const { fetchAndCacheInplayEvents } = require("../../services/skyexchange/inplayEvents.service");

// ⏰ EVERY 5 MINUTES (List of Inplay Matches)
// Running behind the scenes, caching instantly, and intelligently syncing DB.
cron.schedule("*/5 * * * *", fetchAndCacheInplayEvents);

// 🔥 WARMUP IMMEDIATELY ON STARTUP
setTimeout(fetchAndCacheInplayEvents, 5000);

module.exports = {};
