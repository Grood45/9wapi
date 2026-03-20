const { syncGmanInplayToMemory } = require("../../services/gman/gman.service");

/**
 * ⚡ 20-Year Specialist Worker: High-Velocity Gman Syncer.
 * Runs every 2 seconds to keep the RAM cache fresh for 0ms API responses.
 */
async function startGmanBackgroundWorker() {
    // console.log("🚀 GMAN WORKER: INITIALIZING...");
    
    // Initial Warmup
    await syncGmanInplayToMemory();

    // High-Velocity Interval Polling (Faster and more reliable than Cron for < 10s intervals)
    setInterval(async () => {
        await syncGmanInplayToMemory();
    }, 2000); // 2 Seconds Pulse (Ultra-Fast)
}

module.exports = {
    startGmanBackgroundWorker
};
