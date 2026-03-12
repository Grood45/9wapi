const axios = require("axios");
const crypto = require("crypto");
const Event = require("../../models/Event");
const { getCookie } = require("../../controllers/auth/cookie.controller");

// Original Provider API
// Use a stable mirror that doesn't block AWS
const INPLAY_EVENTS_API = "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/queryEvents";

// Server In-Memory Cache (Blazing Fast, No DB Load)
let inplayEventsCache = [];
// Hash map to check if data actually changed before touching DB
let lastDataHash = "";

/**
 * Creates an MD5 hash of string to quickly check for changes
 */
function generateHash(dataString) {
    return crypto.createHash("md5").update(dataString).digest("hex");
}

/**
 * Fetches Inplay Events, stores in memory instantly, and asynchronously syncs to MongoDB 
 * using Delta Logic (only touches DB if matches added/removed/changed).
 */
async function fetchAndCacheInplayEvents() {
    try {
        const cookie = getCookie();
        if (!cookie) {
            console.log("⚠️ SKIPPING INPLAY EVENTS: Cookie not ready");
            return;
        }

        const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";
        const urlObj = new URL(INPLAY_EVENTS_API);
        const origin = `${urlObj.protocol}//${urlObj.host.replace('bkqawscf.', 'www.')}`;

        const body = new URLSearchParams({
            type: "inplay",
            eventType: "-1",
            eventTs: "-1",
            marketTs: "-1",
            selectionTs: "-1",
            collectEventIds: "",
            queryPass: queryPass
        }).toString();

        const res = await axios.post(INPLAY_EVENTS_API, body, {
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

        // Provider returns { events: [...] }
        const eventList = res.data?.events || [];

        if (!Array.isArray(eventList)) {
            console.log("⚠️ UNEXPECTED INPLAY EVENTS RESPONSE:", JSON.stringify(res.data).substring(0, 100));
            return;
        }

        // 1. UPDATE MEMORY CACHE INSTANTLY (For 0-ms Client Responses)
        inplayEventsCache = eventList;

        // 2. DELTA SYNC LOGIC (The 20-Year Exp Developer Approach)
        // Check if the exact same list of events was fetched last time. 
        // If nothing changed (no runs updated here, just match lists), skip dragging MongoDB.

        // Simplifying the list for hash to see if any core data changed (id, name, marketId, etc)
        const coreDataForHash = eventList.map(e => `${e.id}_${e.marketId}_${e.status}`);
        const currentHash = generateHash(JSON.stringify(coreDataForHash));

        if (currentHash === lastDataHash) {
            // Data hasn't logically changed. DB is already synced. Do nothing.
            // console.log("⏭️ INPLAY EVENTS SYNC SKIPPED (No change detected)");
            return;
        }

        // --- Data has changed! Proceed to sync with MongoDB ---
        lastDataHash = currentHash; // Update hash tracker

        // 3. BULK DB WRITE (UPSERT)
        // This stores/updates Match names, IDs so Market/Fancy APIs can find the "Match Name" later
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
                        rawData: event, // Keep raw data just in case
                        updatedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Event.bulkWrite(operations, { ordered: false });
            // console.log(`✅ SYNCED ${operations.length} EVENTS TO MONGODB`);
        }

        // 4. CLEANUP OLD EVENTS (Matches that ended and are no longer in the provider's Inplay list)
        const currentEventIds = eventList.map(e => String(e.id));
        // Delete any events from DB that are currently NOT in the fresh Inplay list.
        const deleteResult = await Event.deleteMany({ eventId: { $nin: currentEventIds } });

        if (deleteResult.deletedCount > 0) {
            console.log(`🗑️ REMOVED ${deleteResult.deletedCount} ENDED MATCHES FROM DB`);
        }

    } catch (e) {
        if (e.response) {
            console.log("❌ INPLAY EVENTS FETCH ERROR:", e.response.status);
        } else {
            console.log("❌ INPLAY EVENTS FETCH ERROR:", e.message);
        }
    }
}

/**
 * Returns the blazing fast cached data. Takes 0.001ms.
 */
function getCachedInplayEvents() {
    return inplayEventsCache;
}

module.exports = {
    fetchAndCacheInplayEvents,
    getCachedInplayEvents
};
