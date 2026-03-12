const { refreshSportRadarToken, getSportRadarToken } = require("../../services/sportradar/sportRadarAuth.service");

/**
 * Force refresh the SportRadar token via API.
 */
async function handleSportRadarRefresh(req, res) {
    try {
        const token = await refreshSportRadarToken();
        return res.status(200).json({
            success: true,
            message: "SportRadar token refreshed successfully.",
            token: token
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: "Failed to refresh SportRadar token.",
            error: e.message
        });
    }
}

/**
 * Get the current token from DB.
 */
async function handleGetSportRadarToken(req, res) {
    const token = await getSportRadarToken();
    if (!token) {
        return res.status(404).json({ success: false, message: "Token not found in DB. Run refresh first." });
    }
    return res.status(200).json({ success: true, token });
}

module.exports = {
    handleSportRadarRefresh,
    handleGetSportRadarToken
};
