const axios = require("axios");
const crypto = require("crypto");
const Event = require("../../models/Event");
const { getCookie } = require("../../controllers/auth/cookie.controller");
const { fetchStream } = require("./stream.service");

// User's preferred Skyexchange API
const INPLAY_API = "https://bxawscf.skyinplay.com/exchange/member/playerService/queryEvents";

// Server In-Memory Cache for 0-ms UI response
let inplayEventsCache = [];
let lastDataHash = "";

/**
 * Creates an MD5 hash of string to quickly check for changes
 */
function generateHash(dataString) {
    return crypto.createHash("md5").update(dataString).digest("hex");
}

/**
 * Fetches In-play Events from Skyexchange, updates memory cache, 
 * and syncs to MongoDB using Delta Logic.
 */
async function fetchAndCacheInplayEvents() {
    try {
        const cookie = getCookie();
        if (!cookie) {
            console.log("⚠️ SKIPPING IN-PLAY FETCH: Cookie not ready");
            return;
        }

        // Extract JSESSIONID value for queryPass
        const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";

        const body = new URLSearchParams({
            type: "inplay",
            eventType: "-1",
            eventTs: "-1",
            marketTs: "-1",
            selectionTs: "-1",
            collectEventIds: "",
            queryPass: queryPass
        }).toString();

        const res = await axios.post(INPLAY_API, body, {
            headers: {
                "Host": "bxawscf.skyinplay.com",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": "https://bxawscf.skyinplay.com",
                "Referer": "https://bxawscf.skyinplay.com/exchange/member/inplay",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "X-Requested-With": "XMLHttpRequest",
                "Cookie": cookie
            },
            timeout: 20000
        });

        const eventList = res.data?.events || [];

        if (!Array.isArray(eventList)) {
            console.log("⚠️ UNEXPECTED IN-PLAY RESPONSE:", JSON.stringify(res.data).substring(0, 200));
            return;
        }

        // Update Memory Cache instantly
        inplayEventsCache = eventList;

        if (eventList.length === 0) {
            // console.log("ℹ️ NO IN-PLAY EVENTS FOUND");
            return;
        }

        // Delta Sync: Only update DB if core data changed
        const coreDataForHash = eventList.map(e => `${e.id}_${e.status}`);
        const currentHash = generateHash(JSON.stringify(coreDataForHash));

        if (currentHash === lastDataHash) {
            return;
        }
        lastDataHash = currentHash;

        // Bulk Upsert to MongoDB
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
            await Event.bulkWrite(operations, { ordered: false });
        }

        // Remove Ended matches
        const currentEventIds = eventList.map(e => String(e.id));
        await Event.deleteMany({ eventId: { $nin: currentEventIds } });

    } catch (e) {
        if (e.response) {
            console.log("❌ IN-PLAY FETCH ERROR (Status):", e.response.status);
        } else {
            console.log("❌ IN-PLAY FETCH ERROR:", e.message);
        }
    }
}

/**
 * Periodic Stream URL Updater (Runs in background)
 */
async function updateLiveStreams() {
    try {
        const events = await Event.find({ "rawData.streamingChannel": { $exists: true, $ne: "0" } });

        if (events.length === 0) return;

        // console.log(`🔄 UPDATING STREAMS FOR ${events.length} EVENTS...`);

        for (const event of events) {
            try {
                const streamData = await fetchStream(event.eventId, true);

                if (streamData) {
                    await Event.updateOne(
                        { eventId: event.eventId },
                        {
                            $set: {
                                streamUrl: streamData.url || streamData.streamingUrl || null,
                                "rawData.streamData": streamData,
                                updatedAt: new Date()
                            }
                        }
                    );
                }
            } catch (err) {
                // Silently skip update errors for individual matches
            }
        }
    } catch (e) {
        console.error("❌ ERROR IN updateLiveStreams:", e.message);
    }
}

/**
 * Returns the cached data.
 */
function getCachedInplayEvents() {
    return inplayEventsCache;
}

module.exports = {
    fetchAndCacheInplayEvents,
    updateLiveStreams,
    getCachedInplayEvents
};
