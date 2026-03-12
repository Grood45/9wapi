const ClientAccess = require('../models/ClientAccess');

// A simple in-memory rate limiter store for IP/Client based limiting
const rateLimitStore = new Map();

// Helper to clear old rate limit records
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now - data.timestamp > 1000) { // Keep data only for 1 second
            rateLimitStore.delete(key);
        }
    }
}, 5000);

const sendErrorPhoneResponse = (res, message, ip = 'Unknown') => {
    return res.status(403).json({
        success: false,
        error: "Access Denied",
        message: message,
        ip: ip,
        contact: "Please contact provider via WhatsApp: +91 7982720942"
    });
};

const apiAccessGuard = (providerName, endpointName = 'ALL') => {
    return async (req, res, next) => {
        try {
            // Get client IP address early for debugging/logs
            let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            if (clientIp === '::1') clientIp = '127.0.0.1';
            if (clientIp && clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();

            // 1. Identify Client Access by IP and Provider
            // We no longer require a clientId header/query. We search for ANY active rule that allows this IP for this provider.
            const accessConfig = await ClientAccess.findOne({
                providerName: providerName,
                status: 'active',
                $or: [
                    { whitelistedIPs: clientIp },
                    { whitelistedIPs: '0.0.0.0' }
                ]
            });

            if (!accessConfig) {
                return sendErrorPhoneResponse(res, `Your IP ${clientIp} is not whitelisted for ${providerName}.`, clientIp);
            }

            // 2. Verify Time (Date Restrictions)
            const currentTime = new Date();
            if (currentTime < accessConfig.validFrom) {
                return sendErrorPhoneResponse(res, "Your subscription period has not started yet.", clientIp);
            }
            if (currentTime > accessConfig.validUntil) {
                return sendErrorPhoneResponse(res, "Your subscription has expired.", clientIp);
            }

            // 3. Verify Endpoints
            if (!accessConfig.endpoints.includes('ALL') && endpointName !== 'ALL') {
                if (!accessConfig.endpoints.includes(endpointName)) {
                    return sendErrorPhoneResponse(res, `You do not have permission to access endpoint: ${endpointName}`, clientIp);
                }
            }

            // 4. Rate Limiting Check (Only if not set to unlimited i.e. -1)
            const requestLimit = accessConfig.requestLimitPerSecond;

            if (requestLimit !== -1) {
                const limitKey = `${accessConfig.clientId}_${providerName}`;
                const now = Date.now();
                const currentSecond = Math.floor(now / 1000);

                const clientRateData = rateLimitStore.get(limitKey);

                if (!clientRateData || clientRateData.second !== currentSecond) {
                    // First request in this second
                    rateLimitStore.set(limitKey, { second: currentSecond, count: 1, timestamp: now });
                } else {
                    // Subsequent request in the same second
                    if (clientRateData.count >= requestLimit) {
                        return sendErrorPhoneResponse(res, `Rate limit exceeded. Maximum ${requestLimit} requests per second allowed.`, clientIp);
                    }
                    clientRateData.count += 1;
                    rateLimitStore.set(limitKey, clientRateData);
                }
            }
            // If requestLimit === -1, the code easily bypasses the check for maximum cost optimization and lowest latency

            // All checks passed
            next();

        } catch (error) {
            console.error("API Access Guard Error: ", error);
            return sendErrorPhoneResponse(res, "Internal Server Error verifying access");
        }
    };
};

module.exports = apiAccessGuard;
