const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Point"],
        required: true,
    },
    coordinates: {
        type: [Number],
        required: true,
    },
});

const visualProofSchema = mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    altitude: {
        type: Number,
        required: false,
    },
    location: {
        type: pointSchema,
        required: true,
    },
    takenAt: {
        type: Date,
        required: true,
    },
    verificationRapport: {
        type: String,
        required: false,
    },
    verificationResult: {
        type: Boolean,
        required: false,
    },
});

// const VisualProof = mongoose.model("visualProofs", visualProofSchema);

module.exports = visualProofSchema;
