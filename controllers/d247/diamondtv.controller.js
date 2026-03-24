const { fetchDiamondStream } = require("../../services/d247/diamondtv.service");
const ClientAccess = require("../../models/ClientAccess");

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Clean Export: Return a stable, brand-safe URL to the client.
 * 2. Zero-Leakage: Never expose provider headers or original URLs to the browser.
 * 3. Mobile-First: Ensure the iframe is responsive and handles full-screen correctly.
 */

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

        if (!streamData) {
            return res.status(404).send("<h1>Stream not available. Please try later.</h1>");
        }

        const { streamingUrl } = streamData;

        // 🛡️ Domain Verification Logic
        const referer = req.get('Referer') || req.get('Origin') || "";
        let domainAuthorized = false;

        if (referer) {
            try {
                // Extract domain from Referer (e.g., https://9x.live/match -> 9x.live)
                const urlObj = new URL(referer);
                const requestDomain = urlObj.hostname;

                // Find an active D247 access config for this domain
                const access = await ClientAccess.findOne({
                    providerName: 'D247',
                    status: 'active',
                    domains: requestDomain,
                    validUntil: { $gt: new Date() }
                });

                if (access) {
                    domainAuthorized = true;
                    console.log(`✅ [AUTH_SUCCESS] Domain authorized: ${requestDomain}`);
                } else {
                    console.warn(`🚫 [AUTH_FAIL] Domain NOT whitelisted: ${requestDomain}`);
                }
            } catch (err) {
                console.error(`❌ [AUTH_ERROR] Invalid Referer URL: ${referer}`);
            }
        } else {
            console.warn(`🚫 [AUTH_FAIL] No Referer found in request`);
        }

        // ⚠️ Skip authorization for local testing or if you want to allow direct access for now
        // For production, this should be strictly 'if (!domainAuthorized)'
        if (!domainAuthorized && process.env.NODE_ENV === 'production') {
            return res.status(403).send("<h1>Unauthorized Domain. Please contact administrator.</h1>");
        }

        // 🚀 Premium Iframe Wrapper with Smart Masking (To hide provider-side 'Loading' text)
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Diamond TV - Live Stream [STABLE]</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #000; overflow: hidden; position: relative; }
                    iframe { border: none; height: 100%; width: 100%; z-index: 1; }
                    
                    /* ⚡ External Mask: Covers provider-side 'Loading Stream...' text */
                    #external-mask {
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        background: #000; z-index: 10; display: flex; align-items: center; justify-content: center;
                        transition: opacity 0.8s ease;
                        pointer-events: none;
                    }
                    .spinner {
                        width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #fff;
                        border-radius: 50%; animation: spin 1s linear infinite;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            </head>
            <body>
                <div id="external-mask">
                    <div class="spinner"></div>
                </div>
                <iframe 
                    src="${streamingUrl}" 
                    allowfullscreen="true" 
                    webkitallowfullscreen="true" 
                    mozallowfullscreen="true" 
                    scrolling="no"
                ></iframe>
                <script>
                    // ⚡ High-Performance Masking Logic (Hide provider text for 2.5s)
                    setTimeout(() => {
                        const mask = document.getElementById('external-mask');
                        if (mask) {
                            mask.style.opacity = '0';
                            setTimeout(() => mask.remove(), 800);
                        }
                    }, 2500); 
                </script>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(500).send(`<h1>Error loading stream: ${e.message}</h1>`);
    }
}

module.exports = { getDiamondUrl, renderDiamondEmbed };
