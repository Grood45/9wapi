const cron = require("node-cron");
const { fetchAndCacheTodayEvents } = require("../../services/skyexchange/todayEvents.service");

// ⏰ EVERY 5 MINUTES (Fetch Today Matches List)
// Today events don't change by the second, 5 mins is optimal for Origin Server health.
cron.schedule("*/5 * * * *", fetchAndCacheTodayEvents);

// 🔥 WARMUP IMMEDIATELY ON STARTUP
setTimeout(fetchAndCacheTodayEvents, 7000); // 7s so it doesn't collide simultaneously with inplay warmup

module.exports = {};
