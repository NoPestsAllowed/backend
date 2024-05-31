const mongoose = require("mongoose");

const GeoJson = new mongoose.Schema({
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
        type: GeoJson,
        required: true,
        index: true,
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
    uniqRef: {
        type: String,
        required: true,
    },
});

placeSchema.index({ geojson: "2dsphere" });
const Place = mongoose.model("places", placeSchema);
// const GeoJson = mongoose.model("geojsons", geojsonSchema);

// Place.index({ geojson: "2dsphere" });

module.exports = { Place, GeoJson };
