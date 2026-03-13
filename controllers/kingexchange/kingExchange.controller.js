const { getEvents, getResults } = require("../../services/kingexchange/kingExchange.service");

/**
 * REST Handler for KingExchange All Events
 * Always returns 0ms from RAM cache.
 */
async function getKingEventsHandler(req, res) {
    const data = getEvents();
    
    if (!data || Object.keys(data).length === 0) {
        return res.status(503).json({
            success: false,
            message: "Data is warming up. Please try again in 5 seconds."
        });
    }

    return res.status(200).send(data);
}

/**
 * REST Handler for Market Results by Event ID
 * Checks RAM first, then Fallback to MongoDB persistence.
 */
async function getKingResultsHandler(req, res) {
    const { eventId } = req.params;
    if (!eventId) {
        return res.status(400).json({ success: false, message: "eventId is required" });
    }

    const { data, source } = await getResults(eventId);
    
    // Maintain original KingExchange 1:1 format
    return res.status(200).send({
        data: data,
        meta: {
            message: "Result.",
            status_code: 200,
            status: true
        }
    });
}

module.exports = {
    getKingEventsHandler,
    getKingResultsHandler
};
