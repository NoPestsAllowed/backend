var express = require("express");
var router = express.Router();
const User = require("../models/users");
const Deposition = require("../models/depositions");
//const Place = require('../models/place');
const { Place, GeoJson } = require("../models/places");
const { checkBody } = require("../modules/checkBody");
// const { findOrCreatePlace } = await require("../modules/findOrCreatePlace");
const nodemailer = require("nodemailer");
const { SignedUrl } = require("../modules/generateSignedUrl");
const authenticateUser = require("./middleware/authenticateUser");

const multer = require("multer");
const upload = multer({ dest: "./tmp/" });
const cloudinary = require("cloudinary").v2;

// Create a transporter object
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // use SSL
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

// We must rename this route to router.post("/")
router.post("/create", [upload.array("visualProofs"), authenticateUser], async (req, res) => {
    console.log(req.user, req.files, JSON.parse(req.body.depo).place);

    if (!checkBody(req.body, ["name", "description", "placeOwnerEmail", "depo"])) {
        console.log("missing fields");
        return res.json({ result: false, error: "Missing or empty fields" });
    }

    const jsonPlace = JSON.parse(req.body.depo).place;

    const user = await User.findOne({ email: req.user.email });

    if (user === null) {
        return res.json({ result: false, error: "User not found" });
    }

    const place = await findOrCreatePlace(jsonPlace.id, formatPlaceAddress(jsonPlace), jsonPlace.lat, jsonPlace.lon);

    const visualProofs = await storePicturesInCloudinary(req.files);
    console.log(visualProofs);
    const newDeposition = new Deposition({
        name: req.body.name,
        description: req.body.description,
        userId: user._id,
        placeId: place._id,
        placeOwnerEmail: req.body.placeOwnerEmail,
        visualProofs: visualProofs.map((cloudinaryFile) => {
            return {
                url: cloudinaryFile.secure_url,
                longitude: jsonPlace.lon,
                latitude: jsonPlace.lat,
                // altitude: jsonPlace.alt,
                location: new GeoJson({
                    type: "Point",
                    coordinates: [jsonPlace.lat, jsonPlace.lon],
                }),
                takenAt: new Date(),
            };
        }),
    });

    const deposition = await newDeposition.save();

    const signedUrl = new SignedUrl();
    const url = signedUrl.sign(`${req.protocol}://${process.env.FRONTEND_URL}/resolution/${deposition._id}`, {
        ttl: 60 * 60 * 24,
        params: {
            email: deposition.placeOwnerEmail,
        },
    });

    sendMailForDeposition(deposition.placeOwnerEmail, formatPlaceAddress(jsonPlace), url);

    console.log("user", user, "place", place);

    return res.json({ result: true, deposition: deposition });
    // if (!checkBody(req.body, ["name", "description", "placeOwnerEmail", "place", "visualProofs"])) {
    //     return res.json({ result: false, error: "Missing or empty fields" });
    // }

    // User.findOne({ email: req.user.email }).then((user) => {
    //     if (user === null) {
    //         return res.json({ result: false, error: "User not found" });
    //     }
    //     // cloudinary.uploader.upload(req.file.path, { resource_type: "auto" }).then(cloudinaryResult => {

    //     // });
    //     const signedUrl = new SignedUrl();

    //     Place.findOne({ uniqRef: req.body.place.id }).then((place) => {
    //         console.log("place", place);
    //         if (place === null) {
    //             const newPlace = new Place({
    //                 address: formatPlaceAddress(req.body.place),
    //                 geojson: new GeoJson({
    //                     type: "Point",
    //                     coordinates: [req.body.place.lat, req.body.place.lon],
    //                 }),
    //                 type: "Place",
    //                 uniqRef: req.body.place.id,
    //             });
    //             console.log("creating : ", newPlace);
    //             newPlace.save().then((savedPlace) => {
    //                 // return savedPlace;
    //                 const newDeposition = new Deposition({
    //                     name: req.body.name,
    //                     description: req.body.description,
    //                     userId: user._id,
    //                     placeId: savedPlace._id,
    //                     placeOwnerEmail: req.body.placeOwnerEmail,
    //                     // visualProofs: visualProofs
    //                 });

    //                 newDeposition.save().then((savedDepo) => {
    //                     console.log("start sending mail");
    //                     console.log(req.protocol, req.get("host"), req.originalUrl);
    //                     const url = signedUrl.sign(
    //                         `${req.protocol}://${process.env.FRONTEND_URL}/resolution/${savedDepo._id}`,
    //                         {
    //                             ttl: 60 * 60 * 24,
    //                             params: {
    //                                 email: savedDepo.placeOwnerEmail,
    //                             },
    //                         }
    //                     );

    //                     const mailOptions = {
    //                         from: "infected@nopestsallowed.test",
    //                         to: savedDepo.placeOwnerEmail,
    //                         subject: `${formatPlaceAddress(req.body.place)} is infected by pests`,
    //                         text: "Act or die !",
    //                         html: `
    //                             <h1>Loueur de piaule pourrie tu dois agir</h1>
    //                             click sur le lien : <a href="${url}">Ici</a>
    //                         `,
    //                     };

    //                     // Send the email
    //                     transporter.sendMail(mailOptions, function (error, info) {
    //                         if (error) {
    //                             console.log("Error:", error);
    //                         } else {
    //                             console.log("Email sent: " + info.response);
    //                         }
    //                     });

    //                     return res.json({ result: true, deposition: savedDepo });
    //                 });
    //             });
    //         } else {
    //             console.log("create depo for existing place");
    //             const newDeposition = new Deposition({
    //                 name: req.body.name,
    //                 description: req.body.description,
    //                 userId: user._id,
    //                 placeId: place._id,
    //                 placeOwnerEmail: req.body.placeOwnerEmail,
    //                 // visualProofs: visualProofs
    //             });

    //             newDeposition.save().then((savedDepo) => {
    //                 console.log("start sending mail");
    //                 console.log(req.protocol, req.get("host"), req.originalUrl);
    //                 const url = signedUrl.sign(
    //                     `${req.protocol}://${process.env.FRONTEND_URL}/resolution/${savedDepo._id}`,
    //                     {
    //                         ttl: 60 * 60 * 24,
    //                         params: {
    //                             email: savedDepo.placeOwnerEmail,
    //                         },
    //                     }
    //                 );

    //                 const mailOptions = {
    //                     from: "infected@nopestsallowed.test",
    //                     to: savedDepo.placeOwnerEmail,
    //                     subject: `${formatPlaceAddress(req.body.place)} is infected by pests`,
    //                     text: "Act or die !",
    //                     html: `
    //                         <h1>Loueur de piaule pourrie tu dois agir</h1>
    //                         click sur le lien : <a href="${url}">Ici</a>
    //                     `,
    //                 };

    //                 // Send the email
    //                 transporter.sendMail(mailOptions, function (error, info) {
    //                     if (error) {
    //                         console.log("Error:", error);
    //                     } else {
    //                         console.log("Email sent: " + info.response);
    //                     }
    //                 });

    //                 return res.json({ result: true, deposition: savedDepo });
    //             });
    //         }
    //     });
    // });
});

router.get("/", (req, res) => {
    Deposition.find()
        .populate("placeId")
        .sort({ createdAt: -1 })
        .then((data) => {
            res.json({ result: true, depositions: data });
        });

    // Supprimer une déposition
    router.delete("/delete", authenticateUser, (req, res) => {
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

// Generate signed route using jwt encoding place id / owner mail / expiration date
router.get("/:id/resolve", (req, res) => {
    const { signature } = req.query;
    // validate signature then ...
});

const findOrCreatePlace = async (ref, address, latitude, longitude) => {
    console.log(ref, address, latitude, longitude);
    let result = await Place.findOne({ uniqRef: ref });
    if (!result) {
        const newPlace = new Place({
            address: address,
            geojson: new GeoJson({
                type: "Point",
                coordinates: [latitude, longitude],
            }),
            type: "Place",
            uniqRef: ref,
        });
        result = await newPlace.save();
    }
    return result;
};

const sendMailForDeposition = (to, location, url) => {
    console.log("start sending mail");
    const mailOptions = {
        from: "infected@nopestsallowed.test",
        to: to,
        subject: `${location} is infected by pests`,
        text: "Act or die !",
        html: `
            <h1>Loueur de piaule pourrie tu dois agir</h1>
            click sur le lien : <a href="${url}">Ici</a>
        `,
    };

    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log("Error:", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

const storePicturesInCloudinary = async (pictures) => {
    const result = await Promise.all(
        pictures.map((picture) => cloudinary.uploader.upload(picture.path, { resource_type: "auto" }))
    );
    console.log("result", result);
    return result;
};
module.exports = router;
