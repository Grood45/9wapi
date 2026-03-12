const { getCachedInplayEvents } = require("../../services/skyexchange/inplayEvents.service");

/**
 * Super Fast Controller: Returns Inplay Matches from Memory (O(1) lookup).
 * Zero target URL hit on user load. High concurrency support.
 */
function getInplayEventsHandler(req, res) {
    const data = getCachedInplayEvents();

    if (!data || data.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No inplay events right now or cache warming up.",
            data: []
        });
    }

    // Set Cache-Control header so browser caches for 60s
    res.setHeader("Cache-Control", "public, max-age=60");

    return res.status(200).json({
        success: true,
        count: data.length,
        data: data
    });
}

module.exports = {
    getInplayEventsHandler
};
