const axios = require("axios");

const BASE_URL = "https://central.zplay1.in/pb/api/v1/events/matches/inplay";

/**
 * ⚡ 20-Year Specialist Strategy: Zero-Latency In-Memory Inplay Data.
 * The API endpoint returns data instantly from RAM (0ms latency).
 * The RAM is kept fresh by a high-velocity background worker (Cron).
 */
let gmanMemoryCache = null;

/**
 * 🚀 High-Speed Memory Data Fetcher
 * Used by the REST Controller to serve data with 0ms delay.
 */
async function fetchGmanInplay() {
    // Return last known good data from RAM immediately
    return gmanMemoryCache;
}

/**
 * 🔄 Background Worker Function
 * Periodically called by Cron to sync with the external Gman API.
 */
async function syncGmanInplayToMemory() {
    try {
        const res = await axios.get(BASE_URL, {
            headers: {
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Origin": "https://www.gamewinbuzz.com",
                "Referer": "https://www.gamewinbuzz.com/"
            },
            timeout: 5000 // Tight timeout for high responsiveness
        });

        if (res.data) {
            // Update memory cache instantly
            gmanMemoryCache = res.data;
            // console.log(`✅ GMAN SYNC: Memory updated at ${new Date().toLocaleTimeString()}`);
            return true;
        }
    } catch (e) {
        // Silently fail but log if needed; keep serving old data for resilience
        // console.log(`❌ GMAN SYNC ERROR:`, e.message);
    }
    return false;
}

module.exports = {
    fetchGmanInplay,
    syncGmanInplayToMemory
};
