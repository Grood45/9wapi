const axios = require("axios");
const { getCookie } = require("../../controllers/auth/cookie.controller");

const API_URL = "https://bxawscf.skyinplay.com/exchange/member/playerService/queryOcerMenu";

/**
 * ⚡ 20-Year Exp Strategy: On-Demand Throttled Market List Discovery.
 */
const otherMenuCache = new Map();
const fetchLocks = new Map();

async function fetchOtherMenu(sportId, eventId) {
    try {
        const now = Date.now();
        const cacheKey = `${sportId}_${eventId}`;
        const cached = otherMenuCache.get(cacheKey);

        // 1. Return Cache if data is less than 5 minutes old (Menu discovery doesn't change every second)
        if (cached && (now - cached.lastFetched) < 300000) {
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

                const body = new URLSearchParams({
                    eventType: String(sportId),
                    eventId: String(eventId),
                    queryPass: queryPass
                }).toString();

                const res = await axios.post(API_URL, body, {
                    headers: {
                        "Host": "bxawscf.skyinplay.com",
                        "Accept": "application/json, text/javascript, */*; q=0.01",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Connection": "keep-alive",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Origin": "https://bxawscf.skyinplay.com",
                        "Referer": "https://bxawscf.skyinplay.com/",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
                        "X-Requested-With": "XMLHttpRequest",
                        "Cookie": cookie
                    },
                    timeout: 8000
                });

                const data = res.data;
                otherMenuCache.set(cacheKey, { data, lastFetched: Date.now() });
                return data;

            } finally {
                fetchLocks.delete(cacheKey);
            }
        })();

        fetchLocks.set(cacheKey, fetchPromise);
        return fetchPromise;

    } catch (e) {
        console.log(`❌ OTHER MENU ERROR (${eventId}):`, e.message);
        return null;
    }
}

module.exports = {
    fetchOtherMenu
};
