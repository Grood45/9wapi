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
                'Authorization': 'A12A00F285BA335A09C6EF65CD509814',
                'Connection': 'keep-alive',
                'Host': 'api.betswiz.in',
                'Origin': 'https://www.betswiz.in',
                'Referer': 'https://www.betswiz.in/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'TE': 'trailers',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0'
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

async function proxyDiamondStream(eventId) {
    try {
        const streamData = await fetchDiamondStream(eventId);
        if (!streamData || !streamData.streamingUrl) {
            throw new Error("STREAM_NOT_FOUND");
        }

        const targetUrl = streamData.streamingUrl;
        console.log(`📡 [DIAMOND_PROXY] Fetching from Provider: ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Referer': 'https://www.betswiz.in/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0'
            },
            timeout: 10000
        });

        return { content: response.data, targetUrl };
    } catch (error) {
        console.error(`❌ [DIAMOND_PROXY_ERROR] Error fetching proxy stream:`, error.message);
        throw error;
    }
}

/**
 * 🛰️ TRANSPARENT HLS MANIFEST REWRITER
 * Fetches the remote .m3u8 and rewrites all segment/key links to point to our proxy.
 */
async function getProxiedM3U8(url, proxyBase) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Referer': 'https://www.betswiz.in/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0'
            },
            timeout: 10000
        });

        const content = response.data;
        const urlObj = new URL(url);
        const origin = urlObj.origin;
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

        const lines = content.split('\n');
        const rewritten = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            // Handle Tags that might contain URLs (like URI="...")
            if (trimmed.startsWith('#')) {
                return line.replace(/URI=["']([^"']+)["']/g, (match, p1) => {
                    const abs = p1.startsWith('http') ? p1 : (p1.startsWith('/') ? origin + p1 : baseUrl + p1);
                    return `URI="${proxyBase}?url=${encodeURIComponent(abs)}"`;
                });
            }

            // Handle direct links (Segments)
            const absUrl = trimmed.startsWith('http') ? trimmed : (trimmed.startsWith('/') ? origin + trimmed : baseUrl + trimmed);
            return `${proxyBase}?url=${encodeURIComponent(absUrl)}`;
        });

        return rewritten.join('\n');
    } catch (e) {
        console.error("❌ [M3U8_REWRITE_ERROR]", e.message);
        throw e;
    }
}

module.exports = { fetchDiamondStream, proxyDiamondStream, getProxiedM3U8 };
