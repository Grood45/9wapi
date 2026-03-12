const axios = require("axios");
const { getSportRadarToken } = require("./sportRadarAuth.service");

const API_URL = "https://api.mysportsfeed.io/api/v1/core/sportradar-markets";

/**
 * ⚡ 20-Year Exp Strategy: High-Velocity SportRadar Odds Fetcher.
 * Uses automated background token and handles ID prefixing.
 */
const radarOddsCache = new Map();
const fetchLocks = new Map();

async function fetchSportRadarOdds(sportId, eventId) {
    try {
        const now = Date.now();
        const cacheKey = `${sportId}_${eventId}`;
        const cached = radarOddsCache.get(cacheKey);

        // 1. Return Cache if data is less than 1 second old (Extreme Speed)
        if (cached && (now - cached.lastFetched) < 1000) {
            return cached.data;
        }

        // 2. Concurrency Lock
        if (fetchLocks.has(cacheKey)) {
            return fetchLocks.get(cacheKey);
        }

        // 3. Perform Fetch
        const fetchPromise = (async () => {
            try {
                // 🔹 Fetch Fresh Token from DB
                const token = await getSportRadarToken();
                if (!token) throw new Error("SPORTRADAR_TOKEN_NOT_FOUND_IN_DB");

                // 🔹 Format Request Payload
                // sportId: "21" -> "sr:sport:21"
                // eventId: "67432974" -> "sr:match:67432974"
                const payload = {
                    operatorId: "99hub",
                    sportId: sportId.startsWith("sr:") ? sportId : `sr:sport:${sportId}`,
                    eventId: eventId.startsWith("sr:") ? eventId : `sr:match:${eventId}`,
                    token: token,
                    providerId: "SportRadar"
                };

                const res = await axios.post(API_URL, payload, {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 Chrome/120"
                    },
                    timeout: 8000
                });

                const data = res.data;
                radarOddsCache.set(cacheKey, { data, lastFetched: Date.now() });
                return data;

            } finally {
                fetchLocks.delete(cacheKey);
            }
        })();

        fetchLocks.set(cacheKey, fetchPromise);
        return fetchPromise;

    } catch (e) {
        console.log(`❌ RADAR ODDS ERROR (${eventId}):`, e.message);
        return null;
    }
}

module.exports = {
    fetchSportRadarOdds
};
