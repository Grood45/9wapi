const cron = require("node-cron");
const { fetchAndCacheTomorrowEvents } = require("../../services/skyexchange/tomorrowEvents.service");

// ⏰ EVERY 5 MINUTES
cron.schedule("*/5 * * * *", fetchAndCacheTomorrowEvents);

// 🔥 WARMUP
setTimeout(fetchAndCacheTomorrowEvents, 10000); // 10s delay

module.exports = {};
