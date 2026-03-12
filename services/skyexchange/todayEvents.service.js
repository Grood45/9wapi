const axios = require("axios");
const crypto = require("crypto");
const TodayEvent = require("../../models/TodayEvent");
const { getCookie } = require("../../controllers/auth/cookie.controller");

// Original Provider API
// Use a stable mirror that doesn't block AWS
const TODAY_EVENTS_API = "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/queryEvents";

// Server In-Memory Cache (0-ms Latency)
let todayEventsCache = [];
let lastDataHash = "";

/**
 * Creates an MD5 hash of string to quickly check for changes
 */
function generateHash(dataString) {
    return crypto.createHash("md5").update(dataString).digest("hex");
}

/**
 * Fetches Today Events, stores in memory, and syncs to MongoDB
 * using Delta Logic with dynamic timestamp.
 */
async function fetchAndCacheTodayEvents() {
    try {
        const cookie = getCookie();
        if (!cookie) {
            console.log("⚠️ SKIPPING TODAY EVENTS: Cookie not ready");
            return;
        }

        const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";
        const urlObj = new URL(TODAY_EVENTS_API);
        const origin = `${urlObj.protocol}//${urlObj.host.replace('bkqawscf.', 'www.')}`;

        const body = new URLSearchParams({
            type: "today",
            eventTs: "-1",
            marketTs: "-1",
            eventType: "-1",
            selectionTs: "-1",
            queryPass: queryPass
        }).toString();

        const res = await axios.post(TODAY_EVENTS_API, body, {
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": origin,
                "Referer": `${origin}/`,
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
                "Cookie": cookie,
                "Authorization": queryPass
            },
            timeout: 15000
        });

        // Provider returns { events: [...] } or something similar
        const eventList = res.data?.events || res.data?.onLiveEvents || res.data || [];

        if (!Array.isArray(eventList)) {
            console.log("⚠️ UNEXPECTED TODAY EVENTS RESPONSE:", JSON.stringify(res.data).substring(0, 100));
            return;
        }

        // 1. MEMORY CACHE
        todayEventsCache = eventList;

        // 2. DELTA SYNC LOGIC
        // Avoid writing to MongoDB if the list of Today matches hasn't structurally changed.
        const coreDataForHash = eventList.map(e => `${e.id}_${e.status}`);
        const currentHash = generateHash(JSON.stringify(coreDataForHash));

        if (currentHash === lastDataHash) {
            return; // No structural changes, keep Mongo DB at peace.
        }

        lastDataHash = currentHash;

        // 3. BULK DB WRITE (UPSERT)
        const operations = eventList.map(event => ({
            updateOne: {
                filter: { eventId: String(event.id) },
                update: {
                    $set: {
                        eventId: String(event.id),
                        name: event.eventName || event.name,
                        eventType: String(event.eventType),
                        marketId: String(event.marketId || ""),
                        openDate: event.openDate ? new Date(event.openDate) : new Date(),
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

        // 4. CLEANUP OLD MATCHES (If matches are removed from provider today list)
        const currentEventIds = eventList.map(e => String(e.id));
        const deleteResult = await TodayEvent.deleteMany({ eventId: { $nin: currentEventIds } });

        if (deleteResult.deletedCount > 0) {
            console.log(`🗑️ REMOVED ${deleteResult.deletedCount} STALE TODAY MATCHES FROM DB`);
        }

    } catch (e) {
        if (e.response) {
            console.log("❌ TODAY EVENTS FETCH ERROR:", e.response.status);
        } else {
            console.log("❌ TODAY EVENTS FETCH ERROR:", e.message);
        }
    }
}

function getCachedTodayEvents() {
    return todayEventsCache;
}

module.exports = {
    fetchAndCacheTodayEvents,
    getCachedTodayEvents
};
