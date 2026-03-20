const axios = require("axios");

const BASE_URL_INPLAY = "https://central.zplay1.in/pb/api/v1/events/matches/inplay";
const BASE_URL_SPORTS = "https://zplay1.in/sports/api/v1/sports/management/getSport";
const BASE_URL_EVENTS = "https://zplay1.in/pb/api/v1/events/matches"; // Will append /:sportId
const BASE_URL_DETAILS = "https://zplay1.in/pb/api/v1/events/matchDetails"; // Will append /:matchId

/**
 * ⚡ 20-Year Specialist Strategy: RAM-Matrix Architecture.
 */
let gmanInplayCache = null;
let gmanSportsCache = null;
const gmanSportEventsCache = new Map(); // Key: sportId, Value: data
const gmanMatchDetailsCache = new Map(); // Key: matchId, Value: { data, lastRequested }
const gmanActiveMatches = new Set(); // Currently tracked for background polling

const GMAN_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Origin": "https://www.gamewinbuzz.com",
    "Referer": "https://www.gamewinbuzz.com/"
};

/**
 * 🚀 High-Speed Inplay Data Fetcher
 */
async function fetchGmanInplay() {
    return gmanInplayCache;
}

/**
 * 🚀 High-Speed Sports Data Fetcher
 */
async function fetchGmanSports() {
    return gmanSportsCache;
}

/**
 * 🚀 High-Speed Sport-wise Events Fetcher
 */
async function fetchGmanEventsBySport(sportId) {
    return gmanSportEventsCache.get(sportId.toString());
}

/**
 * 🚀 High-Speed Match Details Fetcher
 * Marks match as "Active" for high-velocity background sync.
 */
async function fetchGmanMatchDetails(matchId) {
    const mId = matchId.toString();
    
    // Mark as active and update last requested timestamp
    gmanActiveMatches.add(mId);
    if (!gmanMatchDetailsCache.has(mId)) {
        gmanMatchDetailsCache.set(mId, { data: null, lastRequested: Date.now() });
    } else {
        gmanMatchDetailsCache.get(mId).lastRequested = Date.now();
    }

    return gmanMatchDetailsCache.get(mId)?.data;
}

/**
 * 🔄 Background Worker: Inplay Sync
 */
async function syncGmanInplayToMemory() {
    try {
        const res = await axios.get(BASE_URL_INPLAY, {
            headers: GMAN_HEADERS,
            timeout: 5000
        });

        if (res.data) {
            gmanInplayCache = res.data;
            return true;
        }
    } catch (e) {}
    return false;
}

/**
 * 🔄 Background Worker: Sports Sync
 */
async function syncGmanSportsToMemory() {
    try {
        const res = await axios.get(BASE_URL_SPORTS, {
            headers: GMAN_HEADERS,
            timeout: 8000
        });

        if (res.data) {
            gmanSportsCache = res.data;
            return true;
        }
    } catch (e) {}
    return false;
}

/**
 * 🔄 Background Worker: Sport-wise Events Sync
 */
async function syncGmanEventsBySportToMemory(sportId) {
    try {
        const url = `${BASE_URL_EVENTS}/${sportId}`;
        const res = await axios.get(url, {
            headers: GMAN_HEADERS,
            timeout: 8000
        });

        if (res.data) {
            gmanSportEventsCache.set(sportId.toString(), res.data);
            return true;
        }
    } catch (e) {}
    return false;
}

/**
 * 🔄 Background Worker: Match Details Sync
 */
async function syncGmanMatchDetailToMemory(matchId) {
    try {
        const url = `${BASE_URL_DETAILS}/${matchId}`;
        const res = await axios.get(url, {
            headers: GMAN_HEADERS,
            timeout: 5000
        });

        if (res.data) {
            const entry = gmanMatchDetailsCache.get(matchId.toString()) || { lastRequested: Date.now() };
            entry.data = res.data;
            gmanMatchDetailsCache.set(matchId.toString(), entry);
            return true;
        }
    } catch (e) {}
    return false;
}

/**
 * 🛠️ Maintenance: Clean up inactive matches
 */
function cleanupGmanActiveMatches() {
    const now = Date.now();
    for (const matchId of gmanActiveMatches) {
        const entry = gmanMatchDetailsCache.get(matchId);
        if (!entry || (now - entry.lastRequested > 60000)) { // 60 seconds inactivity
            gmanActiveMatches.delete(matchId);
            // gmanMatchDetailsCache.delete(matchId); // Optional: Keep data in RAM or purge
        }
    }
}

module.exports = {
    fetchGmanInplay,
    fetchGmanSports,
    fetchGmanEventsBySport,
    fetchGmanMatchDetails,
    syncGmanInplayToMemory,
    syncGmanSportsToMemory,
    syncGmanEventsBySportToMemory,
    syncGmanMatchDetailToMemory,
    cleanupGmanActiveMatches,
    gmanActiveMatches
};
