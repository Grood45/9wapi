const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    companyName: {
        type: String,
        trim: true,
        default: ''
    },
    domainName: {
        type: String,
        trim: true,
        default: ''
    },
    contactNumber: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
