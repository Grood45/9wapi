const axios = require("axios");
const KingSport = require("../../models/KingSport");

// KingExchange API URL
const KING_SPORTS_API = "https://playsport09.com/api/exchange/sports/sportsList";

/**
 * ⚡ 20-Year Exp Strategy: Persistent Static Cache
 * Since the sports list is static, we cache it in RAM and MongoDB.
 * We fetch from the provider ONLY once if the database is empty.
 */
let kingSportsCache = null;

/**
 * Fetches and caches the KingExchange sports list.
 * 1. Checks RAM Cache.
 * 2. Checks MongoDB.
 * 3. Fetches from Provider (POST, empty body).
 */
async function fetchAndCacheKingSports() {
    try {
        // 1. Return RAM cache if already loaded
        if (kingSportsCache) return kingSportsCache;

        // 2. Try loading from MongoDB
        const dbSports = await KingSport.find().sort({ sequence: 1 }).lean();
        if (dbSports && dbSports.length > 0) {
            // Reconstruct the exact original structure from saved rawData
            kingSportsCache = {
                data: dbSports.map(s => s.rawData || {
                    sportId: s.sportId,
                    sportName: s.name,
                    status: true
                }),
                meta: {
                    message: "sports.",
                    status_code: 200,
                    status: true
                }
            };
            console.log("✅ KINGEXCHANGE: Loaded and reconstructed sports from MongoDB");
            return kingSportsCache;
        }

        // 3. Fetch from Provider (One-time hit)
        console.log("🌐 KINGEXCHANGE: Fetching fresh sports list from provider...");
        const res = await axios.post(KING_SPORTS_API, {}, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0"
            },
            timeout: 10000
        });

        if (res.data && (Array.isArray(res.data.data) || Array.isArray(res.data))) {
            const sports = Array.isArray(res.data.data) ? res.data.data : res.data;

            // Save to MongoDB for future reloads
            const operations = sports.map(sport => ({
                updateOne: {
                    filter: { sportId: String(sport.sportId) },
                    update: {
                        $set: {
                            sportId: String(sport.sportId),
                            name: sport.sportName || sport.name || "Unknown",
                            rawData: sport,
                            updatedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));

            if (operations.length > 0) {
                await KingSport.bulkWrite(operations);
            }

            // Return the EXACT original structure as requested
            kingSportsCache = res.data;
            console.log("✅ KINGEXCHANGE: Cached results and saved original structure");
            return kingSportsCache;
        } else {
            console.log("⚠️ KINGEXCHANGE: Provider returned unexpected format", JSON.stringify(res.data).substring(0, 100));
            return null;
        }

    } catch (e) {
        console.log("❌ KINGEXCHANGE FETCH ERROR:", e.message);
        return null;
    }
}

/**
 * Returns the cached sports list from RAM.
 */
function getCachedKingSports() {
    return kingSportsCache;
}

module.exports = {
    fetchAndCacheKingSports,
    getCachedKingSports
};
