const axios = require("axios");

const BASE_URL = "https://deoulnk5dqcl0.cloudfront.net/extr/v1/dashboard/getFancyRunners";

/**
 * ⚡ 20-Year Exp Strategy: High-Velocity t10 Fancy Result Fetcher.
 * Uses 1-second cache and Promise Locks (Concurrency handling).
 */
const t10FancyResultCache = new Map();
const fetchLocks = new Map();

async function fetchT10FancyResult(eventId) {
    try {
        const now = Date.now();
        const cached = t10FancyResultCache.get(eventId);

        // 1. Extreme Speed Cache (Return if < 1 second old)
        if (cached && (now - cached.lastFetched) < 1000) {
            return cached.data;
        }

        // 2. Concurrency Lock (Prevent duplicate API hits if already fetching)
        if (fetchLocks.has(eventId)) {
            return fetchLocks.get(eventId);
        }

        // 3. Perform Fetch
        const fetchPromise = (async () => {
            try {
                const url = `${BASE_URL}?eventId=${eventId}`;

                const res = await axios.get(url, {
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                        "Origin": "https://the100exch.com",       // Safely spoofing origin
                        "Referer": "https://the100exch.com/"
                    },
                    timeout: 8000
                });

                // Return exactly as the original API responds
                const data = res.data;
                t10FancyResultCache.set(eventId, { data, lastFetched: Date.now() });
                return data;

            } finally {
                fetchLocks.delete(eventId);
            }
        })();

        fetchLocks.set(eventId, fetchPromise);
        return fetchPromise;

    } catch (e) {
        if (e.response) {
            console.log(`❌ T10 FANCY RESULT ERROR (${eventId}): Status ${e.response.status}`);
        } else {
            console.log(`❌ T10 FANCY RESULT ERROR (${eventId}):`, e.message);
        }
        return null;
    }
}

module.exports = {
    fetchT10FancyResult
};
