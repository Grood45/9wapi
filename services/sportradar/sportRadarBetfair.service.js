const axios = require("axios");
const { getSportRadarToken } = require("./sportRadarAuth.service");

const API_URL = "https://api.mysportsfeed.io/api/v1/feed/betfair-market-in-sr";

/**
 * ⚡ 20-Year Exp Strategy: High-Velocity SportRadar Betfair Fetcher.
 * Uses 1-second cache, Promise Locks (Concurrency handling), and Token Fallback.
 */
const betfairCache = new Map();
const fetchLocks = new Map();

async function fetchSportRadarBetfair(sportId, eventId) {
    try {
        const now = Date.now();
        const cacheKey = `${sportId}_${eventId}`;
        const cached = betfairCache.get(cacheKey);

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
                    token = "89cadae2-46cd-48db-a228-da6fcce2a6d6";
                }

                // 🔹 Static Playload setup exactly as requested by User
                const payload = {
                    operatorId: "clickbet",
                    providerId: "SportRadar",
                    sportId: String(sportId),
                    eventId: String(eventId),
                    partnerId: "CBPID01",
                    token: token,
                    origin: "PREMIUM"
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
                betfairCache.set(cacheKey, { data, lastFetched: Date.now() });
                return data;

            } finally {
                fetchLocks.delete(cacheKey);
            }
        })();

        fetchLocks.set(cacheKey, fetchPromise);
        return fetchPromise;

    } catch (e) {
        console.log(`❌ RADAR BETFAIR ERROR (${eventId}):`, e.message);
        return null;
    }
}

module.exports = {
    fetchSportRadarBetfair
};

