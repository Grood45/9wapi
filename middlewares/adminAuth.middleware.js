const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET || '9W-GATEKEEPER-ADMIN-SECRET-KEY-12345';

const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "No token provided, access denied" });
        }

        const token = authHeader.split(' ')[1];

        // 1. Verify JWT
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired session token" });
        }

        // 2. Fetch Admin from DB
        const admin = await AdminUser.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ success: false, message: "Admin user not found" });
        }

        // 3. ENFORCE SINGLE SESSION
        // If the token in the request doesn't match the currentToken in DB, it means another session was started.
        if (admin.currentToken !== token) {
            return res.status(401).json({
                success: false,
                message: "Session terminated. You have been logged in from another device."
            });
        }

        // Attach admin to request object
        req.admin = { id: admin._id, username: admin.username };
        next();

    } catch (error) {
        console.error("Admin Auth Middleware Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during authentication" });
    }
};

module.exports = adminAuth;
