const axios = require("axios");
const cron = require("node-cron");
const StreamingMap = require("../../models/StreamingMap");

/**
 * 🛰️ Streaming Magic Sync v3.0 (History-Aware)
 */

let lastSyncTimestamp = Date.now();
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

function getNextSyncSeconds() {
    const elapsed = Date.now() - lastSyncTimestamp;
    const remaining = Math.max(0, SYNC_INTERVAL_MS - elapsed);
    return Math.floor(remaining / 1000);
}

function similarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

async function syncEvents() {
    lastSyncTimestamp = Date.now();
    console.log("📡 [SYNC_START] Streaming Event Mapping Worker");

    try {
        const d247Res = await axios.get('https://feed.igames.cloud/api/matches/inplay-and-upcoming', {
            headers: { 'x-igames-key': 'sdfd89453n-dsak432-JGdas834-Pks73ndsa-Hfg38bhb' }
        }).catch(() => ({ data: { data: { matches: [] } } }));
        const d247All = d247Res.data?.data?.matches || [];

        const sports = [
            { id: 4, name: "Cricket", diamondUrl: null }, 
            { id: 1, name: "Soccer", diamondUrl: "https://marketsarket.qnsports.live/getsoccermatches" },
            { id: 2, name: "Tennis", diamondUrl: "https://marketsarket.qnsports.live/gettennismatches" }
        ];

        for (const sport of sports) {
            const [bfLive, bfUpcoming, diamondRes] = await Promise.all([
                axios.get(`https://111111.info/pad=82/listGames?sport=${sport.id}&inplay=1`).catch(() => ({ data: [] })),
                axios.get(`https://111111.info/pad=82/listGames?sport=${sport.id}&inplay=0`).catch(() => ({ data: [] })),
                sport.diamondUrl ? axios.get(sport.diamondUrl).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
            ]);

            const bfEvents = [
                ...(bfLive.data?.result || (Array.isArray(bfLive.data) ? bfLive.data : [])),
                ...(bfUpcoming.data?.result || (Array.isArray(bfUpcoming.data) ? bfUpcoming.data : []))
            ];
            const diamondEvents = diamondRes.data || [];
            const d247Events = d247All.filter(e => e.sport_id == sport.id);

            console.log(`🔍 [${sport.name}] Betfair: ${bfEvents.length}, Diamond: ${diamondEvents.length}, D247: ${d247Events.length}`);

            // 1. PHASE ONE: Match Diamond to Betfair
            for (const dEvent of diamondEvents) {
                const dName = dEvent.ename || "";
                const dId = dEvent.gmid || "";
                if (!dName || !dId) continue;

                let bestMatch = null;
                let highestScore = 0;
                const cleanD = dName.toLowerCase().replace(/[^a-z0-9]/g, '');

                for (const bfEvent of bfEvents) {
                    const cleanBf = bfEvent.eventName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const score = similarity(cleanD, cleanBf);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = bfEvent;
                    }
                }

                if (highestScore > 0.85 && bestMatch) {
                    const eventDate = new Date(bestMatch.startTime);
                    const updateData = { diamondId: dId.toString(), eventName: bestMatch.eventName, sportId: sport.id, status: "auto" };
                    if (!isNaN(eventDate.getTime())) updateData.eventTime = eventDate;

                    await StreamingMap.findOneAndUpdate({ betfairId: bestMatch.eventId.toString() }, { $set: updateData }, { upsert: true });
                }
            }

            // 2. PHASE TWO: Match D247 to Betfair
            for (const d247Event of d247Events) {
                const name = d247Event.event_name;
                const id = d247Event.event_id;
                if (!name || !id) continue;

                let bestMatch = null;
                let highestScore = 0;
                const cleanD247 = name.toLowerCase().replace(/[^a-z0-9]/g, '');

                for (const bfEvent of bfEvents) {
                    const cleanBf = bfEvent.eventName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const score = similarity(cleanD247, cleanBf);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = bfEvent;
                    }
                }

                if (highestScore > 0.85 && bestMatch) {
                    const eventDate = new Date(bestMatch.startTime);
                    const updateData = { d247Id: id.toString(), eventName: bestMatch.eventName, sportId: sport.id, status: "auto" };
                    if (!isNaN(eventDate.getTime())) updateData.eventTime = eventDate;

                    await StreamingMap.findOneAndUpdate({ betfairId: bestMatch.eventId.toString() }, { $set: updateData }, { upsert: true });
                }
            }

            // 3. PHASE THREE: History-Aware Auto-Recovery (For Betfair events still missing IDs)
            const currentMappings = await StreamingMap.find({ sportId: sport.id }).lean();
            const mappedBfIds = new Set(currentMappings.map(m => m.betfairId));

            for (const bfEvent of bfEvents) {
                const bfId = bfEvent.eventId.toString();
                // If not mapped at all OR missing one of the providers
                const existing = currentMappings.find(m => m.betfairId === bfId);
                if (!existing || (!existing.diamondId && !existing.d247Id)) {
                    const cleanBfName = bfEvent.eventName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    // Search DB for anyone else with similar name who DOES have IDs
                    const historyMatch = await StreamingMap.findOne({
                        eventName: { $regex: new RegExp(cleanBfName.split('').join('.*'), 'i') },
                        sportId: sport.id,
                        $or: [{ diamondId: { $ne: null } }, { d247Id: { $ne: null } }]
                    }).sort({ updatedAt: -1 }).lean();

                    if (historyMatch) {
                        const eventDate = new Date(bfEvent.startTime);
                        const updateData = {
                            diamondId: existing?.diamondId || historyMatch.diamondId,
                            d247Id: existing?.d247Id || historyMatch.d247Id,
                            eventName: bfEvent.eventName,
                            sportId: sport.id,
                            status: "auto_history"
                        };
                        if (!isNaN(eventDate.getTime())) updateData.eventTime = eventDate;

                        await StreamingMap.findOneAndUpdate({ betfairId: bfId }, { $set: updateData }, { upsert: true });
                    }
                }
            }
        }

        console.log("✅ [SYNC_FINISH] Streaming Event Mapping Worker");
    } catch (e) {
        console.error("❌ [SYNC_GLOBAL_ERROR]", e.message);
    }
}

// 🕒 Run every 5 minutes
cron.schedule("*/5 * * * *", syncEvents);

module.exports = { syncEvents, getNextSyncSeconds };
