const axios = require("axios");

// Stable 9tens API (No Cookies Required)
const LIVE_EVENTS_COUNT_API = "https://apiv2.9tens.live:5010/v1/spb/get-match-list-count?type=in_play";

// Server In-Memory Cache (Blazing Fast, No DB Load)
// Format: [ { eventType: 4, count: 8 }, { eventType: 1, count: 6 }, { eventType: 2, count: 4 } ]
let liveEventsCountCache = [];

/**
 * Fetches the live event count from 9tens API and saves it to Server RAM.
 * Runs in the background via Cron, keeping data fresh without user-driven API load.
 */
async function fetchAndCacheLiveEventsCount() {
    try {
        const res = await axios.get(LIVE_EVENTS_COUNT_API, {
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
                "Accept": "application/json, text/plain, */*"
            }
        });

        if (res.data && res.data.status === true && res.data.data) {
            const counts = res.data.data;

            // Map 9tens response to internal eventType format
            // Sport IDs: Cricket (4), Soccer (1), Tennis (2)
            const mappedData = [
                { eventType: 4, count: counts.cricketInplayCount || 0 },
                { eventType: 1, count: counts.soccerInplayCount || 0 },
                { eventType: 2, count: counts.tennisInplayCount || 0 }
            ];

            // Atomically replace memory reference
            liveEventsCountCache = mappedData;
            // console.log("✅ 9TENS LIVE COUNT UPDATED:", JSON.stringify(liveEventsCountCache));
        } else {
            console.log("⚠️ 9TENS API RESPONSE INVALID:", JSON.stringify(res.data).substring(0, 100));
        }

    } catch (e) {
        if (e.response) {
            console.log("❌ 9TENS COUNT FETCH ERROR (Status):", e.response.status);
        } else {
            console.log("❌ 9TENS COUNT FETCH ERROR (Msg):", e.message);
        }
    }
}

/**
 * Returns the blazing fast cached data. Takes 0.001ms.
 */
function getCachedLiveEventsCount() {
    return liveEventsCountCache;
}

module.exports = {
    fetchAndCacheLiveEventsCount,
    getCachedLiveEventsCount
};
