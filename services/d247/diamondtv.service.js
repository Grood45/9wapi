const axios = require("axios");

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Fast Cache: Store URLs for 30s to prevent redundant API hits.
 * 2. Spoofing: Precisely mirror the browser behavior (Referer, Origin, Auth).
 * 3. Delta-Logic: Only refresh if needed.
 */

const CACHE = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds for streaming URLs

async function fetchDiamondStream(eventId) {
    const now = Date.now();
    
    // 1. Check Cache
    if (CACHE.has(eventId)) {
        const { url, expiry } = CACHE.get(eventId);
        if (now < expiry) {
            console.log(`🚀 [CACHE_HIT] DiamondTV: ${eventId}`);
            return url;
        }
    }

    try {
        console.log(`📡 [DIAMOND_FETCH] Requesting Betswiz for Event: ${eventId}`);
        
        const response = await axios.get(`https://api.betswiz.in/api/get_live_tv_url/${eventId}`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Authorization': '728BE2AC7246B7E8B84F2671039E7E58',
                'Connection': 'keep-alive',
                'Host': 'api.betswiz.in',
                'Origin': 'https://www.betswiz.in',
                'Referer': 'https://www.betswiz.in/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'TE': 'trailers',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0'
            },
            timeout: 8000
        });

        const data = response.data;
        const streamingUrl = data.streamingUrl;
        const m3u8Url = data.link; // This is the direct HLS stream

        if (!streamingUrl && !m3u8Url) {
            console.log(`⚠️ [DIAMOND_EMPTY] No stream found for ${eventId}`);
            return null;
        }

        const result = { streamingUrl, m3u8Url };

        // 2. Update Cache
        CACHE.set(eventId, {
            url: result,
            expiry: now + CACHE_TTL
        });

        console.log(`✅ [DIAMOND_SUCCESS] Obtained URLs for ${eventId}`);
        return result;

    } catch (error) {
        console.error(`❌ [DIAMOND_ERROR] Failed to fetch stream for ${eventId}:`, error.message);
        throw new Error("PROVIDER_DOWN");
    }
}

module.exports = { fetchDiamondStream };
