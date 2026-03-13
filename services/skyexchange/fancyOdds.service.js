const axios = require("axios");

// 9tens Fancy Markets API (No Cookies Required - High Stability)
const BASE_URL = "https://apiv2.9tens.live:5010/v1/spb/get-fancy-market";

/**
 * ⚡ 20-Year Exp Strategy: On-Demand Throttled Fancy Odds
 * Migrated to 9tens provider for cookie-less, stable operation.
 * Maintains efficient Map-based caching and concurrency locking.
 */
const activeFancyCache = new Map();
const fetchLocks = new Map();

async function fetchFancyOdds(eventId) {
    try {
        const now = Date.now();
        const cached = activeFancyCache.get(eventId);

        // 1. Return Cache if data is less than 1.5 seconds old
        if (cached && (now - cached.lastFetched) < 1500) {
            return cached.data;
        }

        // 2. Concurrency Lock (Thundering Herd Protection)
        if (fetchLocks.has(eventId)) {
            return fetchLocks.get(eventId);
        }

        // 3. Perform Fetch
        const fetchPromise = (async () => {
            try {
                const url = `${BASE_URL}?match_id=${eventId}`;
                
                const res = await axios.get(url, {
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0"
                    },
                    timeout: 8000
                });

                if (res.data && res.data.status === true) {
                    const data = res.data.data;
                    activeFancyCache.set(eventId, { data, lastFetched: Date.now() });
                    return data;
                } else {
                    console.log(`⚠️ 9TENS FANCY API INVALID (${eventId}):`, JSON.stringify(res.data).substring(0, 100));
                    // Return stale data if available on API failure
                    return cached ? cached.data : null;
                }

            } catch (e) {
                console.log(`❌ 9TENS FANCY FETCH ERROR (${eventId}):`, e.message);
                // Graceful Fallback: Return last known good data from RAM if API is down
                return cached ? cached.data : null;
            } finally {
                fetchLocks.delete(eventId);
            }
        })();

        fetchLocks.set(eventId, fetchPromise);
        return fetchPromise;

    } catch (e) {
        console.log(`❌ FANCY ODDS SERVICE ERROR (${eventId}):`, e.message);
        return null;
    }
}

module.exports = {
    fetchFancyOdds
};
