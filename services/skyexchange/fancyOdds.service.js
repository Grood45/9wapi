const axios = require("axios");
const { getCookie } = require("../../controllers/auth/cookie.controller");

const API_URL = "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/queryFancyBetMarkets";

/**
 * ⚡ 20-Year Exp Strategy: On-Demand Throttled Fancy Odds
 * Merged with Sportsbook logic for consistency.
 */
const activeFancyCache = new Map();
const fetchLocks = new Map();

async function fetchFancyOdds(eventId) {
    try {
        const now = Date.now();
        const cached = activeFancyCache.get(eventId);

        // 1. Return Cache if data is less than 1.5 seconds old
        if (cached && (now - cached.lastFetched) < 1500) {
            return cached.data;
        }

        // 2. Concurrency Lock
        if (fetchLocks.has(eventId)) {
            return fetchLocks.get(eventId);
        }

        // 3. Perform Fetch
        const fetchPromise = (async () => {
            try {
                const cookie = getCookie();
                if (!cookie) throw new Error("COOKIE_NOT_SET");

                const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";
                const urlObj = new URL(API_URL);
                const origin = `${urlObj.protocol}//${urlObj.host.replace('bkqawscf.', 'www.')}`;

                const body = new URLSearchParams({
                    eventId: String(eventId),
                    queryPass: queryPass
                }).toString();

                const res = await axios.post(API_URL, body, {
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Origin": origin,
                        "Referer": `${origin}/`,
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
                        "Cookie": cookie,
                        "Authorization": queryPass
                    },
                    timeout: 8000
                });

                const data = res.data;
                activeFancyCache.set(eventId, { data, lastFetched: Date.now() });
                return data;

            } finally {
                fetchLocks.delete(eventId);
            }
        })();

        fetchLocks.set(eventId, fetchPromise);
        return fetchPromise;

    } catch (e) {
        console.log(`❌ FANCY ODDS ERROR (${eventId}):`, e.message);
        return null;
    }
}

module.exports = {
    fetchFancyOdds
};
