const mongoose = require("mongoose");

const geojsonSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Point", "Polygon", "LineString", "MultiLineString", "MultiPolygon"],
        required: true,
    },
    coordinates: {
        type: [Number],
        required: true,
    },
});

const placeSchema = mongoose.Schema({
    address: {
        type: String,
        required: false,
        unique: false,
    },
    geojson: {
        type: geojsonSchema,
        required: true,
    },
    type: {
        type: String,
        // enum: []
        required: true,
    },
    description: {
        type: String,
        required: false,
    }, // Foreign Keys
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "owners",
        required: false,
    },
});

const Place = mongoose.model("places", placeSchema);

module.exports = Place;
