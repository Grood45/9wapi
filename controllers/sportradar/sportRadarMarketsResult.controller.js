const { fetchSportRadarOdds } = require("../../services/sportradar/sportRadarMarketsResult.service");

/**
 * REST Handler for fetching SportRadar-specific markets.
 */
async function getSportRadarOddsHandler(req, res) {
    const { sportId, eventId } = req.params;

    if (!sportId || !eventId) {
        return res.status(400).json({ success: false, message: "Sport ID and Event ID are required." });
    }

    const data = await fetchSportRadarOdds(sportId, eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch SportRadar odds from provider." });
    }

    return res.status(200).json({
        success: true,
        sportId: sportId.includes("sr:") ? sportId : `sr:sport:${sportId}`,
        eventId: eventId.includes("sr:") ? eventId : `sr:match:${eventId}`,
        data: data
    });
}

module.exports = {
    getSportRadarOddsHandler
};
