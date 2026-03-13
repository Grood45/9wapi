const { getCachedKingSports, fetchAndCacheKingSports } = require("../../services/kingexchange/kingSports.service");

/**
 * REST Handler for fetching the KingExchange sports list.
 * Always returns data from RAM cache for maximum speed.
 */
async function getKingSportsHandler(req, res) {
    let data = getCachedKingSports();

    // Fallback if cache is somehow empty (Trigger on-demand load)
    if (!data) {
        data = await fetchAndCacheKingSports();
    }

    if (!data) {
        return res.status(500).json({ success: false, message: "Failed to load KingExchange sports." });
    }

    // Return exact original response structure as requested
    return res.status(200).send(data);
}

module.exports = {
    getKingSportsHandler
};
