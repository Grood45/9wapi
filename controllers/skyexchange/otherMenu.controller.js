const { fetchOtherMenu } = require("../../services/skyexchange/otherMenu.service");

/**
 * REST Handler for fetching the list of markets (Other Menu) for an event.
 */
async function getOtherMenuHandler(req, res) {
    const { sportId, eventId } = req.params;

    if (!sportId || !eventId) {
        return res.status(400).json({ success: false, message: "Sport ID and Event ID are required." });
    }

    const data = await fetchOtherMenu(sportId, eventId);

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch market list from provider." });
    }

    return res.status(200).json({
        success: true,
        sportId,
        eventId,
        data: data
    });
}

module.exports = {
    getOtherMenuHandler
};
