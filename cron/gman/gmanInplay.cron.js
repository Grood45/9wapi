const { 
    syncGmanInplayToMemory, 
    syncGmanSportsToMemory, 
    syncGmanEventsBySportToMemory, 
    fetchGmanSports,
    syncGmanMatchDetailToMemory,
    cleanupGmanActiveMatches,
    gmanActiveMatches
} = require("../../services/gman/gman.service");

/**
 * ⚡ Discovery & Polling System
 */
async function pollAllGmanSports() {
    const sportsData = await fetchGmanSports();
    if (sportsData && sportsData.data && Array.isArray(sportsData.data.sports)) {
        for (const sport of sportsData.data.sports) {
            if (sport.id) {
                await syncGmanEventsBySportToMemory(sport.id);
                await new Promise(resolve => setTimeout(resolve, 200)); 
            }
        }
    }
}

/**
 * ⚡ Real-Time Odds Polling (On-Demand Only)
 */
async function pollActiveGmanMatchDetails() {
    // Only poll matches that clients are currently viewing
    for (const matchId of gmanActiveMatches) {
        await syncGmanMatchDetailToMemory(matchId);
        await new Promise(resolve => setTimeout(resolve, 100)); // Be gentle
    }
}

async function startGmanBackgroundWorker() {
    await syncGmanSportsToMemory();
    
    await Promise.all([
        syncGmanInplayToMemory(),
        pollAllGmanSports()
    ]);

    // 🚀 High-Velocity Odds Pulse: Every 2 Seconds
    setInterval(async () => {
        await pollActiveGmanMatchDetails();
    }, 2000);

    // 🚀 Inplay & Dynamic Match Loop: 10 Seconds Pulse
    setInterval(async () => {
        await Promise.all([
            syncGmanInplayToMemory(),
            pollAllGmanSports()
        ]);
        cleanupGmanActiveMatches(); // Maintenance
    }, 10000); 

    // 🔄 Sports Discovery Loop: Once a week
    setInterval(async () => {
        await syncGmanSportsToMemory();
    }, 7 * 24 * 60 * 60 * 1000); 
}

module.exports = {
    startGmanBackgroundWorker
};
