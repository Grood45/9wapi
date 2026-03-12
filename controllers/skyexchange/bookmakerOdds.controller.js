const { fetchBookmakerOdds } = require("../../services/skyexchange/bookmakerOdds.service");

/**
 * REST Handler for fetching bookmaker odds for a specific match.
 */
async function getBookmakerOddsHandler(req, res) {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ success: false, message: "Event ID is required." });
    }

    const data = await fetchBookmakerOdds(eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch bookmaker odds from provider." });
    }

    return res.status(200).json({
        success: true,
        eventId: eventId,
        data: data
    });
}

module.exports = {
    getBookmakerOddsHandler
};
