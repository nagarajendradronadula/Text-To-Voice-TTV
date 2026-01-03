const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    googleId: {
        type: String,
        sparse: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId;
        }
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    pendingChanges: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);