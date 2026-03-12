const { fetchAndSaveBetfairMarketResult } = require("../../services/betfair/betfairMarketResult.service");

/**
 * REST Handler for fetching Betfair Market Results via UK Proxy.
 */
async function getBetfairMarketResultHandler(req, res) {
    let marketIds = req.query.marketIds || req.params.marketIds;

    if (!marketIds) {
        return res.status(400).json({ success: false, message: "marketIds parameter is required" });
    }

    const data = await fetchAndSaveBetfairMarketResult(marketIds);

    if (!data || data.length === 0) {
        return res.status(500).json({ success: false, message: "Failed to fetch market results from Betfair provider." });
    }

    // Return the perfectly formatted array of results
    return res.status(200).json(data);
}

module.exports = {
    getBetfairMarketResultHandler
};
