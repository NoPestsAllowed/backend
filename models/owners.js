const mongoose = require("mongoose");

const propertySchema = mongoose.Schema({
    placeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "places",
        required: true,
    },
    propertyTitle: {
        type: String,
        required: false,
    },
});

const ownerSchema = mongoose.Schema({
    // foreign key
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    // subdocument
    properties: {
        type: [propertySchema],
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const Owner = mongoose.model("owners", ownerSchema);

module.exports = Owner;
