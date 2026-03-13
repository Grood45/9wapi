const axios = require("axios");
const SystemConfig = require("../../models/SystemConfig");
const { GAME_API } = require("../../config/config");
const { getToken } = require("../../storage/token"); // ✅ latest token use

let GLOBAL_COOKIE = null;
let COOKIE_REFRESHING = false;

async function generateCookie(providedToken) {
  const instanceId = process.env.NODE_APP_INSTANCE || "0";

  // 🔒 Local memory lock
  if (COOKIE_REFRESHING) return GLOBAL_COOKIE;

  try {
    COOKIE_REFRESHING = true;

    // 🛡️ STEP 0: Cluster Coordination
    if (instanceId !== "0") {
        console.log(`[Instance ${instanceId}] Waiting for Master to generate cookie...`);
        await new Promise(r => setTimeout(r, 5000));
    }

    // 🛡️ STEP 1: Freshness Check
    const existing = await SystemConfig.findOne({ key: "COOKIE" });
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    if (existing && existing.updatedAt > thirtyMinsAgo) {
        console.log(`✅ [Instance ${instanceId}] Using Fresh Cookie from DB`);
        const cookieStr = `JSESSIONID=${existing.value.value}`;
        GLOBAL_COOKIE = cookieStr;
        return GLOBAL_COOKIE;
    }

    // 🛡️ STEP 2: Only master (or if missing) generates
    if (instanceId !== "0") {
        console.log(`⚠️ [Instance ${instanceId}] Cookie still stale, retrying load...`);
        await new Promise(r => setTimeout(r, 2000));
        return await loadCookie();
    }

    console.log(`🚀 [Instance ${instanceId}] Generating NEW Session Cookie...`);

    // 🔹 STEP A: token check
    const token = providedToken || getToken();
    if (!token) throw new Error("TOKEN_NOT_READY");

    // 🔹 STEP B: GAME URL API
    const apiRes = await axios.get(GAME_API, {
      headers: {
        Authorization: token,
        Origin: "https://www.gugobet.net",
        Referer: "https://www.gugobet.net/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (apiRes.status !== 200 || !apiRes.data?.data?.url) {
      throw new Error(`GAME_API_FAILED_${apiRes.status}`);
    }

    const { url, params } = apiRes.data.data;

    // 🔹 STEP C: AXIOS FETCH
    console.log("📡 FETCHING SESSION COOKIE (AXIOS)...");
    const sessionRes = await axios.post(url, new URLSearchParams(params).toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      timeout: 20000,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const setCookie = sessionRes.headers["set-cookie"];
    if (!setCookie) throw new Error("COOKIE_HEADER_MISSING");

    const jsessionHeader = setCookie.find((c) => c.includes("JSESSIONID"));
    if (!jsessionHeader) throw new Error("JSESSIONID_NOT_FOUND");

    const jsessionValue = jsessionHeader.split("JSESSIONID=")[1]?.split(";")[0];
    
    // ✅ SAVE GLOBALLY AND TO DB
    GLOBAL_COOKIE = `JSESSIONID=${jsessionValue}`;
    await SystemConfig.findOneAndUpdate(
      { key: "COOKIE" },
      { 
          value: { value: jsessionValue },
          updatedAt: new Date() 
      },
      { upsert: true }
    );

    console.log("✅ COOKIE UPDATED SAFELY");
    return GLOBAL_COOKIE;

  } catch (e) {
    console.log("❌ COOKIE ERROR:", e.message);
    throw e; // ❗ Throw error so retry logic knows it failed
  } finally {
    COOKIE_REFRESHING = false;
  }
}

// 🔹 Getter (streaming will use this)
function getCookie() {
  return GLOBAL_COOKIE;
}

async function loadCookie() {
  try {
    const doc = await SystemConfig.findOne({ key: "COOKIE" });
    if (doc && doc.value && doc.value.value) {
      // Reconstruct cookie string: JSESSIONID=value
      const cookieStr = `JSESSIONID=${doc.value.value}`;
      GLOBAL_COOKIE = cookieStr;
      console.log("✅ LOADED COOKIE FROM DB");
      return GLOBAL_COOKIE;
    }
  } catch (e) {
    console.log("⚠️ COULD NOT LOAD COOKIE FROM DB:", e.message);
  }
  return null;
}

module.exports = { generateCookie, getCookie, loadCookie };
