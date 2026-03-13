const { 
    syncKingEvents, 
    syncKingResults, 
    cleanupOldResults 
} = require("../../services/kingexchange/kingExchange.service");

// Recursive timers to avoid Cron overlap drift
let eventTimer = null;
let liveTimer = null;
let cleanupTimer = null;

/**
 * 🧠 KX Sync Brain
 * Starts all background workers with smart intervals.
 */
async function startKingSync() {
    console.log("👑 KINGEXCHANGE SYNC HUB: Starting...");

    // 1. Immediate Discovery (Warmup)
    await syncKingEvents();

    // 2. Schedule Event Discovery (Every 4 minutes)
    const runEventSync = async () => {
        await syncKingEvents();
        eventTimer = setTimeout(runEventSync, 4 * 60 * 1000);
    };
    eventTimer = setTimeout(runEventSync, 4 * 60 * 1000);

    // 3. Schedule Live Result Sync (Every 15-20 seconds)
    const runLiveSync = async () => {
        await syncKingResults();
        liveTimer = setTimeout(runLiveSync, 15 * 1000);
    };
    runLiveSync(); // Start Result fetching immediately for any live matches

    // 4. Schedule Cleanup (Every 1 hour)
    const runCleanup = async () => {
        await cleanupOldResults();
        cleanupTimer = setTimeout(runCleanup, 60 * 60 * 1000);
    };
    cleanupTimer = setTimeout(runCleanup, 60 * 60 * 1000);
}

module.exports = { startKingSync };
