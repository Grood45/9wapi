const { getCachedTomorrowEvents } = require("../../services/skyexchange/tomorrowEvents.service");

function getTomorrowEventsHandler(req, res) {
    const data = getCachedTomorrowEvents();
    return res.status(200).json({
        success: true,
        count: data.length,
        data: data
    });
}

module.exports = { getTomorrowEventsHandler };
