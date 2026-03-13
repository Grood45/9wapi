const axios = require("axios");
const FormData = require("form-data");
const { LOGIN_URL, AUTH, GAME_API } = require("./config/config");

async function testLogin() {
    console.log("🚀 Testing Gugobet Login...");
    console.log("Account:", AUTH.account_id);
    
    try {
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

        console.log("✅ Login Response Status:", res.status);
        if (res.data.token) {
            console.log("🔑 Token Received:", res.data.token.substring(0, 20) + "...");
            
            console.log("📡 Testing Game API (Step 1)...");
            const gameRes = await axios.get(GAME_API, {
                headers: {
                    Authorization: res.data.token,
                    Origin: "https://www.gugobet.net",
                    Referer: "https://www.gugobet.net/",
                    "User-Agent": "Mozilla/5.0 Chrome/120",
                },
                validateStatus: ()=>true
            });
            
            console.log("📡 Game API Status:", gameRes.status);
            console.log("📡 Game API Body:", JSON.stringify(gameRes.data));

            if (gameRes.data?.data?.url) {
                const { url, params } = gameRes.data.data;
                console.log("📡 Step 2: Fetching Session Cookie from:", url);
                
                try {
                    const sessionRes = await axios.post(url, new URLSearchParams(params).toString(), {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                        },
                        timeout: 20000,
                        maxRedirects: 0,
                        validateStatus: (status) => true,
                    });

                    console.log("📡 Session Response Status:", sessionRes.status);
                    console.log("📡 Headers Set-Cookie:", sessionRes.headers["set-cookie"]);
                    
                    if (sessionRes.status === 403) {
                        console.log("⚠️ CAUGHT 403 ON SESSION FETCH!");
                        console.log("Response Body:", JSON.stringify(sessionRes.data));
                    }
                } catch (sessErr) {
                    console.log("❌ SESSION FETCH ERROR:", sessErr.message);
                }
            }
            
        } else {
            console.log("❌ No Token in response:", JSON.stringify(res.data));
        }

    } catch (err) {
        console.log("❌ LOGIN FAILED Error:", err.message);
        if (err.response) {
            console.log("❌ Response Status:", err.response.status);
            console.log("❌ Response Data:", JSON.stringify(err.response.data));
        }
    }
}

testLogin();
