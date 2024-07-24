import mongoose from "mongoose";

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

const analysisSchema = new mongoose.Schema({
    score: {
        type: Number,
        required: true,
    },
    label: {
        type: String,
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
        type: [analysisSchema],
        required: true,
    },
    verificationResult: {
        type: Boolean,
        required: false,
    },
});

// const VisualProof = mongoose.model("visualProofs", visualProofSchema);

export default visualProofSchema;
