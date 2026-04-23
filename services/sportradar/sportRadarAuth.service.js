const axios = require("axios");
const SystemConfig = require("../../models/SystemConfig");
const { MONEYBUZZ } = require("../../config/config");

/**
 * ⚡ PRO-LEVEL STRATEGY: Robust Token Management
 * - Retries on failure (3 attempts)
 * - Atomic DB Update (Old token preserved until new one is verified)
 * - Metadata tracking (Last success/error logs)
 */
async function refreshSportRadarToken(retryCount = 3) {
    let lastError = null;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            console.log(`🚀 [Attempt ${attempt}/${retryCount}] STARTING SPORTRADAR TOKEN REFRESH...`);

            // 🔹 STEP 1: Login to D99Hub
            const loginRes = await axios.post(MONEYBUZZ.AUTH_API, {
                domain: MONEYBUZZ.domain,
                username: MONEYBUZZ.username,
                password: MONEYBUZZ.password
            }, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
                    "Authorization": `bearer ${accessToken}`,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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

            // 🛡️ VALIDATION: Ensure token is not empty and has a minimum length
            if (!srToken || srToken.length < 10) {
                throw new Error("INVALID_TOKEN_EXTRACTED");
            }

            // 🔹 STEP 4: Atomic Save to Database
            // We ONLY reach here if everything above succeeded.
            // Old token is automatically preserved because we haven't touched the DB yet.
            const updateData = {
                token: srToken,
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

            console.log(`✅ SPORTRADAR TOKEN UPDATED SUCCESSFULLY (Attempt ${attempt})`);
            return srToken;

        } catch (e) {
            lastError = e.message;
            console.warn(`⚠️ [Attempt ${attempt}] SPORTRADAR AUTH ERROR:`, lastError);
            
            // Log the error to DB so we can track it, but PRESERVE the existing token
            await SystemConfig.updateOne(
                { key: "SPORTRADAR_TOKEN" },
                { 
                    $set: { 
                        "value.lastAttemptStatus": "Failed",
                        "value.lastError": lastError,
                        "value.lastErrorAt": Date.now()
                    } 
                }
            ).catch(() => {}); // Silent catch for DB logging failure

            // Wait before next retry (Exponential Backoff or simple delay)
            if (attempt < retryCount) {
                const delay = 5000 * attempt; 
                console.log(`⏳ Waiting ${delay/1000}s before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // If we reach here, all retries failed.
    console.error("❌ ALL ATTEMPTS FAILED. Old token is still in DB.");
    throw new Error(`SPORTRADAR_REFRESH_FAILED: ${lastError}`);
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
