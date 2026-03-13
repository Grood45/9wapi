const axios = require("axios");
const FormData = require("form-data");
const SystemConfig = require("../../models/SystemConfig");
const { LOGIN_URL, AUTH } = require("../../config/config");
const { setToken, getToken } = require("../../storage/token"); // ensure storage/token.js exist

async function login() {
  const instanceId = process.env.NODE_APP_INSTANCE || "0";

  try {
    // 🛡️ STEP 0: Cluster Synchronization
    // Agar hum instance 0 nahi hain, toh thoda wait karein taaki master instance login kar sake
    if (instanceId !== "0") {
      console.log(`[Instance ${instanceId}] Waiting for Master to login...`);
      await new Promise(r => setTimeout(r, 3000));
    }

    // 🛡️ STEP 1: Freshness Check
    const existing = await SystemConfig.findOne({ key: "AUTH_TOKEN" });
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    if (existing && existing.updatedAt > fifteenMinsAgo) {
      console.log(`✅ [Instance ${instanceId}] Using Fresh Token from DB`);
      setToken(existing.value.token);
      return existing.value.token;
    }

    // 🛡️ STEP 2: Only Master (or if token is really missing) performs login
    if (instanceId !== "0") {
        console.log(`⚠️ [Instance ${instanceId}] Token still stale, retrying load...`);
        await new Promise(r => setTimeout(r, 2000));
        return await loadToken();
    }

    console.log(`🚀 [Instance ${instanceId}] CACHE MISS - DOING FRESH LOGIN...`);
    
    const form = new FormData();
    form.append("account_id", AUTH.account_id);
    form.append("password", AUTH.password);
    form.append("verify_token", "");
    form.append("country_code", AUTH.country_code);

    const res = await axios.post(LOGIN_URL, form, {
      headers: {
        ...form.getHeaders(),
        "User-Agent": "Mozilla/5.0 Chrome/120",
        Origin: "https://www.gugobet.net",
        Referer: "https://www.gugobet.net/",
      },
      timeout: 15000,
    });

    if (!res.data?.token) {
      throw new Error("TOKEN_NOT_RECEIVED");
    }

    // 🔑 SAVE TOKEN IN GLOBAL STORE
    setToken(res.data.token);

    // 💾 SAVE TO MONGODB
    await SystemConfig.findOneAndUpdate(
      { key: "AUTH_TOKEN" },
      { 
          value: res.data,
          updatedAt: new Date() 
      },
      { upsert: true }
    );

    console.log("🔑 AUTH TOKEN UPDATED AND SAVED");
    return res.data.token;
  } catch (err) {
    console.log(`❌ [Instance ${instanceId}] AUTH LOGIN FAILED:`, err.message);
    throw err;
  }
}

async function loadToken() {
  try {
    const doc = await SystemConfig.findOne({ key: "AUTH_TOKEN" });
    if (doc && doc.value) {
      setToken(doc.value.token);
      console.log("✅ LOADED TOKEN FROM DB");
      return doc.value.token;
    }
  } catch (e) {
    console.log("⚠️ COULD NOT LOAD TOKEN FROM DB:", e.message);
  }
  return null;
}

module.exports = { login, loadToken, getToken };
