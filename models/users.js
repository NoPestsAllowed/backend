const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        unique: false,
    },
    lastname: {
        type: String,
        required: true,
        unique: false,
    },
    dateOfBirth: {
        type: Date,
        required: false,
        unique: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    emailVerifiedAt: {
        type: Date,
        required: false,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    avatarUrl: {
        type: String,
        required: false,
    },
    token: String,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
