const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    currentToken: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Hash password before saving
AdminUserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
AdminUserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);
