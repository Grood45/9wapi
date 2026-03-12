const axios = require("axios");
const SportEvent = require("../../models/SportEvent");
const { getCookie } = require("../../controllers/auth/cookie.controller");

const API_URL = "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/queryEventsWithMarket";

// ⚡ 20-Year Exp Strategy: Dynamic Map Cache
// Key = sportId, Value = Array of events
const sportEventsCache = new Map();

/**
 * Fetch ALL events for a specific sport using recursive pagination (pageNumber).
 * 20-Year Exp Strategy: Auto-paginating crawler that stops when no more data is found.
 */
async function fetchAndCacheSportEvents(sportId) {
    try {
        const cookie = getCookie();
        if (!cookie) return;

        const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";
        let allMergedEvents = [];
        let pageNumber = 1;
        let hasMoreData = true;
        const MAX_PAGES = 10; // Safety guard to prevent infinite loops

        while (hasMoreData && pageNumber <= MAX_PAGES) {
            const body = new URLSearchParams({
                eventType: String(sportId),
                pageNumber: String(pageNumber),
                eventTs: "-1",
                marketTs: "-1",
                selectionTs: "-1",
                queryPass: queryPass
            }).toString();

            const urlObj = new URL(API_URL);
            const origin = `${urlObj.protocol}//${urlObj.host.replace('bkqawscf.', 'www.')}`;

            const res = await axios.post(API_URL, body, {
                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Origin": origin,
                    "Referer": `${origin}/`,
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
                    "X-Requested-With": "XMLHttpRequest",
                    "Cookie": cookie,
                    "Host": urlObj.host
                },
                timeout: 10000
            });

            const eventList = res.data?.events || [];

            if (Array.isArray(eventList) && eventList.length > 0) {
                allMergedEvents = [...allMergedEvents, ...eventList];
                pageNumber++; // Move to next page
            } else {
                hasMoreData = false; // Stop crawling
            }
        }

        // Update Memory Cache
        sportEventsCache.set(String(sportId), allMergedEvents);

        // ⚡ Bulk Upsert match info to central DB Event Store
        if (allMergedEvents.length > 0) {
            const operations = allMergedEvents.map(event => ({
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
            await SportEvent.bulkWrite(operations, { ordered: false });
        }

    } catch (e) {
        console.log(`❌ PAGINATED SPORT API ERROR (ID ${sportId}):`, e.message);
    }
}

function getCachedEventsBySport(sportId) {
    return sportEventsCache.get(String(sportId)) || [];
}

module.exports = {
    fetchAndCacheSportEvents,
    getCachedEventsBySport
};
