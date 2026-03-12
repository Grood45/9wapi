const { getCachedEventsBySport } = require("../../services/skyexchange/sportEvents.service");

/**
 * Returns events filtered by Sport ID from Memory.
 */
function getEventsBySportHandler(req, res) {
    const { sportId } = req.params;

    if (!sportId) {
        return res.status(400).json({ success: false, message: "Sport ID is required." });
    }

    const data = getCachedEventsBySport(sportId);

    return res.status(200).json({
        success: true,
        sportId: sportId,
        count: data.length,
        data: data
    });
}

module.exports = {
    getEventsBySportHandler
};
