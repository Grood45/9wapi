const { fetchFullMarkets } = require("../../services/skyexchange/fullMarkets.service");

/**
 * REST Handler for fetching full (Betfair) markets for a specific match.
 */
async function getFullMarketsHandler(req, res) {
    const { eventId } = req.params;
    const { marketId } = req.query; // Optional marketId

    if (!eventId) {
        return res.status(400).json({ success: false, message: "Event ID is required." });
    }

    const data = await fetchFullMarkets(eventId, marketId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch full markets from provider." });
    }

    return res.status(200).json({
        success: true,
        eventId: eventId,
        marketId: marketId || null,
        data: data
    });
}

module.exports = {
    getFullMarketsHandler
};
