const { fetchDiamondStream, proxyDiamondStream, getProxiedM3U8 } = require("../../services/d247/diamondtv.service");
const ClientAccess = require("../../models/ClientAccess");
const StreamingMap = require("../../models/StreamingMap");
const axios = require("axios");

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. O(1) Magic Lookup: Sub-1ms ID resolution using Local RAM Cache.
 * 2. Rich Metadata: Return both IDs, Sport, Name, and Start Time for transparency.
 * 3. Atomic Response: Standardized JSON for all clients.
 */

// 🚀 RAM CACHE (O(1) Velocity) - Refreshed by the background worker
let MAGIC_CACHE = {
    byDiamond: new Map(),
    byBetfair: new Map(),
    byD247: new Map()
};
const DISCOVERY_CACHE = new Map(); // ⚡ Short-lived discovery cache to prevent API flooding

// 🧠 Advanced Fuzzy Match Helper (Dice Coefficient)
const getSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase().replace(/\s+/g, "");
    const s2 = str2.toLowerCase().replace(/\s+/g, "");
    if (s1 === s2) return 1;
    const getBigrams = (s) => {
        const bigrams = new Set();
        for (let i = 0; i < s.length - 1; i++) bigrams.add(s.substring(i, i + 2));
        return bigrams;
    };
    const b1 = getBigrams(s1);
    const b2 = getBigrams(s2);
    const intersection = new Set([...b1].filter(x => b2.has(x)));
    return (2 * intersection.size) / (b1.size + b2.size);
};

async function warmMagicCache() {
    try {
        const mappings = await StreamingMap.find().lean();
        const diamondMap = new Map();
        const betfairMap = new Map();
        const d247Map = new Map();

        mappings.forEach(m => {
            if (m.diamondId) diamondMap.set(m.diamondId.toString(), m);
            if (m.betfairId) betfairMap.set(m.betfairId.toString(), m);
            if (m.d247Id) d247Map.set(m.d247Id.toString(), m);
        });

        MAGIC_CACHE = { byDiamond: diamondMap, byBetfair: betfairMap, byD247: d247Map };
    } catch (e) {
        console.error("❌ [MAGIC_CACHE_ERROR]", e.message);
    }
}

// Warm cache every 60s
setInterval(warmMagicCache, 60000);
warmMagicCache(); 

async function getMagicUrl(req, res) {
    const { eventId } = req.params;
    try {
        if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

        const idStr = eventId.toString();

        // 1. Resolve ID via RAM Cache (Sub-1ms)
        let resolved = MAGIC_CACHE.byDiamond.get(idStr) || 
                       MAGIC_CACHE.byBetfair.get(idStr) || 
                       MAGIC_CACHE.byD247.get(idStr);

        let bfId = resolved ? resolved.betfairId : idStr;
        let dId = resolved ? resolved.diamondId : null;
        let d247Id = resolved ? resolved.d247Id : null;
        let eventName = resolved ? resolved.eventName : "Direct Stream";
        let isFallback = false;

        // 2. Discovery Engine (Real-time Name Match Fallback)
        // If not mapped, we try to find a name match in active provider lists
        if (!resolved) {
            // 🚀 Discovery Cache Check (5-min TTL)
            const cachedDiscovery = DISCOVERY_CACHE.get(idStr);
            if (cachedDiscovery && Date.now() < cachedDiscovery.expiry) {
                console.log(`🚀 [DISCOVERY_CACHE_HIT] Using cached result for ${idStr}`);
                const disc = cachedDiscovery.data;
                bfId = disc.bfId; dId = disc.dId; d247Id = disc.d247Id;
                eventName = disc.eventName; isFallback = disc.isFallback;
            } else {
                console.log(`🔍 [DISCOVERY_BOOT] No mapping for ${idStr}. Analyzing providers...`);
            
            // Fetch Betfair list to get the name of this match
            // We'll search in all 3 sports to find the canonical name
            const sports = [1, 2, 4];
            let targetName = null;
            let targetSportId = null;

            for (const sId of sports) {
                const bfRes = await axios.get(`https://111111.info/pad=82/listGames?sport=${sId}&inplay=1`).catch(() => ({}));
                const games = bfRes.data?.result || (Array.isArray(bfRes.data) ? bfRes.data : []);
                const match = games.find(g => g.eventId.toString() === idStr);
                if (match) {
                    targetName = match.eventName;
                    targetSportId = sId;
                    break;
                }
            }

            if (targetName) {
                console.log(`✨ [DISCOVERY] Name found: "${targetName}". Searching providers...`);
                
                // Fetch Diamond & D247 lists
                const diamondUrls = { 1: "https://marketsarket.qnsports.live/getsoccermatches", 2: "https://marketsarket.qnsports.live/gettennismatches" };
                const [dRes, d247Res] = await Promise.all([
                    diamondUrls[targetSportId] ? axios.get(diamondUrls[targetSportId]).catch(() => ({})) : Promise.resolve({}),
                    axios.get('https://feed.igames.cloud/api/matches/inplay-and-upcoming', {
                        headers: { 'x-igames-key': 'sdfd89453n-dsak432-JGdas834-Pks73ndsa-Hfg38bhb' }
                    }).catch(() => ({}))
                ]);

                const dMatches = dRes.data || [];
                const d247Matches = d247Res.data?.data?.matches || [];

                // Fuzzy match in Diamond
                const bestD = dMatches
                    .map(m => ({ m, sim: getSimilarity(targetName, m.ename) }))
                    .filter(x => x.sim > 0.85)
                    .sort((a, b) => b.sim - a.sim)[0];

                // Fuzzy match in D247
                const bestD247 = d247Matches
                    .map(m => ({ m, sim: getSimilarity(targetName, m.event_name) }))
                    .filter(x => x.sim > 0.85)
                    .sort((a, b) => b.sim - a.sim)[0];

                if (bestD) dId = bestD.m.gmid;
                if (bestD247) d247Id = bestD247.m.event_id;
                
                if (bestD || bestD247) {
                    eventName = targetName;
                    isFallback = true;
                    console.log(`✅ [DISCOVERY_SUCCESS] Fallback linked! D:${dId || '❌'} D247:${d247Id || '❌'}`);

                    // 🚀 PERSIST TO DB (User's Hybrid Strategy)
                    // This creates a permanent mapping so the NEXT person gets it in <1ms
                    await StreamingMap.findOneAndUpdate(
                        { betfairId: idStr },
                        { 
                            diamondId: dId ? dId.toString() : null,
                            d247Id: d247Id ? d247Id.toString() : null,
                            eventName,
                            sportId: targetSportId,
                            status: "auto_discovery"
                        },
                        { upsert: true }
                    );
                    warmMagicCache(); // Instant RAM refresh
                }

                // Cache the discovery result (even if not found, to avoid retrying immediately)
                DISCOVERY_CACHE.set(idStr, {
                    expiry: Date.now() + (5 * 60 * 1000), // 5 minutes
                    data: { bfId, dId, d247Id, eventName, isFallback }
                });
            }
        }
    }

        // 3. Score Intelligence Engine (LMT + BetGenius)
        let scoreUrl = resolved ? resolved.scoreUrl : null;
        let scoreUrlV2 = resolved ? resolved.scoreUrlV2 : null;

        // If score URLs are missing, fetch from 3rd party API and persist to DB
        // Using Betfair ID for score lookup
        if (!scoreUrl || !scoreUrlV2) {
            try {
                console.log(`📡 [SCORE_FETCH] Fetching scores for ${bfId}...`);
                const scoreRes = await axios.get(`https://api.1ten365.com/api/event/odds/${bfId}`, { timeout: 3000 }).catch(() => ({}));
                const scoreData = scoreRes.data?.data;
                if (scoreData) {
                    scoreUrl = scoreData.iframeScore || null;
                    scoreUrlV2 = scoreData.iframeScoreV2 || null;

                    // Persistence: Save to DB so both MAGIC API and PROXY can use it
                    await StreamingMap.findOneAndUpdate(
                        { betfairId: bfId },
                        { scoreUrl, scoreUrlV2 },
                        { upsert: true }
                    );
                    warmMagicCache(); // Instant RAM update
                }
            } catch (err) {
                console.error(`❌ [SCORE_FETCH_ERROR] for ${bfId}:`, err.message);
            }
        }

        // 4. Priority Engine (Diamond > D247)
        const protocol = req.protocol;
        const host = req.get('host');
        const tvUrl = `${protocol}://${host}/streming/diomondtv/${bfId}`;
        
        // Branded Score Proxies (For privacy and zero-restriction)
        const localScoreUrl = scoreUrl ? `${protocol}://${host}/streming/score/${bfId}` : null;
        const localScoreUrlV2 = scoreUrlV2 ? `${protocol}://${host}/streming/scoreV2/${bfId}` : null;

        res.json({
            success: true,
            provider: dId ? 'DiamondTV' : (d247Id ? 'D247' : 'Betfair Direct'),
            requestedId: eventId,
            betfairId: bfId,
            diamondId: dId,
            d247Id: d247Id,
            eventName,
            isMapped: !!resolved,
            isFallback,
            tvUrl,
            scoreUrl: localScoreUrl,
            scoreUrlV2: localScoreUrlV2
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function getDiamondUrl(req, res) {
    const { eventId } = req.params;
    try {
        if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

        // Generate the clean proxy URL
        const protocol = req.protocol;
        const host = req.get('host');
        const cleanUrl = `${protocol}://${host}/streming/diomondtv/${eventId}`;

        res.json({
            success: true,
            provider: 'DiamondTV',
            eventId,
            url: cleanUrl
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function renderDiamondEmbed(req, res) {
    const { eventId } = req.params;
    try {
        const streamData = await fetchDiamondStream(eventId);

        if (!streamData || !streamData.m3u8Url) {
            return res.status(404).send("<body style='background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;'><h1>Stream not available yet.</h1></body>");
        }

        const protocol = req.protocol;
        const host = req.get('host');
        // 🚀 PROXIED M3U8: This manifest will point to our internal segment proxy
        const proxiedM3u8 = `${protocol}://${host}/streming/diomondtv/m3u8?id=${eventId}`;

        // 🚀 Premium HLS Player: No CORS issues because manifest is from 'self'
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>Diamond TV - Live [STABLE]</title>
                <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #000; overflow: hidden; font-family: sans-serif; }
                    .video-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
                    video { width: 100%; height: 100%; object-fit: contain; }
                    .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10; }
                    .left-controls { position: absolute; top: 50%; left: 15px; transform: translateY(-50%); display: flex; flex-direction: column; gap: 20px; z-index: 20; }
                    .icon { width: 35px; height: 35px; background: rgba(0,0,0,0.5); color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; transition: transform 0.2s; -webkit-user-select: none; user-select: none; font-size: 20px; }
                    .icon:hover { transform: scale(1.1); background: rgba(0,0,0,0.8); }
                    #loader { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; text-align: center; z-index: 15; }
                    .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px auto; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <div class="video-container">
                    <div id="loader">
                        <div class="spinner"></div>
                        <div style="font-size: 12px; opacity: 0.8;">LOADED VIA PROXY HUB...</div>
                    </div>
                    <video id="video" autoplay muted playsinline></video>
                    <div class="overlay">
                        <div class="left-controls">
                            <div class="icon" onclick="toggleMute()" id="muteIcon">🔇</div>
                            <div class="icon" onclick="location.reload()">🔄</div>
                        </div>
                    </div>
                </div>
                <script>
                    const video = document.getElementById('video');
                    const proxiedM3u8 = '${proxiedM3u8}';
                    const loader = document.getElementById('loader');

                    if (Hls.isSupported()) {
                        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                        hls.loadSource(proxiedM3u8);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            video.play().catch(e => console.log("Play failed", e));
                            loader.style.display = 'none';
                        });
                        hls.on(Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) hls.recoverMediaError();
                        });
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = proxiedM3u8;
                        video.onloadedmetadata = () => { video.play(); loader.style.display = 'none'; };
                    }
                    function toggleMute() {
                        video.muted = !video.muted;
                        document.getElementById('muteIcon').innerText = video.muted ? '🔇' : '🔊';
                    }
                    video.onplaying = () => { loader.style.display = 'none'; };
                </script>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(500).send(`<h1>Error loading stream: ${e.message}</h1>`);
    }
}

async function handleM3U8Proxy(req, res) {
    const { id } = req.query;
    try {
        if (!id) return res.status(400).send("Missing ID");
        
        const streamData = await fetchDiamondStream(id);
        if (!streamData || !streamData.m3u8Url) return res.status(404).send("Stream not found");

        const protocol = req.protocol;
        const host = req.get('host');
        const proxyBase = `${protocol}://${host}/streming/diomondtv/asset`;
        
        const rewrittenM3u8 = await getProxiedM3U8(streamData.m3u8Url, proxyBase);
        
        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        res.set('Access-Control-Allow-Origin', '*');
        res.send(rewrittenM3u8);
    } catch (e) {
        res.status(500).send(e.message);
    }
}


async function proxyDiamondHandler(req, res) {
    const { eventId } = req.params;
    try {
        const { content, targetUrl } = await proxyDiamondStream(eventId);

        let providerOrigin = "https://www.betswiz.in/";
        try {
            const urlObj = new URL(targetUrl);
            providerOrigin = urlObj.origin;
            console.log(`🔗 [DIAMOND_PROXY] Setting Provider Origin: ${providerOrigin}`);
        } catch (err) {
            console.error("❌ [DIAMOND_PROXY_ERROR] Failed to parse provider origin:", err.message);
        }

        // 🚀 ASSET REWRITING ENGINE: Proxy all internal scripts/styles to bypass CORS
        const protocol = req.protocol;
        const host = req.get('host');
        const assetProxyBase = `${protocol}://${host}/streming/diomondtv/asset?origin=${encodeURIComponent(providerOrigin)}&url=`;

        let modifiedContent = content;

        // 1. Rewrite <script src="...">
        modifiedContent = modifiedContent.replace(/(<script\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'])/gi, (match, p1, p2, p3) => {
            const absoluteUrl = p2.startsWith('http') ? p2 : new URL(p2, providerOrigin + '/').href;
            return `${p1}${assetProxyBase}${encodeURIComponent(absoluteUrl)}${p3}`;
        });

        // 2. Rewrite <link href="...">
        modifiedContent = modifiedContent.replace(/(<link\b[^>]*?\bhref\s*=\s*["'])([^"']+)(["'])/gi, (match, p1, p2, p3) => {
            if (p2.includes('.css') || p2.includes('.ico') || p2.includes('.png')) {
                const absoluteUrl = p2.startsWith('http') ? p2 : new URL(p2, providerOrigin + '/').href;
                return `${p1}${assetProxyBase}${encodeURIComponent(absoluteUrl)}${p3}`;
            }
            return match;
        });

        // 3. Inject Base Tag as fallback
        const headStart = modifiedContent.indexOf('<head>');
        if (headStart !== -1) {
            const headTag = '<head>';
            const baseTag = `\n    <base href="${providerOrigin}/">`;
            modifiedContent = modifiedContent.slice(0, headStart + headTag.length) + baseTag + modifiedContent.slice(headStart + headTag.length);
        }

        res.set('Content-Type', 'text/html');
        res.set('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline';");
        res.set('X-Frame-Options', 'ALLOWALL');
        res.send(modifiedContent);
    } catch (e) {
        res.status(500).send(`Proxy Error: ${e.message}`);
    }
}

async function proxyDiamondAsset(req, res) {
    const { url, origin } = req.query;
    try {
        if (!url) return res.status(400).send("Missing URL");

        console.log(`📦 [ASSET_PROXY] Fetching: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'Referer': origin || 'https://www.betswiz.in/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0'
            },
            responseType: 'arraybuffer',
            timeout: 10000
        });

        const contentType = response.headers['content-type'];
        if (contentType) res.set('Content-Type', contentType);
        
        // Cache assets for 1 hour
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(response.data);
    } catch (e) {
        console.error(`❌ [ASSET_PROXY_FAIL] ${url}:`, e.message);
        res.status(404).send("Asset not found");
    }
}

module.exports = { getDiamondUrl, renderDiamondEmbed, getMagicUrl, proxyDiamondHandler, proxyDiamondAsset, handleM3U8Proxy };
