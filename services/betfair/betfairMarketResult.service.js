const axios = require("axios");
const BetfairMarketResult = require("../../models/BetfairMarketResult");

const PROXY_URL = "https://apidiamoncasino.online/betfair.php";
const PROXY_KEY = "9wicket_super_secret_123";

// ⚡ 20-Year Exp Strategy: 1-Second Micro-Cache & Promise Locks
const marketResultCache = new Map();
const fetchLocks = new Map();

/**
 * Maps the Betfair eventTypeId to a human-readable sport name.
 */
function getSportName(id) {
    if (id === 4) return "Cricket";
    if (id === 1 || id === 894) return "Soccer";
    if (id === 2) return "Tennis";
    return "Unknown";
}

/**
 * Fetches market data from the proxy, formats it, caches it, and UPSERTS to MongoDB.
 * @param {String} marketIds - Comma separated market IDs.
 */
async function fetchAndSaveBetfairMarketResult(marketIds) {
    const cacheKey = marketIds;
    const now = Date.now();
    const cached = marketResultCache.get(cacheKey);

    // 1. Extreme Speed Cache (Return immediately if < 1 second old)
    if (cached && (now - cached.lastUpdated) < 1000) {
        return cached.data;
    }

    // 2. Concurrency Lock
    if (fetchLocks.has(cacheKey)) {
        return fetchLocks.get(cacheKey);
    }

    const fetchPromise = (async () => {
        try {
            const url = `${PROXY_URL}?key=${PROXY_KEY}&marketIds=${marketIds}`;
            const res = await axios.get(url, { timeout: 10000 });
            const data = res.data;

            if (!data || !data.eventTypes) {
                return null;
            }

            const processedResults = [];

            // 3. Deep JSON Parsing & Flattening
            for (const eventType of data.eventTypes) {
                const eventTypeId = eventType.eventTypeId;
                const sportName = getSportName(eventTypeId);

                if (!eventType.eventNodes) continue;

                for (const eventNode of eventType.eventNodes) {
                    const eventId = eventNode.eventId;

                    if (!eventNode.marketNodes) continue;

                    for (const marketNode of eventNode.marketNodes) {
                        const marketId = marketNode.marketId;
                        const marketStatus = marketNode.state ? marketNode.state.status : "UNKNOWN";

                        const runners = [];
                        if (marketNode.runners) {
                            for (const runner of marketNode.runners) {
                                const runnerStatus = runner.state ? runner.state.status : "UNKNOWN";

                                // ⚡ 20-Year Exp Logic: Settled vs Unsettled
                                let isResult = "Unsettled";
                                let mappedResult = "Unsettled";

                                if (marketStatus === "CLOSED") {
                                    isResult = "Settled";

                                    // Assign true results only when settled
                                    if (runnerStatus === "WINNER") mappedResult = "WINNER";
                                    else if (runnerStatus === "LOSER") mappedResult = "LOSER";
                                    else if (runnerStatus === "REMOVED") mappedResult = "REMOVED";
                                    else mappedResult = runnerStatus; // Fallback
                                } else {
                                    // Market is OPEN or SUSPENDED
                                    isResult = "Unsettled";
                                    mappedResult = "Unsettled";
                                }

                                runners.push({
                                    selectionId: runner.selectionId,
                                    runnerName: `Selection ${runner.selectionId}`, // Default generic name
                                    handicap: runner.handicap || 0,
                                    state: {
                                        sortPriority: runner.state ? runner.state.sortPriority : 0,
                                        lastPriceTraded: runner.state ? runner.state.lastPriceTraded : 0,
                                        totalMatched: runner.state ? runner.state.totalMatched : 0,
                                        status: runnerStatus, // ACTIVE, WINNER, LOSER, REMOVED
                                        isResult: isResult,
                                        result: mappedResult
                                    }
                                });
                            }
                        }

                        const resultObj = {
                            marketId,
                            eventId,
                            eventTypeId,
                            sportName,
                            status: marketStatus,
                            runners,
                            updatedAt: new Date()
                        };

                        processedResults.push(resultObj);

                        // 4. Upsert (Update or Insert) securely into DB
                        try {
                            const existing = await BetfairMarketResult.findOne({ marketId });
                            if (existing) {
                                // Smart Timestamping: Only update statusUpdatedAt if it transitioned to CLOSED right now
                                if (existing.status !== "CLOSED" && marketStatus === "CLOSED") {
                                    resultObj.statusUpdatedAt = new Date();
                                } else {
                                    resultObj.statusUpdatedAt = existing.statusUpdatedAt; // Keep original closure time
                                }
                                await BetfairMarketResult.updateOne({ marketId }, { $set: resultObj });
                            } else {
                                resultObj.statusUpdatedAt = new Date(); // Initial creation time
                                await BetfairMarketResult.create(resultObj);
                            }
                        } catch (dbErr) {
                            console.error(`❌ DB Upsert Error for Betfair Market ${marketId}:`, dbErr.message);
                        }
                    }
                }
            }

            // Update Cache
            marketResultCache.set(cacheKey, { data: processedResults, lastUpdated: Date.now() });
            return processedResults;

        } catch (e) {
            console.error(`❌ Betfair UK Proxy Error for marketIds ${marketIds}:`, e.message);

            // Fallback: If proxy is down but we have the data in the DB, return DB data
            const fallbackArray = marketIds.split(",").map(id => id.trim());
            const fallbackData = await getBetfairMarketResultFromDB(fallbackArray);
            if (fallbackData && fallbackData.length > 0) {
                console.log(`⚠️ Returning DB Fallback for Betfair Market ${marketIds}`);
                return fallbackData;
            }

            return null;
        } finally {
            fetchLocks.delete(cacheKey);
        }
    })();

    fetchLocks.set(cacheKey, fetchPromise);
    return fetchPromise;
}

/**
 * Fast direct read from MongoDB using the indexed field `marketId`.
 */
async function getBetfairMarketResultFromDB(marketIdsArray) {
    return await BetfairMarketResult.find({ marketId: { $in: marketIdsArray } });
}

module.exports = {
    fetchAndSaveBetfairMarketResult,
    getBetfairMarketResultFromDB
};
