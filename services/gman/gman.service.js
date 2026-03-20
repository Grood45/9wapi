const axios = require("axios");

const BASE_URL = "https://central.zplay1.in/pb/api/v1/events/matches/inplay";

/**
 * ⚡ Gman Provider Service: High-Velocity In-Play Fetcher.
 * Uses 1-second cache to prevent API abuse and handle high concurrency.
 */
const gmanCache = {
    data: null,
    lastFetched: 0
};

let fetchLock = null;

async function fetchGmanInplay() {
    try {
        const now = Date.now();

        // 1. Extreme Speed Cache (Return if < 1 second old)
        if (gmanCache.data && (now - gmanCache.lastFetched) < 1000) {
            return gmanCache.data;
        }

        // 2. Concurrency Lock (Prevent duplicate API hits if already fetching)
        if (fetchLock) {
            return fetchLock;
        }

        // 3. Perform Fetch
        fetchLock = (async () => {
            try {
                const res = await axios.get(BASE_URL, {
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                        "Origin": "https://www.gamewinbuzz.com",
                        "Referer": "https://www.gamewinbuzz.com/"
                    },
                    timeout: 8000
                });

                const data = res.data;
                gmanCache.data = data;
                gmanCache.lastFetched = Date.now();
                return data;

            } finally {
                fetchLock = null;
            }
        })();

        return fetchLock;

    } catch (e) {
        if (e.response) {
            console.log(`❌ GMAN INPLAY ERROR: Status ${e.response.status}`);
        } else {
            console.log(`❌ GMAN INPLAY ERROR:`, e.message);
        }
        return null;
    }
}

module.exports = {
    fetchGmanInplay
};
