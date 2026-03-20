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

/**
 * REST Handler for fetching Gman sports list.
 */
async function getGmanSportsHandler(req, res) {
    const data = await fetchGmanSports();

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to fetch sports list from Gman provider." });
    }

    // Return exact provider response payload structure to match original
    return res.status(200).json(data);
}

/**
 * REST Handler for fetching Gman events by specific Sport ID.
 */
async function getGmanEventsBySportHandler(req, res) {
    const { sportId } = req.params;

    if (!sportId) {
        return res.status(400).json({ success: false, message: "Sport ID is required." });
    }

    const data = await fetchGmanEventsBySport(sportId);

    if (!data) {
        return res.status(404).json({ success: false, message: `No data found for Sport ID: ${sportId}` });
    }

/**
 * REST Handler for fetching Gman match details (Odds).
 * Activates on-demand background polling for this match.
 */
async function getGmanMatchDetailsHandler(req, res) {
    const { fetchGmanMatchDetails } = require("../../services/gman/gman.service");
    const { matchId } = req.params;

    if (!matchId) {
        return res.status(400).json({ success: false, message: "Match ID is required." });
    }

    const data = await fetchGmanMatchDetails(matchId);

    if (!data) {
        // First request might be null if provider hasn't synced yet
        return res.status(202).json({ success: true, message: "Sync initialized. Please retry in 2 seconds.", data: null });
    }

    return res.status(200).json(data);
}

module.exports = {
    getGmanInplayHandler,
    getGmanSportsHandler,
    getGmanEventsBySportHandler,
    getGmanMatchDetailsHandler
};
