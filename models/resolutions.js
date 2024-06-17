const mongoose = require("mongoose");
const visualProofSchema = require("./visualProofs");

const resolutionSchema = mongoose.Schema({
    // Foreign Keys
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "owners",
    },
    depositionsId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "depositions",
    },
    // Sous-doc
    visualProofs: {
        type: [visualProofSchema],
        required: false,
    },
    resolvedAt: {
        type: Date,
        required: false,
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "accepted", "refused"],
    },
    text: {
        type: String,
        required: false,
    },
});

const Resolution = mongoose.model("resolutions", resolutionSchema);

module.exports = Resolution;
