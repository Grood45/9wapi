const { fetchSportsbookOdds } = require("../../services/skyexchange/sportsbook.service");

/**
 * REST Handler for fetching sportsbook odds for a specific match.
 */
async function getSportsbookOddsHandler(req, res) {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ success: false, message: "Event ID is required." });
    }

    const data = await fetchSportsbookOdds(eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch odds from provider." });
    }

    return res.status(200).json({
        success: true,
        eventId: eventId,
        data: data
    });
}

module.exports = {
    getSportsbookOddsHandler
};
