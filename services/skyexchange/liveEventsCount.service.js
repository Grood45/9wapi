const axios = require("axios");
const { getCookie } = require("../../controllers/auth/cookie.controller");

// Original Provider API
// Use a stable mirror that doesn't block AWS
const LIVE_EVENTS_COUNT_API = "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/queryOnLiveEvents";

// Server In-Memory Cache (Blazing Fast, No DB Load)
// This will hold data like: [ { eventType: 1, count: 20 }, ... ]
let liveEventsCountCache = [];

/**
 * Fetches the live event count from the provider and saves it to Server RAM.
 * Runs in the background via Cron, keeping the Origin API safe from user load.
 */
async function fetchAndCacheLiveEventsCount() {
    try {
        const cookie = getCookie();
        if (!cookie) {
            console.log("⚠️ SKIPPING LIVE EVENTS COUNT: Cookie not ready");
            return;
        }

        // We use queryPass just like other inplay APIs for consistency if needed.
        const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";
        const urlObj = new URL(LIVE_EVENTS_COUNT_API);
        const origin = `${urlObj.protocol}//${urlObj.host.replace('bkqawscf.', 'www.')}`;

        const body = new URLSearchParams({
            queryPass: queryPass
        }).toString();

        const res = await axios.post(LIVE_EVENTS_COUNT_API, body, {
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
            timeout: 10000 // 10 seconds max wait
        });

        // Ensure data is array before caching
        if (res.data && Array.isArray(res.data.onLiveEvents)) {
            // Atomically replace memory reference for 0 downtime
            liveEventsCountCache = res.data.onLiveEvents;
            // console.log("✅ UPDATED LIVE EVENTS COUNT IN MEMORY:", liveEventsCountCache.length, "sports");
        } else {
            console.log("⚠️ UNEXPECTED LIVE EVENTS COUNT RESPONSE:", JSON.stringify(res.data).substring(0, 100));
        }

    } catch (e) {
        if (e.response) {
            console.log("❌ LIVE EVENTS COUNT FETCH ERROR:", e.response.status);
        } else {
            console.log("❌ LIVE EVENTS COUNT FETCH ERROR:", e.message);
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
