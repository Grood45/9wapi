const axios = require("axios");
const crypto = require("crypto");
const TomorrowEvent = require("../../models/TomorrowEvent");
const { getCookie } = require("../../controllers/auth/cookie.controller");

const API_URL = "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/queryEvents";

let tomorrowEventsCache = [];
let lastDataHash = "";

function generateHash(dataString) {
    return crypto.createHash("md5").update(dataString).digest("hex");
}

async function fetchAndCacheTomorrowEvents() {
    try {
        const cookie = getCookie();
        if (!cookie) return;

        const queryPass = cookie.split("JSESSIONID=")[1]?.split(";")[0] || "";
        const urlObj = new URL(API_URL);
        const origin = `${urlObj.protocol}//${urlObj.host.replace('bkqawscf.', 'www.')}`;

        const body = new URLSearchParams({
            type: "tomorrow",
            eventTs: "-1",
            marketTs: "-1",
            eventType: "-1",
            selectionTs: "-1",
            queryPass: queryPass
        }).toString();

        const res = await axios.post(API_URL, body, {
            headers: {
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": origin,
                "Referer": `${origin}/`,
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
                "Cookie": cookie,
                "Authorization": queryPass
            },
            timeout: 15000
        });

        const eventList = res.data?.events || [];
        if (!Array.isArray(eventList)) return;

        tomorrowEventsCache = eventList;

        const currentHash = generateHash(JSON.stringify(eventList.map(e => e.id)));
        if (currentHash === lastDataHash) return;
        lastDataHash = currentHash;

        const operations = eventList.map(event => ({
            updateOne: {
                filter: { eventId: String(event.id) },
                update: {
                    $set: {
                        eventId: String(event.id),
                        name: event.eventName || event.name,
                        eventType: String(event.eventType),
                        marketId: String(event.marketId || ""),
                        openDate: event.openDate ? new Date(event.openDate) : new Date(),
                        rawData: event,
                        updatedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await TomorrowEvent.bulkWrite(operations, { ordered: false });
        }

        const currentIds = eventList.map(e => String(e.id));
        await TomorrowEvent.deleteMany({ eventId: { $nin: currentIds } });

    } catch (e) {
        console.log("❌ TOMORROW EVENTS FETCH ERROR:", e.message);
    }
}

function getCachedTomorrowEvents() {
    return tomorrowEventsCache;
}

module.exports = { fetchAndCacheTomorrowEvents, getCachedTomorrowEvents };
