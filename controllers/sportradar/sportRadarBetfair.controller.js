const { fetchSportRadarBetfair } = require("../../services/sportradar/sportRadarBetfair.service");

/**
 * REST Handler for fetching SportRadar Betfair markets.
 */
async function getSportRadarBetfairHandler(req, res) {
    const { sportId, eventId } = req.params;

    if (!sportId || !eventId) {
        return res.status(400).json({ success: false, message: "Sport ID and Event ID are required." });
    }

    const data = await fetchSportRadarBetfair(sportId, eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch Betfair markets from SportRadar provider." });
    }

    // Return exact provider response payload structure to match original
    return res.status(200).json(data);
}

module.exports = {
    getSportRadarBetfairHandler
};
