const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { PORT } = require("./config/config");
const { login, loadToken } = require("./controllers/auth/auth.controller");
const { generateCookie, loadCookie } = require("./controllers/auth/cookie.controller");

// 🔹 Start cron jobs (auth + cookie)
require("./cron/auth/cookie.cron");
// require("./cron/skyexchange/inplay.cron"); // Old one (Optional, can be removed later)
require("./cron/skyexchange/liveEventsCount.cron");
require("./cron/sportradar/sportRadarToken.cron");
// NEW Fast Memory Cron
require("./cron/skyexchange/inplayEvents.cron"); // NEW Fast Delta-Sync Cron
require("./cron/skyexchange/todayEvents.cron"); // NEW Fast Today Events Cron
require("./cron/skyexchange/tomorrowEvents.cron"); // NEW Fast Tomorrow Events Cron
require("./cron/skyexchange/sportEvents.cron"); // NEW Dynamic Sport-wise Cron (4, 1, 2, 137)
require("./cron/betfair/cleanupMarketResults.cron"); // NEW Betfair Market Result Auto-Cleanup and Update Cron

const { gliveHandler } = require("./controllers/skyexchange/glive.controller");
const { getEventStream } = require("./controllers/skyexchange/event.controller");
const apiAccessGuard = require("./middlewares/apiAccessGuard");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔹 Initialize WebSockets
const { initOddsSocket } = require("./sockets/odds.socket");
initOddsSocket(io);

// 🔹 Trust Proxy (Required for Nginx + Rate Limit)
app.set("trust proxy", 1);

// ================= OPTIMIZATION & SECURITY =================
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.socket.io"],
      connectSrc: ["'self'", "ws:", "wss:", "https://cdn.jsdelivr.net", "https://*.skyinplay.com"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:"],
      frameSrc: ["'self'", "https:"]
    }
  }
})); // Security Headers
app.use(compression()); // Gzip Compression
app.use(cors()); // Allow Cross-Origin Requests

// 🔹 Parse JSON requests (Required for Admin UI POST / PUT)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (Prevent Abuse) - DISABLED per user request for unlimited access
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 300, // Limit each IP to 300 requests per windowMs
//   message: "Too many requests from this IP, please try again after 15 minutes."
// });
// app.use(limiter);
// ========================================================

app.get("/", (req, res) => res.send("GLIVE SERVER IS RUNNING"));

// ================= API ROUTE =================
app.get("/glivestreaming/v1/glive/:matchId", apiAccessGuard('SkyExchange', '/glivestreaming/v1/glive'), gliveHandler);
app.get("/glivestreaming/v1/event/:eventId", apiAccessGuard('SkyExchange', '/glivestreaming/v1/event'), getEventStream);

const { getLiveEventsCountHandler } = require("./controllers/skyexchange/liveEventsCount.controller");
app.get("/api/v1/inplay/count", apiAccessGuard('SkyExchange', '/api/v1/inplay/count'), getLiveEventsCountHandler); // Fast Cached GET API

const { getInplayEventsHandler } = require("./controllers/skyexchange/inplayEvents.controller");
app.get("/api/v1/inplay/events", apiAccessGuard('SkyExchange', '/api/v1/inplay/events'), getInplayEventsHandler); // Fast Delta-Sync GET API for Inplay

const { getTodayEventsHandler } = require("./controllers/skyexchange/todayEvents.controller");
app.get("/api/v1/today/events", apiAccessGuard('SkyExchange', '/api/v1/today/events'), getTodayEventsHandler); // Fast Delta-Sync GET API for Today matches

const { getTomorrowEventsHandler } = require("./controllers/skyexchange/tomorrowEvents.controller");
app.get("/api/v1/tomorrow/events", apiAccessGuard('SkyExchange', '/api/v1/tomorrow/events'), getTomorrowEventsHandler); // Fast Delta-Sync GET API for Tomorrow matches

const { getEventsBySportHandler } = require("./controllers/skyexchange/sportEvents.controller");
app.get("/api/v1/events/list/:sportId", apiAccessGuard('SkyExchange', '/api/v1/events/list'), getEventsBySportHandler); // ⚡ DYNAMIC Sport-wise List (4=Cricket, etc.)

const { getSportsbookOddsHandler } = require("./controllers/skyexchange/sportsbook.controller");
app.get("/api/v1/odds/sportsbook/:eventId", apiAccessGuard('SkyExchange', '/api/v1/odds/sportsbook'), getSportsbookOddsHandler); // ⚡ LIVE Sportsbook Odds (REST API)

const { getFancyOddsHandler } = require("./controllers/skyexchange/fancyOdds.controller");
app.get("/api/v1/odds/fancy/:eventId", apiAccessGuard('SkyExchange', '/api/v1/odds/fancy'), getFancyOddsHandler); // ⚡ LIVE Fancy/Session Odds (REST API)

const { getBookmakerOddsHandler } = require("./controllers/skyexchange/bookmakerOdds.controller");
app.get("/api/v1/odds/bookmaker/:eventId", apiAccessGuard('SkyExchange', '/api/v1/odds/bookmaker'), getBookmakerOddsHandler); // ⚡ LIVE Bookmaker Odds (REST API)

const { getFullMarketsHandler } = require("./controllers/skyexchange/fullMarkets.controller");
app.get("/api/v1/odds/full/:eventId", apiAccessGuard('SkyExchange', '/api/v1/odds/full'), getFullMarketsHandler); // ⚡ LIVE Full Markets/Betfair Odds (REST API)

const { getOtherMenuHandler } = require("./controllers/skyexchange/otherMenu.controller");
app.get("/api/v1/event/markets/:sportId/:eventId", apiAccessGuard('SkyExchange', '/api/v1/event/markets'), getOtherMenuHandler); // ⚡ Market List (Other Menu)

const { handleSportRadarRefresh, handleGetSportRadarToken } = require("./controllers/sportradar/sportRadarAuth.controller");
app.get("/api/v1/auth/sportradar/refresh", apiAccessGuard('SportRadar', '/api/v1/auth/sportradar/refresh'), handleSportRadarRefresh); // ⚡ Force Refresh SportRadar Token
app.get("/api/v1/auth/sportradar/token", apiAccessGuard('SportRadar', '/api/v1/auth/sportradar/token'), handleGetSportRadarToken); // ⚡ Get Current SportRadar Token

const { getSportRadarOddsHandler } = require("./controllers/sportradar/sportRadarMarketsResult.controller");
app.get("/api/v1/odds/sportradermarkets/result/:sportId/:eventId", apiAccessGuard('SportRadar', '/api/v1/odds/sportradermarkets/result'), getSportRadarOddsHandler); // ⚡ LIVE SportRadar Individual Markets (REST API)

const { getSportRadarBetfairHandler } = require("./controllers/sportradar/sportRadarBetfair.controller");
app.get("/api/v1/odds/sportradermarkets/accordingbetfair/:sportId/:eventId", apiAccessGuard('SportRadar', '/api/v1/odds/sportradermarkets/accordingbetfair'), getSportRadarBetfairHandler); // ⚡ LIVE SportRadar Betfair Markets (REST API)

const { getSportRadarCoreMarketsHandler } = require("./controllers/sportradar/sportRadarCoreMarkets.controller");
app.get("/api/v1/odds/sportradermarkets/core/:sportId/:eventId", apiAccessGuard('SportRadar', '/api/v1/odds/sportradermarkets/core'), getSportRadarCoreMarketsHandler); // ⚡ LIVE SportRadar Core Markets (REST API)

const { getThe100exchFancyHandler } = require("./controllers/the100exch/the100exchFancy.controller");
app.get("/api/v1/odds/t10/fancymarkets/:eventId", apiAccessGuard('The100exch', '/api/v1/odds/t10/fancymarkets'), getThe100exchFancyHandler); // ⚡ LIVE The100exch Fancy Markets (REST API)

const { getT10FancyResultHandler } = require("./controllers/the100exch/t10FancyResult.controller");
app.get("/api/v1/odds/t10/fancymarketsresult/:eventId", apiAccessGuard('The100exch', '/api/v1/odds/t10/fancymarketsresult'), getT10FancyResultHandler); // ⚡ LIVE The100exch Fancy Markets Result (REST API)

const { getBetfairMarketResultHandler } = require("./controllers/betfair/betfairMarketResult.controller");
app.get("/api/v1/odds/betfair/marketsresult", apiAccessGuard('Betfair', '/api/v1/odds/betfair/marketsresult'), getBetfairMarketResultHandler); // ⚡ LIVE UK Proxy Betfair Market Results (REST API)

const { getKingSportsHandler } = require("./controllers/kingexchange/kingSports.controller");
const { getKingEventsHandler, getKingResultsHandler } = require("./controllers/kingexchange/kingExchange.controller");

app.get("/api/v1/kx/sports", apiAccessGuard('KingExchange', '/api/v1/kx/sports'), getKingSportsHandler); // Legacy Sports List
app.get("/api/v1/kx/events", apiAccessGuard('KingExchange', '/api/v1/kx/events'), getKingEventsHandler); // ⚡ New High-Speed All Events
app.get("/api/v1/kx/results/:eventId", apiAccessGuard('KingExchange', '/api/v1/kx/results'), getKingResultsHandler); // ⚡ New High-Speed Market Results

app.get("/test-socket", (req, res) => {
  res.sendFile(__dirname + "/test_socket.html");
});

const path = require("path");

// ================= ADMIN PANEL ROUTES =================
const adminRoutes = require("./routes/admin/admin.routes");
app.use("/api/v1/admin", adminRoutes);

// ================= SERVE ADMIN UI (REACT VITE) =================
app.use("/admin", express.static(path.join(__dirname, "admin-panel", "dist")));
app.get(/^\/admin/, (req, res) => {
  res.sendFile(path.join(__dirname, "admin-panel", "dist", "index.html"));
});
// ========================================================

const { getCookie } = require("./controllers/auth/cookie.controller");
const { getToken } = require("./controllers/auth/auth.controller");



// (Proxy routes removed as requested)

// 🛠️ TEST PAGE (Generates Iframe)
app.get("/test", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>GLive Embed Tester</title>
            <style>
                body { font-family: sans-serif; padding: 20px; text-align: center; background: #f0f0f0; }
                input { padding: 10px; width: 300px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px; }
                button { padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
                button:hover { background: #0056b3; }
                #result { margin-top: 20px; }
                textarea { width: 80%; height: 60px; margin-top: 10px; font-family: monospace; }
                iframe { margin-top: 20px; border: 2px solid #000; background: #000; }
            </style>
        </head>
        <body>
            <h1>GLive Embed Generator</h1>
            <p>Enter Event ID to generate Iframe and watch stream.</p>
            <input type="text" id="eventId" placeholder="Enter Event ID (e.g., 35254881)" value="35254881" />
            <button onclick="generate()">Play Stream</button>
            
            <div id="result" style="display:none;">
                <h3>Copy This Code:</h3>
                <textarea id="code" readonly></textarea>
                <h3>Preview:</h3>
                <div id="preview"></div>
            </div>

            <script>
                function generate() {
                    var id = document.getElementById('eventId').value.trim();
                    if(!id) return alert("Please enter Event ID");
                    
                    var url = window.location.origin + "/embed/" + id;
                    var code = '<iframe src="' + url + '" width="100%" height="450px" frameborder="0" allowfullscreen></iframe>';
                    
                    document.getElementById('code').value = code;
                    document.getElementById('preview').innerHTML = code;
                    document.getElementById('result').style.display = 'block';
                }
            </script>
        </body>
        </html>
    `);
});

app.get("/debug/status", (req, res) => {
  res.json({
    cookie: getCookie() ? "READY" : "MISSING",
    token: getToken() ? "READY" : "MISSING",
    env: process.env.NODE_ENV || "development"
  });
});

app.get("/debug/events", async (req, res) => {
  try {
    const total = await Event.countDocuments();
    const events = await Event.find({}, "eventId name streamUrl").limit(10).sort({ updatedAt: -1 }).lean();
    res.json({ total, latest: events });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= WARMUP ON SERVER START =================
const connectDB = require("./config/db");

(async () => {
  try {
    console.log("⚡ WARMUP START");
    await connectDB();

    // 0️⃣ Admin Admin Seeding (Phase 4)
    const { seedAdmin } = require("./controllers/admin/adminAuth.controller");
    await seedAdmin();

    // 1️⃣ FAST STARTUP: Load from DB
    const loadedToken = await loadToken();
    const loadedCookie = await loadCookie();

    if (loadedToken && loadedCookie) {
      console.log("🚀 SYSTEM READY (FAST START)");
    } else {
      console.log("⚠️ CACHE MISS - DOING FRESH LOGIN...");
      // 2️⃣ Fallback: Fresh Login
      const token = await login();
      await generateCookie(token);
      console.log("✅ SYSTEM READY (FRESH LOGIN)");
    }

    // 3️⃣ KingExchange Warmup (Fetch once and cache forever)
    const { fetchAndCacheKingSports } = require("./services/kingexchange/kingSports.service");
    await fetchAndCacheKingSports();

    // 4️⃣ KingExchange King-Level Sync (Discovery + Result Worker)
    const { startKingSync } = require("./cron/kingexchange/kingSync.cron");
    startKingSync();

    console.log("✅ SYSTEM READY: TOKEN & COOKIE SET");
  } catch (e) {
    console.log("❌ WARMUP FAILED:", e.message);
  }
})();

// ================= START SERVER =================
server.listen(PORT, () => {
  console.log(`🚀 GLIVE RUNNING ON PORT ${PORT}`);
});
