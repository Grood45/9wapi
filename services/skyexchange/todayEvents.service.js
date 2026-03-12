const axios = require("axios");
const crypto = require("crypto");
const TodayEvent = require("../../models/TodayEvent");

// 9tens Today Endpoints (No Cookies Required)
const SPORT_IDS = [4, 1, 2]; // Cricket, Soccer, Tennis
const BASE_URL = "https://apiv2.9tens.live:5010/v1/spb/get-match-list?type=today";

// Server In-Memory Cache (Blazing Fast, No DB Load)
let todayEventsCache = [];
// Hash map to check if data actually changed before touching DB
let lastDataHash = "";

/**
 * Creates an MD5 hash of string to quickly check for changes
 */
function generateHash(dataString) {
    return crypto.createHash("md5").update(dataString).digest("hex");
}

/**
 * Fetches Today Events for all sports in parallel, stores in memory instantly, 
 * and asynchronously syncs to MongoDB using Delta Logic.
 */
async function fetchAndCacheTodayEvents() {
    try {
        // 1. Parallel Fetching for all Sport IDs
        const fetchPromises = SPORT_IDS.map(id =>
            axios.get(`${BASE_URL}&game_type=${id}`, {
                timeout: 10000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0"
                }
            })
        );

        const results = await Promise.allSettled(fetchPromises);

        // 2. Aggregate Results
        let aggregatedMatches = [];
        results.forEach((result, index) => {
            if (result.status === "fulfilled" && result.value.data?.status === true) {
                const matches = result.value.data.data?.matches || [];
                aggregatedMatches = aggregatedMatches.concat(matches);
            } else {
                console.log(`⚠️ FAILED TO FETCH TODAY FOR SPORT ${SPORT_IDS[index]}:`,
                    result.reason?.message || "Invalid Response");
            }
        });

        if (aggregatedMatches.length === 0) {
            return; // Preserving cache if all requests failed
        }

        // 3. UPDATE MEMORY CACHE INSTANTLY (For 0-ms Client Responses)
        todayEventsCache = aggregatedMatches;

        // 4. DELTA SYNC LOGIC
        const coreDataForHash = aggregatedMatches.map(e => `${e.id}_${e.status}`);
        const currentHash = generateHash(JSON.stringify(coreDataForHash));

        if (currentHash === lastDataHash) {
            return; // No change, skip DB operations
        }

        lastDataHash = currentHash;

        // 5. BULK DB WRITE (UPSERT)
        const operations = aggregatedMatches.map(event => ({
            updateOne: {
                filter: { eventId: String(event.id) },
                update: {
                    $set: {
                        eventId: String(event.id),
                        name: event.name,
                        eventType: String(event.eventType),
                        marketId: String(event.market?.marketId || event.marketId || ""),
                        openDate: event.openDateTime ? new Date(event.openDateTime) : new Date(),
                        rawData: event,
                        updatedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await TodayEvent.bulkWrite(operations, { ordered: false });
        }

        // 6. CLEANUP OLD EVENTS
        const currentEventIds = aggregatedMatches.map(e => String(e.id));
        const deleteResult = await TodayEvent.deleteMany({ eventId: { $nin: currentEventIds } });

        if (deleteResult.deletedCount > 0) {
            console.log(`🗑️ REMOVED ${deleteResult.deletedCount} STALE TODAY MATCHES FROM DB`);
        }

    } catch (e) {
        console.log("❌ TODAY EVENTS SYNC ERROR:", e.message);
    }
}

/**
 * Returns the blazing fast cached data. Takes 0.001ms.
 */
function getCachedTodayEvents() {
    return todayEventsCache;
}

module.exports = {
    fetchAndCacheTodayEvents,
    getCachedTodayEvents
};
