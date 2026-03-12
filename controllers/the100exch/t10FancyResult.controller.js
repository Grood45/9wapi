const { fetchT10FancyResult } = require("../../services/the100exch/t10FancyResult.service");

/**
 * REST Handler for fetching t10 Fancy Result markets.
 */
async function getT10FancyResultHandler(req, res) {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ success: false, message: "Event ID is required." });
    }

    const data = await fetchT10FancyResult(eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch Fancy Result markets from t10 provider." });
    }

    // Return exact provider response payload structure to match original
    return res.status(200).json(data);
}

module.exports = {
    getT10FancyResultHandler
};
