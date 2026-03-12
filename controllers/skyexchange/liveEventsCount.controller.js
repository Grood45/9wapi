const { getCachedLiveEventsCount } = require("../../services/skyexchange/liveEventsCount.service");

/**
 * Super Fast Controller: Returns data instantly from Node.js RAM (O(1) time).
 * 0 Server Load, NO target URL hit on user load.
 */
function getLiveEventsCountHandler(req, res) {
    const data = getCachedLiveEventsCount();

    if (!data || data.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No live events at the moment or cache not warmed up.",
            data: []
        });
    }

    // Set Cache-Control header so browser doesn't spam backend
    // Cache for 30s locally on the user's phone/browser
    res.setHeader("Cache-Control", "public, max-age=30");

    return res.status(200).json({
        success: true,
        data: data
    });
}

module.exports = {
    getLiveEventsCountHandler
};
