const { fetchSportRadarCoreMarkets } = require("../../services/sportradar/sportRadarCoreMarkets.service");

/**
 * REST Handler for fetching SportRadar Core markets.
 */
async function getSportRadarCoreMarketsHandler(req, res) {
    const { sportId, eventId } = req.params;

    if (!sportId || !eventId) {
        return res.status(400).json({ success: false, message: "Sport ID and Event ID are required." });
    }

    const data = await fetchSportRadarCoreMarkets(sportId, eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch core markets from SportRadar provider." });
    }

    // Return exact provider response payload structure to match original
    return res.status(200).json(data);
}

module.exports = {
    getSportRadarCoreMarketsHandler
};
