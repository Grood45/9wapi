const axios = require("axios");

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Fast Cache: Store URLs for 30s to prevent redundant API hits.
 * 2. Spoofing: Precisely mirror the browser behavior (Referer, Origin, Cookie).
 * 3. Token-Aware: Ensure the provider's session (g_token) is correctly handled.
 */

const CACHE = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds for streaming URLs

async function fetchD267Stream(eventId, userIp = '127.0.0.1') {
    const now = Date.now();
    
    // 1. Check Cache
    if (CACHE.has(eventId)) {
        const { url, expiry } = CACHE.get(eventId);
        if (now < expiry) {
            console.log(`🚀 [CACHE_HIT] D267TV: ${eventId}`);
            return url;
        }
    }

    try {
        console.log(`📡 [D267_FETCH] Requesting D247 for Event: ${eventId} with User IP: ${userIp}`);
        
        // 🛡️ Spoofing the exact headers from the user's screenshot
        const response = await axios.post(`https://d247.com/api/v1/get-game-video-url`, {
            eventId: eventId,
            userIp: userIp // Include user IP in case the API needs it
        }, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                // Use the exact cookie string provided by the user
                'Cookie': '_ga_FG56Q6TXQE=GS2.1.s1774444399$o11$g1$t1774444453$j6$l0$h0; _ga=GA1.2.174683028.1761131323; g_token=s%3ABJVQt5oz15oGCgZmuiSETVVNoq3vxeCly.q19byJrUfis%2BRwTeR5MgsHr2OpOAFDRsTK8%2BNMwuxL8',
                'Host': 'd247.com',
                'Origin': 'https://d247.com',
                'Referer': `https://d247.com/game-details/4/${eventId}`,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0'
            },
            timeout: 8000
        });

        const data = response.data;
        let streamingUrl = data.streamingUrl || data.url || data.playerUrl;

        // If API fails or returns nothing, we construct the URL as per user's example
        if (!streamingUrl) {
            console.warn(`⚠️ [D267_WARN] API returned empty, using fallback URL format for ${eventId}`);
            // Fallback token (needs to be dynamic in production)
            const token = "481da5f6-bead-4194-869c-ec60302c5bb8";
            streamingUrl = `https://play.livestream11.com/user/${eventId}/ios/${userIp}/${token}`;
        }

        const result = { streamingUrl };

        // 2. Update Cache
        CACHE.set(eventId, {
            url: result,
            expiry: now + CACHE_TTL
        });

        console.log(`✅ [D267_SUCCESS] Obtained URL for ${eventId}`);
        return result;

    } catch (error) {
        console.error(`❌ [D267_ERROR] Failed to fetch stream for ${eventId}:`, error.message);
        // During development, if the endpoint is wrong, we might return null to avoid crashing
        return null;
    }
}

async function proxyD267Stream(eventId, userIp) {
    try {
        // 🧪 MOCK IP for Localhost testing if needed (livestream11.com might not like 127.0.0.1)
        const finalIp = (userIp === '127.0.0.1' || !userIp) ? '43.251.93.123' : userIp;
        
        const token = "481da5f6-bead-4194-869c-ec60302c5bb8";
        const targetUrl = `https://play.livestream11.com/user/${eventId}/ios/${finalIp}/${token}`;
        
        console.log(`📡 [D267_PROXY] Proxying Stream URL: ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Cookie': '_ga_FG56Q6TXQE=GS2.1.s1774444399$o11$g1$t1774444453$j6$l0$h0; _ga=GA1.2.174683028.1761131323; g_token=s%3ABJVQt5oz15oGCgZmuiSETVVNoq3vxeCly.q19byJrUfis%2BRwTeR5MgsHr2OpOAFDRsTK8%2BNMwuxL8',
                // 🛡️ IMPORTANT: Host should be the target server, not the originator
                // Removing manual Host header so Axios/Node can handle it correctly based on the targetUrl
                'Origin': 'https://d247.com',
                'Referer': `https://d247.com/game-details/4/${eventId}`,
                'Sec-Fetch-Dest': 'iframe',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0'
            },
            timeout: 10000
        });

        return response.data;
    } catch (error) {
        console.error(`❌ [D267_PROXY_ERROR] Error fetching proxy stream:`, error.message);
        throw error;
    }
}

module.exports = { fetchD267Stream, proxyD267Stream };
