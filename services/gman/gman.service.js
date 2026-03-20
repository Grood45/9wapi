const axios = require("axios");
const http = require('http');
const https = require('https');

// ⚡ 20-Year Specialist Strategy: Connection Pooling
// Reuse TCP connections to save handshakes and improve performance.
const gmanClient = axios.create({
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 10 }),
    timeout: 8000
});

const BASE_URL_INPLAY = "https://central.zplay1.in/pb/api/v1/events/matches/inplay";
const BASE_URL_SPORTS = "https://zplay1.in/sports/api/v1/sports/management/getSport";
const BASE_URL_EVENTS = "https://zplay1.in/pb/api/v1/events/matches"; 
const BASE_URL_DETAILS = "https://zplay1.in/pb/api/v1/events/matchDetails"; 

/**
 * ⚡ Specialist Cache & State
 */
let gmanInplayCache = null;
let gmanSportsCache = null;
const gmanSportEventsCache = new Map();
const gmanMatchDetailsCache = new Map();
const gmanActiveMatches = new Set();
const MAX_TRACKED_MATCHES = 100; // ⚡ Specialist RAM Management: Prevent memory bloat
const gmanCircuitOpen = { state: false, until: 0 }; 
const gmanSyncInFlight = new Set(); 

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
    if (!gmanActiveMatches.has(mId) && gmanActiveMatches.size >= MAX_TRACKED_MATCHES) {
        // Drop oldest match from tracker if full to save RAM
        const firstMatch = gmanActiveMatches.values().next().value;
        gmanActiveMatches.delete(firstMatch);
    }

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
/**
 * 🔄 Background Worker: Universal Tracker
 */
async function syncGmanData(url, targetCache, key = null) {
    // 1️⃣ Circuit Breaker Check
    if (gmanCircuitOpen.state && Date.now() < gmanCircuitOpen.until) return false;
    if (gmanCircuitOpen.state) gmanCircuitOpen.state = false;

    // 2️⃣ Concurrency Lock
    const lockId = key || url;
    if (gmanSyncInFlight.has(lockId)) return false;
    gmanSyncInFlight.add(lockId);

    try {
        const res = await gmanClient.get(url, { headers: GMAN_HEADERS });
        if (res.data) {
            if (key) {
                const entry = targetCache.get(key) || { lastRequested: Date.now() };
                entry.data = res.data;
                targetCache.set(key, entry);
            } else {
                // Root cache update
                if (url === BASE_URL_INPLAY) gmanInplayCache = res.data;
                if (url === BASE_URL_SPORTS) gmanSportsCache = res.data;
            }
            return true;
        }
    } catch (e) {
        // 3️⃣ Trip Circuit on 429 (Rate Limit) or 503 (Server Overload)
        if (e.response?.status === 429 || e.response?.status === 503) {
            gmanCircuitOpen.state = true;
            gmanCircuitOpen.until = Date.now() + 60000; // Cool off for 1 minute
        }
    } finally {
        gmanSyncInFlight.delete(lockId);
    }
    return false;
}

async function syncGmanInplayToMemory() {
    return syncGmanData(BASE_URL_INPLAY);
}

async function syncGmanSportsToMemory() {
    return syncGmanData(BASE_URL_SPORTS);
}

async function syncGmanEventsBySportToMemory(sportId) {
    const sId = sportId.toString();
    const url = `${BASE_URL_EVENTS}/${sId}`;
    return syncGmanData(url, gmanSportEventsCache, sId);
}

async function syncGmanMatchDetailToMemory(matchId) {
    const mId = matchId.toString();
    const url = `${BASE_URL_DETAILS}/${mId}`;
    return syncGmanData(url, gmanMatchDetailsCache, mId);
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
