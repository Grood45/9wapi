const AdminUser = require('../../models/AdminUser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || '9W-GATEKEEPER-ADMIN-SECRET-KEY-12345';

// Helper to seed initial admin if not exists
exports.seedAdmin = async () => {
    try {
        const adminExists = await AdminUser.findOne({ username: 'adminAPI' });
        if (!adminExists) {
            const newAdmin = new AdminUser({
                username: 'adminAPI',
                password: 'Sher@123' // Will be hashed via pre-save hook
            });
            await newAdmin.save();
            console.log("✅ Initial Admin User Created: adminAPI / Sher@123");
        }
    } catch (err) {
        console.error("❌ Admin Seeding Failed:", err.message);
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await AdminUser.findOne({ username });
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        // Generate JWT
        const tokenToken = jwt.sign(
            { id: admin._id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update current token in DB for single-session enforcement
        admin.currentToken = tokenToken;
        await admin.save();

        res.json({
            success: true,
            token: tokenToken,
            username: admin.username
        });
    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error during login" });
    }
};

exports.logout = async (req, res) => {
    try {
        // middleware attaches admin to req
        const admin = await AdminUser.findById(req.admin.id);
        if (admin) {
            admin.currentToken = null;
            await admin.save();
        }
        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error during logout" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const admin = await AdminUser.findById(req.admin.id);

        if (!(await admin.comparePassword(oldPassword))) {
            return res.status(400).json({ success: false, message: "Old password is incorrect" });
        }

        admin.password = newPassword; // Will be hashed via pre-save hook
        admin.currentToken = null; // Force logout after password change
        await admin.save();

        res.json({ success: true, message: "Password changed successfully. Please login again." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error during password change" });
    }
};

exports.verifySession = async (req, res) => {
    // If middleware passed, session is valid
    res.json({ success: true, username: req.admin.username });
};
