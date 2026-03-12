const axios = require("axios");
const SystemConfig = require("../../models/SystemConfig");
const { MONEYBUZZ } = require("../../config/config");

/**
 * ⚡ 20-Year Exp Strategy: Multi-Step Token Extraction.
 * Automated flow to keep SportRadar token fresh in DB.
 */
async function refreshSportRadarToken() {
    try {
        console.log("🚀 STARTING SPORTRADAR TOKEN REFRESH...");

        // 🔹 STEP 1: Login to D99Hub
        const loginRes = await axios.post(MONEYBUZZ.AUTH_API, {
            domain: MONEYBUZZ.domain,
            username: MONEYBUZZ.username,
            password: MONEYBUZZ.password
        }, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            timeout: 15000
        });

        const accessToken = loginRes.data?.access_token || loginRes.data?.data?.access_token;
        if (!accessToken) {
            throw new Error("D99HUB_LOGIN_FAILED_NO_TOKEN");
        }

        // 🔹 STEP 2: Get Sportsbook Iframe URL
        const iframeRes = await axios.get(MONEYBUZZ.SPORTSBOOK_API, {
            headers: {
                "Accept": "application/json",
                "Authorization": `bearer ${accessToken}`
            },
            timeout: 15000
        });

        const iframeUrl = iframeRes.data?.iframe || iframeRes.data?.data?.iframe;
        if (!iframeUrl) {
            throw new Error("IFRAME_URL_NOT_FOUND");
        }

        // 🔹 STEP 3: Extract Token from URL
        const urlObj = new URL(iframeUrl);
        const srToken = urlObj.searchParams.get("token");

        if (!srToken) {
            throw new Error("SPORTRADAR_TOKEN_EXTRACTION_FAILED");
        }

        // 🔹 STEP 4: Save to Database
        await SystemConfig.findOneAndUpdate(
            { key: "SPORTRADAR_TOKEN" },
            { value: { token: srToken, updatedAt: Date.now() } },
            { upsert: true, returnDocument: 'after' }
        );

        console.log("✅ SPORTRADAR TOKEN UPDATED SUCCESSFULLY");
        return srToken;

    } catch (e) {
        console.log("❌ SPORTRADAR AUTH ERROR:", e.message);
        throw e;
    }
}

/**
 * Helper to get the token from DB
 */
async function getSportRadarToken() {
    const doc = await SystemConfig.findOne({ key: "SPORTRADAR_TOKEN" });
    return doc?.value?.token || null;
}

module.exports = {
    refreshSportRadarToken,
    getSportRadarToken
};
