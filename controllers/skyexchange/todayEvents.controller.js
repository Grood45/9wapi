const { getCachedTodayEvents } = require("../../services/skyexchange/todayEvents.service");

/**
 * Super Fast Controller: Returns Today Matches from Memory.
 */
function getTodayEventsHandler(req, res) {
    const data = getCachedTodayEvents();

    if (!data || data.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No today events found or cache is still warming up.",
            data: []
        });
    }

    // Set Cache-Control header so browser caches for 5 mins
    res.setHeader("Cache-Control", "public, max-age=300");

    return res.status(200).json({
        success: true,
        count: data.length,
        data: data
    });
}

module.exports = {
    getTodayEventsHandler
};
