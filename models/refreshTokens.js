const mongoose = require("mongoose");

const refreshTokenSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true,
    },
    revokedAt: {
        type: Date,
        required: function () {
            return (
                typeof this.revokedAt === "undefined" || (this.revokedAt != null && typeof this.revokedAt != "string")
            );
        },
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const refreshToken = mongoose.model("refreshTokens", refreshTokenSchema);

module.exports = refreshToken;
