const { fetchGmanInplay } = require("../../services/gman/gman.service");

/**
 * REST Handler for fetching Gman in-play events.
 */
async function getGmanInplayHandler(req, res) {
    const data = await fetchGmanInplay();

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch in-play events from Gman provider." });
    }

    // Return exact provider response payload structure to match original
    return res.status(200).json(data);
}

module.exports = {
    getGmanInplayHandler
};
