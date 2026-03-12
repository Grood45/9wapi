const { fetchThe100exchFancy } = require("../../services/the100exch/the100exchFancy.service");

/**
 * REST Handler for fetching the100exch Fancy markets.
 */
async function getThe100exchFancyHandler(req, res) {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ success: false, message: "Event ID is required." });
    }

    const data = await fetchThe100exchFancy(eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch Fancy markets from the100exch provider." });
    }

    // Return exact provider response payload structure to match original
    return res.status(200).json(data);
}

module.exports = {
    getThe100exchFancyHandler
};
