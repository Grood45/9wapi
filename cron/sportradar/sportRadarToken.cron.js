const cron = require("node-cron");
const { refreshSportRadarToken } = require("../../services/sportradar/sportRadarAuth.service");

/**
 * ⚡ 20-Year Exp Strategy: Proactive Token Renewal.
 * Refresh every 4 hours (Token usually lasts 5 hours).
 */
cron.schedule("0 */4 * * *", async () => {
    try {
        console.log("⏰ CRON: Refreshing SportRadar Token...");
        await refreshSportRadarToken();
    } catch (e) {
        console.log("❌ CRON ERROR (SportRadar):", e.message);
    }
});

console.log("♻️ SPORTRADAR TOKEN CRON START");
