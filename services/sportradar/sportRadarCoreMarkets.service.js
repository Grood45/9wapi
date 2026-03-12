const axios = require("axios");
const { getSportRadarToken } = require("./sportRadarAuth.service");

const API_URL = "https://scatalog.mysportsfeed.io/api/v2/core/getmarkets";

/**
 * ⚡ 20-Year Exp Strategy: High-Velocity SportRadar Core Markets Fetcher.
 * Uses 1-second cache, Promise Locks (Concurrency handling), and Token Fallback.
 */
const coreMarketsCache = new Map();
const fetchLocks = new Map();

async function fetchSportRadarCoreMarkets(sportId, eventId) {
    try {
        const now = Date.now();
        const cacheKey = `${sportId}_${eventId}`;
        const cached = coreMarketsCache.get(cacheKey);

        // 1. Extreme Speed Cache (Return if < 1 second old)
        if (cached && (now - cached.lastFetched) < 1000) {
            return cached.data;
        }

        // 2. Concurrency Lock (Prevent duplicate API hits if already fetching)
        if (fetchLocks.has(cacheKey)) {
            return fetchLocks.get(cacheKey);
        }

        // 3. Perform Fetch
        const fetchPromise = (async () => {
            try {
                // 🔹 Token Fallback Logic
                // Try DB token first, if fails use static fallback token
                let token = await getSportRadarToken();
                if (!token) {
                    console.log(`⚠️ DB Token missing, using fallback token for Event: ${eventId}`);
                    token = "53987c47-1e31-4174-9838-bebd59fb69f8";
                }

                // Append prefixes if they are missing
                const formattedSportId = sportId.startsWith('sr:sport:') ? sportId : `sr:sport:${sportId}`;
                const formattedEventId = eventId.startsWith('sr:match:') ? eventId : `sr:match:${eventId}`;

                // 🔹 Static Playload setup exactly as requested by User
                const payload = {
                    operatorId: "99hub",
                    sportId: formattedSportId,
                    eventId: formattedEventId,
                    token: token,
                    providerId: "sportsbook"
                };

                const res = await axios.post(API_URL, payload, {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 Chrome/120"
                    },
                    timeout: 8000
                });

                // Return exactly as the original API responds
                const data = res.data;
                coreMarketsCache.set(cacheKey, { data, lastFetched: Date.now() });
                return data;

            } finally {
                fetchLocks.delete(cacheKey);
            }
        })();

        fetchLocks.set(cacheKey, fetchPromise);
        return fetchPromise;

    } catch (e) {
        console.log(`❌ RADAR CORE MARKETS ERROR (${eventId}):`, e.message);
        return null;
    }
}

module.exports = {
    fetchSportRadarCoreMarkets
};
