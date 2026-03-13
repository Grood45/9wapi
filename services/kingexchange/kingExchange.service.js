const axios = require("axios");
const KingSport = require("../../models/KingSport");
const KingResult = require("../../models/KingResult");

// KingExchange API Config
const ALL_EVENTS_API = "https://playsport09.com/api/exchange/market/matchodds/allEventsList";
const EVENT_RESULTS_API = "https://playsport09.com/api/exchange/results/getMarketEventResults";

/**
 * ⚡ 30-Year Expert Standard: Centralized Sync Hub
 * - Zero Latency (RAM First)
 * - Anti-Blocking (Background Queue)
 * - Intelligent Lifecycle (24h Retention)
 */

let eventsCache = { data: {}, lastUpdate: 0 };
let resultsCache = new Map(); // eventId -> Array of results

/**
 * Discovery Task: Fetches all events and warms the RAM cache.
 * Runs every 4 minutes (Pulse).
 */
async function syncKingEvents() {
    try {
        console.log("🔄 KX PULSE: Syncing all events...");
        const res = await axios.post(ALL_EVENTS_API, { "key": "2" }, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0"
            },
            timeout: 10000
        });

        if (res.data && res.data.data) {
            eventsCache.data = res.data;
            eventsCache.lastUpdate = Date.now();
            console.log(`✅ KX PULSE: Captured ${Object.keys(res.data.data).length} sports categories.`);
            return res.data;
        }
    } catch (e) {
        console.error("❌ KX PULSE ERROR:", e.message);
    }
    return null;
}

/**
 * Live Sync Task: Fetches results for active/upcoming events.
 * Runs every 15 seconds.
 */
async function syncKingResults() {
    try {
        if (!eventsCache.data.data) return;

        const now = Date.now();
        const activeEvents = [];

        // Identify events starting in < 20 mins or in-play
        Object.values(eventsCache.data.data).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(event => {
                    const eventTime = new Date(event.eventTime).getTime();
                    const diffMins = (eventTime - now) / 60000;

                    if (event.oddsData?.inPlay || (diffMins > -120 && diffMins < 20)) {
                        activeEvents.push(event.exEventId);
                    }
                });
            }
        });

        if (activeEvents.length === 0) return;

        console.log(`📡 KX LIVE SYNC: Tracking ${activeEvents.length} active events...`);

        for (const eventId of activeEvents) {
            try {
                const res = await axios.post(EVENT_RESULTS_API, { eventId }, {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0"
                    }
                });

                if (res.data && res.data.data && res.data.data.length > 0) {
                    // Update RAM Cache
                    resultsCache.set(eventId, res.data.data);

                    // Batch Upsert to MongoDB (Persistence)
                    const operations = res.data.data.map(item => ({
                        updateOne: {
                            filter: { marketId: item.marketId },
                            update: {
                                $set: {
                                    ...item,
                                    lastSeen: new Date() // Internal timestamp for cleanup
                                }
                            },
                            upsert: true
                        }
                    }));
                    await KingResult.bulkWrite(operations);
                }
            } catch (err) {
                console.error(`⚠️ KX SYNC ERROR [Event: ${eventId}]:`, err.message);
            }
            // Throttling to prevent provider spam
            await new Promise(r => setTimeout(r, 200));
        }

    } catch (e) {
        console.error("❌ KX LIVE SYNC GLOBAL ERROR:", e.message);
    }
}

/**
 * Cleanup Task: Removes market results older than 24 hours 
 * if they are no longer in the active discovery list.
 */
async function cleanupOldResults() {
    try {
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeEventIds = [];
        
        if (eventsCache.data.data) {
            Object.values(eventsCache.data.data).forEach(cat => {
                if (Array.isArray(cat)) cat.forEach(e => activeEventIds.push(e.exEventId));
            });
        }

        const result = await KingResult.deleteMany({
            lastSeen: { $lt: threshold },
            eventId: { $nin: activeEventIds }
        });

        if (result.deletedCount > 0) {
            console.log(`🧹 KX CLEANUP: Purged ${result.deletedCount} old records.`);
        }
    } catch (e) {
        console.error("❌ KX CLEANUP ERROR:", e.message);
    }
}

/**
 * RAM-First Accessors
 */
function getEvents() {
    return eventsCache.data;
}

async function getResults(eventId) {
    // 1. Try RAM
    if (resultsCache.has(eventId)) {
        return { data: resultsCache.get(eventId), source: 'cache' };
    }

    // 2. Try MongoDB (Fallback for historical/just settled)
    const dbResults = await KingResult.find({ eventId }).lean();
    if (dbResults && dbResults.length > 0) {
        // Strip internal fields
        const cleanResults = dbResults.map(item => {
            const { lastSeen, ...original } = item;
            return original;
        });
        return { data: cleanResults, source: 'database' };
    }

    return { data: [], source: 'not_found' };
}

module.exports = {
    syncKingEvents,
    syncKingResults,
    cleanupOldResults,
    getEvents,
    getResults
};
