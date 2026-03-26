const { fetchD267Stream, proxyD267Stream } = require("../../services/d247/d267tv.service");
const ClientAccess = require("../../models/ClientAccess");

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Clean Export: Return a stable, brand-safe URL to the client.
 * 2. Zero-Leakage: Never expose provider headers or original URLs to the browser.
 * 3. Mobile-First: Ensure the iframe is responsive and handles full-screen correctly.
 */

async function getD267Url(req, res) {
    const { eventId } = req.params;
    try {
        if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

        // Generate the clean proxy URL
        const protocol = req.protocol;
        const host = req.get('host');
        const cleanUrl = `${protocol}://${host}/streming/d267tv/${eventId}`;

        res.json({
            success: true,
            provider: 'D267TV',
            eventId,
            url: cleanUrl
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function renderD267Embed(req, res) {
    const { eventId } = req.params;
    try {
        // ⚡ Capture User IP for the streaming URL
        let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        if (userIp.includes(',')) userIp = userIp.split(',')[0].trim();
        if (userIp.startsWith('::ffff:')) userIp = userIp.substring(7);
        if (userIp === '::1' || userIp === 'localhost') userIp = '127.0.0.1';

        // 🛡️ SECURITY: Use a internal proxy URL to spoof headers for livestream11.com
        const protocol = req.protocol;
        const host = req.get('host');
        const proxyUrl = `${protocol}://${host}/streming/d267tv/proxy/${eventId}`;

        /* 🛡️ TEMPORARY: Disabled domain verification... */

        // 🚀 Premium Iframe Wrapper with Smart Masking
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>D267TV - Live Stream [STABLE]</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #000; overflow: hidden; position: relative; }
                    iframe { border: none; height: 100%; width: 100%; z-index: 1; }
                    
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
                    src="${proxyUrl}" 
                    allowfullscreen="true" 
                    webkitallowfullscreen="true" 
                    mozallowfullscreen="true" 
                    scrolling="no"
                    allow="autoplay"
                ></iframe>
                <script>
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

async function proxyD267Handler(req, res) {
    const { eventId } = req.params;
    try {
        let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        if (userIp.includes(',')) userIp = userIp.split(',')[0].trim();
        if (userIp.startsWith('::ffff:')) userIp = userIp.substring(7);
        if (userIp === '::1' || userIp === 'localhost') userIp = '127.0.0.1';

        const content = await proxyD267Stream(eventId, userIp);

        // Inject <base> tag to fix relative links (JS/CSS) in the proxied HTML
        const modifiedContent = content.replace('<head>', '<head><base href="https://play.livestream11.com/">');

        res.set('Content-Type', 'text/html');
        res.send(modifiedContent);
    } catch (e) {
        res.status(500).send(`Proxy Error: ${e.message}`);
    }
}

module.exports = { getD267Url, renderD267Embed, proxyD267Handler };
