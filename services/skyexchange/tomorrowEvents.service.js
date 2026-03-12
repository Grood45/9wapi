const axios = require("axios");
const crypto = require("crypto");
const TomorrowEvent = require("../../models/TomorrowEvent");
const { getCookie } = require("../../controllers/auth/cookie.controller");

const API_URL = "https://bxawscf.skyinplay.com/exchange/member/playerService/queryEvents";

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
                "Host": "bxawscf.skyinplay.com",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Origin": "https://bxawscf.skyinplay.com",
                "Referer": "https://bxawscf.skyinplay.com/",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:148.0) Gecko/20100101 Firefox/148.0",
                "X-Requested-With": "XMLHttpRequest",
                "Cookie": cookie
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
