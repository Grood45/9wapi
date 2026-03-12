const axios = require("axios");
const { getCookie } = require("../../controllers/auth/cookie.controller");

const API_URL = "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/queryFullMarkets";

/**
 * ⚡ 20-Year Exp Strategy: On-Demand Throttled Full Markets.
 * Follows the same pattern as Sportsbook, Fancy, and Bookmaker for stability.
 */
const activeFullMarketsCache = new Map();
const fetchLocks = new Map();

async function fetchFullMarkets(eventId, marketId = "") {
    try {
        const now = Date.now();
        const cacheKey = `${eventId}_${marketId}`;
        const cached = activeFullMarketsCache.get(cacheKey);

        // 1. Return Cache if data is less than 1.5 seconds old
        if (cached && (now - cached.lastFetched) < 1500) {
            return cached.data;
        }

        // 2. Concurrency Lock
        if (fetchLocks.has(cacheKey)) {
            return fetchLocks.get(cacheKey);
        }

        // 3. Perform Fetch
        const fetchPromise = (async () => {
            try {
                const cookie = getCookie();
                if (!cookie) throw new Error("COOKIE_NOT_SET");

                const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";
                const urlObj = new URL(API_URL);
                const origin = `${urlObj.protocol}//${urlObj.host.replace('bkqawscf.', 'www.')}`;

                const params = {
                    eventId: String(eventId),
                    queryPass: queryPass
                };
                if (marketId) params.marketId = String(marketId);

                const body = new URLSearchParams(params).toString();

                const res = await axios.post(API_URL, body, {
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "Accept-Encoding": "gzip, deflate, br, zstd",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Authorization": queryPass,
                        "Connection": "keep-alive",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Cookie": cookie,
                        "Origin": "https://www.gu21go76.xyz",
                        "Referer": "https://www.gu21go76.xyz/",
                        "source": "1",
                        "Sec-Fetch-Dest": "empty",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Site": "same-site",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0"
                    },
                    timeout: 8000
                });

                const data = res.data;
                activeFullMarketsCache.set(cacheKey, { data, lastFetched: Date.now() });
                return data;

            } finally {
                fetchLocks.delete(cacheKey);
            }
        })();

        fetchLocks.set(cacheKey, fetchPromise);
        return fetchPromise;

    } catch (e) {
        if (e.response) {
            console.log(`❌ FULL MARKETS ERROR (${eventId}): Status ${e.response.status}, Data:`, JSON.stringify(e.response.data));
        } else {
            console.log(`❌ FULL MARKETS ERROR (${eventId}):`, e.message);
        }
        return null;
    }
}

module.exports = {
    fetchFullMarkets
};
