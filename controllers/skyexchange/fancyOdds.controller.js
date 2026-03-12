const { fetchFancyOdds } = require("../../services/skyexchange/fancyOdds.service");

/**
 * REST Handler for fetching fancy (session) odds for a specific match.
 */
async function getFancyOddsHandler(req, res) {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ success: false, message: "Event ID is required." });
    }

    const data = await fetchFancyOdds(eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch fancy odds from provider." });
    }

    return res.status(200).json({
        success: true,
        eventId: eventId,
        data: data
    });
}

module.exports = {
    getFancyOddsHandler
};
