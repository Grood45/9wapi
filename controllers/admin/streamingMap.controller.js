const StreamingMap = require("../../models/StreamingMap");
const axios = require("axios");
const { syncEvents } = require("../../cron/streaming/streamingSync.cron");

const sports = [1, 2, 4]; // Soccer, Tennis, Cricket

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Dual-Source Fetching: Fetch raw events from providers to show unmapped options.
 * 2. Atomic Merging: Ensure manual mappings are prioritized over auto-mappings.
 * 3. Clean UI Response: Return structured data for the side-by-side merger UI.
 */

async function getUnmappedEvents(req, res) {
    const { sportId, inplay } = req.query; // 1, 2, 4 | 0, 1
    try {
        if (!sportId) return res.status(400).json({ error: "MISSING_SPORT_ID" });

        const diamondUrls = {
            1: "https://marketsarket.qnsports.live/getsoccermatches",
            2: "https://marketsarket.qnsports.live/gettennismatches",
            4: null 
        };

        const dUrl = diamondUrls[sportId];
        
        // 1. Fetch from Providers (Betfair, Diamond, D247)
        const [bfRes, dRes, d247Res] = await Promise.all([
            axios.get(`https://111111.info/pad=82/listGames?sport=${sportId}&inplay=${inplay || 1}`).catch(err => {
                console.error("❌ [BF_FETCH_ERROR]", err.message);
                return { data: [] };
            }),
            dUrl ? axios.get(dUrl).catch(err => {
                console.error("❌ [DIAMOND_FETCH_ERROR]", err.message);
                return { data: [] };
            }) : Promise.resolve({ data: [] }),
            axios.get('https://feed.igames.cloud/api/matches/inplay-and-upcoming', {
                headers: { 'x-igames-key': 'sdfd89453n-dsak432-JGdas834-Pks73ndsa-Hfg38bhb' }
            }).catch(err => {
                console.error("❌ [D247_FETCH_ERROR]", err.message);
                return { data: { data: { matches: [] } } };
            })
        ]);

        const betfairRaw = bfRes.data?.result || (Array.isArray(bfRes.data) ? bfRes.data : []);
        const diamondRaw = dRes.data || [];
        const d247Raw = (d247Res.data?.data?.matches || []).filter(e => e.sport_id == sportId && e.in_play == (inplay == 1));

        // 2. Filter out already mapped IDs from DB
        const existingMappings = await StreamingMap.find({ sportId }).lean();
        const mappedBfIds = new Set(existingMappings.map(m => m.betfairId));
        const mappedDIds = new Set(existingMappings.map(m => m.diamondId).filter(id => id));
        const mappedD247Ids = new Set(existingMappings.map(m => m.d247Id).filter(id => id));

        const unmappedBetfair = betfairRaw.filter(e => !mappedBfIds.has(e.eventId.toString()));
        const unmappedDiamond = diamondRaw.filter(e => !mappedDIds.has(e.gmid.toString()));
        const unmappedD247 = d247Raw.filter(e => !mappedD247Ids.has(e.event_id.toString()));

        res.json({
            success: true,
            betfair: unmappedBetfair.map(e => ({ id: e.eventId, name: e.eventName, time: e.startTime })),
            diamond: unmappedDiamond.map(e => ({ id: e.gmid, name: e.ename })),
            d247: unmappedD247.map(e => ({ id: e.event_id, name: e.event_name, time: e.start_time }))
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function mergeEvents(req, res) {
    const { betfairId, diamondId, d247Id, eventName, sportId } = req.body;
    try {
        if (!betfairId || !eventName || !sportId) {
            return res.status(400).json({ error: "MISSING_REQUIRED_FIELDS" });
        }

        const updateData = { 
            eventName, 
            sportId: Number(sportId), 
            status: 'manual',
            createdAt: new Date() 
        };
        if (diamondId) updateData.diamondId = diamondId.toString();
        if (d247Id) updateData.d247Id = d247Id.toString();

        const mapping = await StreamingMap.findOneAndUpdate(
            { betfairId: betfairId.toString() },
            updateData,
            { upsert: true, new: true }
        );

        res.json({ success: true, mapping });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// 🚀 Performance Cache: Storing Live Betfair IDs to avoid redundant API hits (30s TTL)
let BF_LIVE_CACHE = {
    data: new Set(),
    lastFetched: 0
};

async function getLiveBfIds() {
    const NOW = Date.now();
    if (NOW - BF_LIVE_CACHE.lastFetched < 30000 && BF_LIVE_CACHE.data.size > 0) {
        return BF_LIVE_CACHE.data;
    }

    try {
        const liveIds = new Set();
        
        await Promise.all(sports.map(async (sId) => {
            const res = await axios.get(`https://111111.info/pad=82/listGames?sport=${sId}&inplay=1`).catch(() => ({ data: {} }));
            const games = res.data?.result || (Array.isArray(res.data) ? res.data : []);
            games.forEach(g => {
                if (g.eventId) liveIds.add(g.eventId.toString());
            });
        }));

        BF_LIVE_CACHE = { data: liveIds, lastFetched: NOW };
        return liveIds;
    } catch (e) {
        console.error("❌ [LIVE_STATUS_ERROR]", e.message);
        return BF_LIVE_CACHE.data;
    }
}

async function listMappings(req, res) {
    try {
        const [mappings, liveIds] = await Promise.all([
            StreamingMap.find().sort({ createdAt: -1 }).lean(),
            getLiveBfIds()
        ]);

        const enrichedMappings = mappings.map(m => ({
            ...m,
            isInplay: liveIds.has(m.betfairId)
        }));

        res.json({ success: true, mappings: enrichedMappings });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function unlinkMapping(req, res) {
    const { id } = req.params;
    try {
        await StreamingMap.findByIdAndDelete(id);
        res.json({ success: true, message: "UNLINKED_SUCCESSFULLY" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function getMappingDetails(req, res) {
    const { bfId, dId } = req.params;
    try {
        const mapping = await StreamingMap.findOne({ betfairId: bfId });
        if (!mapping) return res.status(404).json({ error: "MAPPING_NOT_FOUND" });

        const sportId = mapping.sportId;
        const d247Id = mapping.d247Id;

        const diamondUrls = {
            1: "https://marketsarket.qnsports.live/getsoccermatches",
            2: "https://marketsarket.qnsports.live/gettennismatches",
            4: null
        };

        const dUrl = diamondUrls[sportId];

        const [bfLive, bfUpcoming, dRes, d247Res] = await Promise.all([
            axios.get(`https://111111.info/pad=82/listGames?sport=${sportId}&inplay=1`).catch(() => ({ data: {} })),
            axios.get(`https://111111.info/pad=82/listGames?sport=${sportId}&inplay=0`).catch(() => ({ data: {} })),
            dUrl ? axios.get(dUrl).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            axios.get('https://feed.igames.cloud/api/matches/inplay-and-upcoming', {
                headers: { 'x-igames-key': 'sdfd89453n-dsak432-JGdas834-Pks73ndsa-Hfg38bhb' }
            }).catch(() => ({ data: { data: { matches: [] } } }))
        ]);

        const bfEvents = [
            ...(bfLive.data?.result || (Array.isArray(bfLive.data) ? bfLive.data : [])),
            ...(bfUpcoming.data?.result || (Array.isArray(bfUpcoming.data) ? bfUpcoming.data : []))
        ];
        const dEvents = dRes.data || [];
        const d247Events = d247Res.data?.data?.matches || [];

        const betfairRaw = bfEvents.find(e => e.eventId.toString() === bfId);
        const diamondRaw = dEvents.find(e => e.gmid.toString() === dId);
        const d247Raw = d247Events.find(e => e.event_id.toString() === d247Id);

        res.json({
            success: true,
            betfair: betfairRaw || { message: "Not found in current provider list" },
            diamond: diamondRaw || { message: "Not found in current provider list" },
            d247: d247Raw || { message: d247Id ? "Not found in list" : "No mapping exists" }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function getStreamingStats(req, res) {
    try {
        const d247Res = await axios.get('https://feed.igames.cloud/api/matches/inplay-and-upcoming', {
            headers: { 'x-igames-key': 'sdfd89453n-dsak432-JGdas834-Pks73ndsa-Hfg38bhb' }
        }).catch(() => ({ data: { data: { matches: [] } } }));
        const d247All = d247Res.data?.data?.matches || [];

        const [bfAllRes, dResSoccer, dResTennis, mappings] = await Promise.all([
            Promise.all(sports.map(async sId => {
                const [live, upcoming] = await Promise.all([
                    axios.get(`https://111111.info/pad=82/listGames?sport=${sId}&inplay=1`).catch(() => ({ data: {} })),
                    axios.get(`https://111111.info/pad=82/listGames?sport=${sId}&inplay=0`).catch(() => ({ data: {} }))
                ]);
                return [
                    ...(live.data?.result || (Array.isArray(live.data) ? live.data : [])),
                    ...(upcoming.data?.result || (Array.isArray(upcoming.data) ? upcoming.data : []))
                ].map(e => ({ ...e, sportId: sId }));
            })),
            axios.get("https://marketsarket.qnsports.live/getsoccermatches").catch(() => ({ data: [] })),
            axios.get("https://marketsarket.qnsports.live/gettennismatches").catch(() => ({ data: [] })),
            StreamingMap.find().lean()
        ]);

        const diamondAll = [...(dResSoccer.data || []), ...(dResTennis.data || [])];

        const bfEvents = bfAllRes.flat();
        const mappedBfIds = new Set(mappings.map(m => m.betfairId));

        const totalBf = bfEvents.length;
        const totalMapped = bfEvents.filter(e => mappedBfIds.has(e.eventId.toString())).length;
        
        const diamondCount = mappings.filter(m => m.diamondId).length;
        const d247Count = mappings.filter(m => m.d247Id).length;

        // Sport wise breakdown
        const statsBySport = sports.reduce((acc, sId) => {
            const bfForSport = bfEvents.filter(e => e.sportId === sId);
            const dForSport = sId === 4 ? [] : diamondAll.filter(e => (sId === 1 && e.ename.match(/Soccer|Football/i)) || (sId === 2 && !e.ename.match(/Soccer|Football/i))); // Basic filter for diamond ename
            
            // Diamond mapping logic in stats needs better sport detection if possible
            const d247ForSport = d247All.filter(e => e.sport_id == sId);

            const total = bfForSport.length;
            const mapped = bfForSport.filter(e => mappedBfIds.has(e.eventId.toString())).length;

            acc[sId === 4 ? 'Cricket' : sId === 1 ? 'Soccer' : 'Tennis'] = {
                betfair: total,
                diamond: sId === 4 ? 0 : (sId === 1 ? (dResSoccer.data?.length || 0) : (dResTennis.data?.length || 0)),
                d247: d247ForSport.length,
                mapped,
                percent: total > 0 ? ((mapped / total) * 100).toFixed(1) : 0
            };
            return acc;
        }, {});

        const { getNextSyncSeconds } = require("../../cron/streaming/streamingSync.cron");

        res.json({
            success: true,
            summary: {
                totalBetfair: totalBf,
                totalMapped: totalMapped,
                overallPercent: totalBf > 0 ? ((totalMapped / totalBf) * 100).toFixed(1) : 0,
                diamondMapped: diamondCount,
                d247Mapped: d247Count,
                nextSyncSeconds: getNextSyncSeconds()
            },
            breakdown: statsBySport
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

async function forceSync(req, res) {
    try {
        await syncEvents();
        res.json({ success: true, message: "SYNC_TRIGGERED_SUCCESSFULLY" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

module.exports = { getUnmappedEvents, mergeEvents, listMappings, unlinkMapping, getMappingDetails, getStreamingStats, forceSync };
