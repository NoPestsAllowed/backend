const mongoose = require("mongoose");
const visualProofSchema = require("./visualProofs");

const depositionSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: false,
    },
    description: {
        type: String,
        required: false,
    },
    placeOwnerEmail: {
        type: String,
        required: false,
    },
    ownerInformedAt: {
        type: Date,
        required: false,
    },
    // Foreign Keys
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    placeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "places",
    },
    // Sous-doc
    visualProofs: {
        type: [visualProofSchema],
        required: false,
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "accepted", "rejected", "resolved"],
    },
    publishedAt: {
        type: Date,
        required: false,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const Deposition = mongoose.model("depositions", depositionSchema);

module.exports = Deposition;
