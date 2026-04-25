const { refreshSportRadarToken, getSportRadarTokenData, saveManualToken } = require("../../services/sportradar/sportRadarAuth.service");

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
 * Get the current token from DB with metadata.
 */
async function handleGetSportRadarToken(req, res) {
    const data = await getSportRadarTokenData();
    if (!data || !data.token) {
        return res.status(404).json({ success: false, message: "Token not found in DB. Run refresh first." });
    }
    return res.status(200).json({ 
        success: true, 
        token: data.token,
        source: data.source || "Unknown",
        updatedAt: data.updatedAt,
        lastAttemptStatus: data.lastAttemptStatus
    });
}

/**
 * Handle manual token update from Admin Panel.
 */
async function handleManualTokenUpdate(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Token is required." });
        }
        
        await saveManualToken(token);
        return res.status(200).json({
            success: true,
            message: "SportRadar token updated manually.",
            token: token
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: "Failed to update SportRadar token.",
            error: e.message
        });
    }
}

module.exports = {
    handleSportRadarRefresh,
    handleGetSportRadarToken,
    handleManualTokenUpdate
};

