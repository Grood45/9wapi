const axios = require("axios");
// NOTE: Run 'npm install https-proxy-agent' before running this script
const { HttpsProxyAgent } = require("https-proxy-agent");

/**
 * CONFIGURATION: Fill your proxy details here
 */
const PROXY_URL = "http://fqUe0xezvfZ2m7eD:Sher123123_country-in@geo.iproyal.com:12321"; 
const USE_PROXY = true; // Enabled for testing

const LASER247_LOGIN = {
    url: "https://api.laser247.id/api/auth",
    data: {
        username: "ZLS6971",
        password: "968010Ss@",
        domain: "laser247.online"
    }
};

const HEADERS = {
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

async function runTest() {
    console.log("🚀 Starting Laser247 Proxy Test...");
    console.log(`📡 Proxy Enabled: ${USE_PROXY}`);
    
    const axiosConfig = {
        headers: HEADERS,
        timeout: 15000
    };

    if (USE_PROXY) {
        axiosConfig.httpsAgent = new HttpsProxyAgent(PROXY_URL);
        console.log(`🌐 Using Proxy: ${PROXY_URL}`);
    }

    try {
        console.log("⌛ Sending Login Request...");
        const res = await axios.post(LASER247_LOGIN.url, LASER247_LOGIN.data, axiosConfig);
        
        console.log("✅ SUCCESS!");
        console.log("Status Code:", res.status);
        console.log("Access Token Received:", res.data?.access_token ? "YES" : "NO");
        if (res.data?.access_token) {
            console.log("Token Preview:", res.data.access_token.substring(0, 30) + "...");
        }

    } catch (err) {
        console.error("❌ TEST FAILED");
        if (err.response) {
            console.error("Error Status:", err.response.status);
            console.error("Error Data:", JSON.stringify(err.response.data));
            if (err.response.status === 403) {
                console.error("💡 HINT: Server is still blocking this IP/Fingerprint.");
            }
        } else {
            console.error("Error Message:", err.message);
        }
    }
}

runTest();
