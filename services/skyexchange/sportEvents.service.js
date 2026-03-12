const axios = require("axios");
const SportEvent = require("../../models/SportEvent");

// 9tens v3 API (Consolidated Sport-wise Listing, No Cookies)
const BASE_URL = "https://apiv2.9tens.live:5010/v1/spb/get-match-list?version=v3";

// Server In-Memory Map Cache
// Key = sportId (e.g., "4"), Value = Array of Match Objects
const sportEventsCache = new Map();

/**
 * Fetches events for a specific sportID from 9tens and updates the local cache.
 * 9tens v3 returns all available matches in a single response (no pagination required).
 */
async function fetchAndCacheSportEvents(sportId) {
    try {
        const url = `${BASE_URL}&game_type=${sportId}`;
        const res = await axios.get(url, {
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0"
            }
        });

        if (res.data && res.data.status === true && res.data.data) {
            const matches = res.data.data.matches || [];

            // 1. Update Memory Cache instantly
            sportEventsCache.set(String(sportId), matches);

            // 2. Perform Bulk Upsert to MongoDB to keep Match metadata fresh
            if (matches.length > 0) {
                const operations = matches.map(event => ({
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

                await SportEvent.bulkWrite(operations, { ordered: false });
                // console.log(`✅ SYNCED ${matches.length} EVENTS FOR SPORT ${sportId}`);
            }
        } else {
            console.log(`⚠️ 9TENS SPORT API INVALID RESPONSE (ID ${sportId}):`, JSON.stringify(res.data).substring(0, 100));
        }

    } catch (e) {
        console.log(`❌ 9TENS SPORT API ERROR (ID ${sportId}):`, e.message);
    }
}

/**
 * Returns the cached events from RAM.
 */
function getCachedEventsBySport(sportId) {
    return sportEventsCache.get(String(sportId)) || [];
}

module.exports = {
    fetchAndCacheSportEvents,
    getCachedEventsBySport
};
