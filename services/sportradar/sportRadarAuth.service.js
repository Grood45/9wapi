const axios = require("axios");
const SystemConfig = require("../../models/SystemConfig");
const { MONEYBUZZ, LASER247 } = require("../../config/config");

/**
 * ⚡ PRO-LEVEL STRATEGY: Robust Token Management with Smart Fallback
 */

/**
 * Internal helper to save token and metadata to DB
 */
async function _saveToken(srToken, source, attempt = 1) {
    const updateData = {
        token: srToken,
        source: source,
        updatedAt: Date.now(),
        lastAttemptStatus: "Success",
        lastError: null,
        attemptCount: attempt
    };

    await SystemConfig.findOneAndUpdate(
        { key: "SPORTRADAR_TOKEN" },
        { value: updateData },
        { upsert: true }
    );
    return srToken;
}

/**
 * Method 1: Fetch from Moneybuzz
 */
async function _fetchFromMoneybuzz() {
    console.log("🔍 Attempting token refresh via MONEYBUZZ...");
    
    const headers = {
        "Host": "api.d99hub.com",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:149.0) Gecko/20100101 Firefox/149.0",
        "Origin": "https://moneybuzz247.com",
        "Referer": "https://moneybuzz247.com/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site"
    };

    // Step 1: Login
    const loginRes = await axios.post(MONEYBUZZ.AUTH_API, {
        domain: MONEYBUZZ.domain,
        username: MONEYBUZZ.username,
        password: MONEYBUZZ.password
    }, {
        headers: headers,
        timeout: 15000
    });

    const accessToken = loginRes.data?.access_token || loginRes.data?.data?.access_token;
    if (!accessToken) throw new Error("MONEYBUZZ_LOGIN_FAILED");

    // Step 2: Iframe
    const iframeRes = await axios.get(MONEYBUZZ.SPORTSBOOK_API, {
        headers: { ...headers, "Authorization": `bearer ${accessToken}` },
        timeout: 15000
    });

    const iframeUrl = iframeRes.data?.iframe || iframeRes.data?.data?.iframe;
    if (!iframeUrl) throw new Error("MONEYBUZZ_IFRAME_NOT_FOUND");

    const urlObj = new URL(iframeUrl);
    const srToken = urlObj.searchParams.get("token");
    if (!srToken) throw new Error("MONEYBUZZ_TOKEN_EXTRACTION_FAILED");

    return srToken;
}

/**
 * Method 2: Fetch from Laser247 (Smart Cache)
 */
async function _fetchFromLaser247(forceLogin = false) {
    console.log(`🔍 Attempting token refresh via LASER247 (ForceLogin: ${forceLogin})...`);
    
    let laserAuthDoc = await SystemConfig.findOne({ key: "LASER247_ACCESS_TOKEN" });
    let accessToken = laserAuthDoc?.value?.token;
    let expiresAt = laserAuthDoc?.value?.expiresAt || 0;

    // Logic: Login only if forced, no token, or token expiring in < 1 hour
    const needsLogin = forceLogin || !accessToken || (Date.now() + 3600000 > expiresAt);

    const headers = {
        "Host": "api.laser247.id",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:149.0) Gecko/20100101 Firefox/149.0",
        "Origin": "https://laser247.online",
        "Referer": "https://laser247.online/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site"
    };

    if (needsLogin) {
        console.log("🔑 LASER247: Performing fresh login...");
        const loginRes = await axios.post(LASER247.AUTH_API, {
            domain: LASER247.domain,
            username: LASER247.username,
            password: LASER247.password
        }, {
            headers: headers,
            timeout: 15000
        });

        accessToken = loginRes.data?.access_token || loginRes.data?.data?.access_token;
        const expiresIn = loginRes.data?.expires_in || loginRes.data?.data?.expires_in || 86400;

        if (!accessToken) throw new Error("LASER247_LOGIN_FAILED");

        // Cache the access token
        await SystemConfig.findOneAndUpdate(
            { key: "LASER247_ACCESS_TOKEN" },
            { 
                value: { 
                    token: accessToken, 
                    expiresAt: Date.now() + (expiresIn * 1000),
                    updatedAt: Date.now()
                } 
            },
            { upsert: true }
        );
    }

    try {
        // Get Iframe
        const iframeRes = await axios.get(LASER247.SPORTSBOOK_API, {
            headers: { ...headers, "Authorization": `bearer ${accessToken}` },
            timeout: 15000
        });

        const iframeUrl = iframeRes.data?.iframe || iframeRes.data?.data?.iframe;
        if (!iframeUrl) throw new Error("LASER247_IFRAME_NOT_FOUND");

        const urlObj = new URL(iframeUrl);
        const srToken = urlObj.searchParams.get("token");
        if (!srToken) throw new Error("LASER247_TOKEN_EXTRACTION_FAILED");

        return srToken;

    } catch (err) {
        // If we tried with cached token and it failed, try one more time with fresh login
        if (!needsLogin && (err.response?.status === 401 || err.message.includes("IFRAME"))) {
            console.warn("⚠️ Cached Laser247 token failed, retrying with fresh login...");
            return _fetchFromLaser247(true);
        }
        throw err;
    }
}

async function refreshSportRadarToken(retryCount = 2) {
    let lastError = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            console.log(`🚀 [Attempt ${attempt}/${retryCount}] REFRESHING SPORTRADAR TOKEN...`);

            // 🔹 TRY MONEYBUZZ FIRST
            try {
                const token = await _fetchFromMoneybuzz();
                await _saveToken(token, "Moneybuzz", attempt);
                console.log("✅ SPORTRADAR TOKEN UPDATED (Source: Moneybuzz)");
                return token;
            } catch (mbErr) {
                console.warn("⚠️ Moneybuzz method failed, trying Laser247 fallback...");
                lastError = mbErr.message;
            }

            // 🔹 FALLBACK TO LASER247
            try {
                const token = await _fetchFromLaser247();
                await _saveToken(token, "Laser247", attempt);
                console.log("✅ SPORTRADAR TOKEN UPDATED (Source: Laser247)");
                return token;
            } catch (lErr) {
                lastError = lErr.message;
                throw new Error(lastError); // Trigger retry loop
            }

        } catch (e) {
            console.warn(`❌ Attempt ${attempt} failed: ${e.message}`);
            if (attempt < retryCount) {
                await new Promise(r => setTimeout(r, 3000));
            }
        }
    }

    throw new Error(`ALL_ATEMPTS_FAILED: ${lastError}`);
}

/**
 * Helper to get the full token metadata from DB
 */
async function getSportRadarTokenData() {
    const doc = await SystemConfig.findOne({ key: "SPORTRADAR_TOKEN" });
    return doc?.value || null;
}

/**
 * Backward compatibility: get only the token string
 */
async function getSportRadarToken() {
    const data = await getSportRadarTokenData();
    return data?.token || null;
}

module.exports = {
    refreshSportRadarToken,
    getSportRadarToken,
    getSportRadarTokenData
};
