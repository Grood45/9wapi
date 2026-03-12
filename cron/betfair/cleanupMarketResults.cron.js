const cron = require("node-cron");
const BetfairMarketResult = require("../../models/BetfairMarketResult");
const { fetchAndSaveBetfairMarketResult } = require("../../services/betfair/betfairMarketResult.service");

// Runs every 15 minutes
const cleanupMarketResultsCron = cron.schedule("*/15 * * * *", async () => {
    try {
        console.log("♻️ [Betfair Cron] Starting DB Status Refresh & Cleanup...");

        // --- STEP 1: ACTIVE POLLING FOR "OPEN" OR "SUSPENDED" MARKETS ---
        // Find all currently tracked markets that are NOT marked as closed yet.
        const activeMarkets = await BetfairMarketResult.find({ status: { $in: ["OPEN", "SUSPENDED"] } }).select("marketId");

        if (activeMarkets.length > 0) {
            const marketIds = activeMarkets.map(m => m.marketId);

            // Chuncking the ids into max 10 to avoid URI too long errors from proxy
            const CHUNK_SIZE = 10;
            for (let i = 0; i < marketIds.length; i += CHUNK_SIZE) {
                const chunk = marketIds.slice(i, i + CHUNK_SIZE);
                const idsString = chunk.join(",");

                // Hitting the proxy service explicitly for this chunk to auto-update DB
                await fetchAndSaveBetfairMarketResult(idsString);
                console.log(`📡 [Betfair Cron] Polled status for markets: ${idsString}`);
            }
        } else {
            console.log("📡 [Betfair Cron] No active (OPEN/SUSPENDED) markets to poll.");
        }

        // --- STEP 2: 3-HOUR AUTO CLEANUP DELETION ---
        // Find markets closed > 3 hours ago
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

        const deleteResult = await BetfairMarketResult.deleteMany({
            status: "CLOSED",
            statusUpdatedAt: { $lte: threeHoursAgo }
        });

        if (deleteResult.deletedCount > 0) {
            console.log(`🗑️ [Betfair Cron] REMOVED ${deleteResult.deletedCount} STALE CLOSED MARKETS FROM DB`);
        } else {
            console.log("✅ [Betfair Cron] No stale closed markets to delete.");
        }

    } catch (e) {
        console.error("❌ [Betfair Cron Error]:", e.message);
    }
});

module.exports = cleanupMarketResultsCron;
