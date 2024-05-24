var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Deposition = require("../models/depositions");
//const Place = require('../models/place');
const { Place, GeoJson } = require("../models/places");
const { checkBody } = require("../modules/checkBody");
// const { findOrCreatePlace } = await require("../modules/findOrCreatePlace");

router.post("/create", (req, res) => {
    console.log(req.user);
    if (!checkBody(req.body, ["name", "description", "placeOwnerEmail", "place", "visualProofs"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    User.findOne({ email: req.user.email }).then((user) => {
        if (user === null) {
            res.json({ result: false, error: "User not found" });
            return;
        }
        console.log("user exist");
        console.log("start creating depo");
        Place.findOne({ uniqRef: req.body.place.id }).then((place) => {
            if (place === null) {
                const newPlace = new Place({
                    address: formatPlaceAddress(req.body.place),
                    geojson: new GeoJson({
                        type: "Point",
                        coordinates: [req.body.place.lat, req.body.place.lon],
                    }),
                    type: "Place",
                    uniqRef: req.body.place.id,
                });
                console.log("creating : ", newPlace);
                newPlace.save().then((savedPlace) => {
                    // return savedPlace;
                    const newDeposition = new Deposition({
                        name: req.body.name,
                        description: req.body.description,
                        userId: user._id,
                        placeId: savedPlace._id,
                    });

                    newDeposition.save().then((savedDepo) => {
                        return res.json({ result: true, deposition: savedDepo });
                    });
                });
            } else {
                const newDeposition = new Deposition({
                    name: req.body.name,
                    description: req.body.description,
                    userId: user._id,
                    placeId: place._id,
                });

                newDeposition.save().then((savedDepo) => {
                    return res.json({ result: true, deposition: savedDepo });
                });
            }
        });
        // findOrCreatePlace(req.body.place).then((place) => {
        //     console.log("place", place);
        //     const newDeposition = new Deposition({
        //         name: req.body.name,
        //         description: req.body.description,
        //         userId: user._id,
        //         placeId: place._id,
        //     });
        //     console.log("new depo", newDeposition);
        // });
    });
});

router.get("/", (req, res) => {
    Deposition.find()
        .populate("placeId")
        .then((data) => {
            res.json({ result: true, depositions: data });
        });

    // Supprimer une déposition
    router.delete("/delete", (req, res) => {
        if (!checkBody(req.body, ["token", "depositionId"])) {
            res.json({ result: false, error: "Missing or empty fields" });
            return;
        }

        User.findOne({ token: req.body.token }).then((user) => {
            if (user === null) {
                res.json({ result: false, error: "User not found" });
                return;
            }

            Deposition.findById(req.body.depositionId)
                .populate("userId")
                .populate("placeId")
                .then((deposition) => {
                    if (!deposition) {
                        res.json({ result: false, error: "Deposition not found" });
                        return;
                    } else if (String(deposition.userId._id) !== String(user._id)) {
                        // ObjectId needs to be converted to string (JavaScript cannot compare two objects)
                        res.json({ result: false, error: "Deposition can only be deleted by its author" });
                        return;
                    }

                    Deposition.deleteOne({ _id: deposition._id }).then(() => {
                        res.json({ result: true });
                    });
                });
        });
    });
});

router.get("/:id", (req, res) => {
    const { id } = req.params;
    // console.log(req.params, id);
    Deposition.findById(id)
        .populate("placeId")
        .then((deposition) => {
            if (deposition) {
                return res.json({ result: true, deposition });
            }
            return res.statusCode(404).json({ result: false, message: "deposition not found" });
        });
});

// const findOrCreatePlace = async (placeObject) => {
//     Place.findOne({ uniqRef: placeObject.id }).then((place) => {
//         if (place === null) {
//             const newPlace = new Place({
//                 address: formatPlaceAddress(placeObject),
//                 geojson: new GeoJson({
//                     type: "Point",
//                     coordinates: [placeObject.lat, placeObject.lon],
//                 }),
//                 type: "Place",
//                 uniqRef: placeObject.id,
//             });
//             console.log("creating : ", newPlace);
//             return newPlace;
//             // newPlace.save().then((savedPlace) => {
//             //     return savedPlace;
//             // });
//         }
//         return place;
//     });
// };

const formatPlaceAddress = (placeObject) => {
    if (placeObject.street) {
        return `${placeObject.tags["addr:housenumber"]} ${placeObject.street}`;
    } else if (
        placeObject.tags["amenity"] &&
        (placeObject.tags["addr:housenumber"] || placeObject.tags["contact:housenumber"]) &&
        (placeObject.tags["addr:street"] || placeObject.tags["contact:street"])
    ) {
        // console.log(placeObject.tags["amenity"], typeof placeObject.tags["name"] !== "undefined", placeObject.tags["name"]);
        let resultText =
            placeObject.tags["amenity"] + " " + typeof placeObject.tags["name"] !== "undefined"
                ? placeObject.tags["name"]
                : "";
        // console.log(resultText);
        if (placeObject.tags["addr:housenumber"] || placeObject.tags["contact:housenumber"]) {
            // console.log(placeObject.tags["addr:housenumber"], placeObject.tags["contact:housenumber"]);
            // console.log(
            //     typeof placeObject.tags["addr:housenumber"] !== "undefined"
            //         ? placeObject.tags["addr:housenumber"]
            //         : placeObject.tags["contact:housenumber"]
            // );
            resultText += ", ";
            resultText +=
                typeof placeObject.tags["addr:housenumber"] !== "undefined"
                    ? placeObject.tags["addr:housenumber"]
                    : placeObject.tags["contact:housenumber"];
        }

        if (placeObject.tags["addr:street"] || placeObject.tags["contact:street"]) {
            console.log(
                placeObject,
                "-" + typeof placeObject.tags["addr:street"] !== "undefined"
                    ? placeObject.tags["addr:street"]
                    : placeObject.tags["contact:street"]
            );
            resultText += " ";
            resultText +=
                typeof placeObject.tags["addr:street"] !== "undefined"
                    ? placeObject.tags["addr:street"]
                    : placeObject.tags["contact:street"];
        }
        return resultText;
    }
};

module.exports = router;
