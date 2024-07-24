import express from "express";
const router = express.Router();
import User from "../models/users.js";
import Deposition from "../models/depositions.js";
//const Place = require('../models/place');
import { Place } from "../models/places.js";
import { checkBody } from "../modules/checkBody.js";
// const { findOrCreatePlace } = await require("../modules/findOrCreatePlace");
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
const templatePath = path.join(process.cwd(), "./templates/emails/depositionCreated.hbs");
const source = fs.readFileSync(templatePath, "utf8");
const template = handlebars.compile(source);

import { SignedUrl } from "../modules/generateSignedUrl.js";
import authenticateUser from "./middleware/authenticateUser.js";

import multer from "multer";
import Resolution from "../models/resolutions.js";
const upload = multer({ dest: "/tmp" });
import { v2 as cloudinary } from "cloudinary";

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
    if (!checkBody(req.body, ["name", "description", "placeOwnerEmail", "depo", "pestType"])) {
        console.log("missing fields");
        return res.status(422).json({ result: false, error: "Missing or empty fields" });
    }

    // console.log("req.body in create", req.body);

    const jsonPlace = JSON.parse(req.body.depo).place.data;
    // console.log("jsonPlace is ", jsonPlace);
    const user = await User.findById(req.user.sub);

    if (user === null) {
        return res.json({ result: false, error: "User not found" });
    }

    const [placeLat, placeLon] = jsonPlace.center
        ? [jsonPlace.center.lat, jsonPlace.center.lon]
        : [jsonPlace.lat, jsonPlace.lon];

    const place = await findOrCreatePlace(jsonPlace.id, formatPlaceAddress(jsonPlace), placeLat, placeLon);
    const { visualProofsMeta } = req.body;
    const parsedProofsDetail = Array.isArray(visualProofsMeta)
        ? visualProofsMeta.map((proof) => JSON.parse(proof))
        : [JSON.parse(visualProofsMeta)];
    // console.log("files : ", req.files);

    const visualProofs = await storePicturesInCloudinary(req.files);
    // console.log(visualProofs, parsedProofsDetail);
    // We must analyse pictures before sending to cloudinary
    let analysisResult = await Promise.all(
        visualProofs.map(async (proof) => {
            let responseResult = [];
            let result = await (await import("../modules/imageAnalizer.mjs")).analyzeImg(proof.secure_url);
            responseResult["result"] = result;
            responseResult["related_to"] = proof.public_id;

            return responseResult;
        })
    );
    // console.log("analysisResultT", analysisResultT);
    // return res.end();
    const newDeposition = new Deposition({
        name: req.body.name,
        description: req.body.description,
        userId: user._id,
        placeId: place._id,
        type: req.body.pestType,
        placeOwnerEmail: req.body.placeOwnerEmail,
        visualProofs: visualProofs.map((cloudinaryFile) => {
            const proofCoords = parsedProofsDetail.find(
                (detail) => detail.name.split(".")[0] === cloudinaryFile.public_id
            );
            // console.log(cloudinaryFile.public_id, proofCoords, parsedProofsDetail);
            const analysisRes = () => {
                const proofAnalysis = analysisResult.find((result) => result.related_to === cloudinaryFile.public_id)[
                    "result"
                ];
                // console.log("proofAnalysis", proofAnalysis);
                return proofAnalysis;
            };
            // console.log("fghjk", analysisRes());
            return {
                url: cloudinaryFile.secure_url,
                longitude: proofCoords.coords.longitude,
                latitude: proofCoords.coords.latitude,
                altitude: proofCoords.coords?.altitude,
                location: {
                    type: "Point",
                    coordinates: [proofCoords.coords.latitude, proofCoords.coords.longitude],
                },
                takenAt: new Date(),
                verificationRapport: analysisRes(),
            };
        }),
    });

    // We must analyse pictures before sending to cloudinary
    // let analysisResult = await Promise.all(
    //     visualProofs.map(async (proof) => {
    //         let result = await (await import("../modules/imageAnalizer.mjs")).analyzeImg(proof.secure_url);
    //         console.log(result);
    //         return result;
    //     })
    // );
    // console.log("analysisResult", analysisResult);
    analysisResult = analysisResult
        .map((result) => result["result"])
        .filter((item) => typeof item !== "undefined" && item.length > 0);
    // console.log("analysisResult", analysisResult);
    if (analysisResult.length > 0) {
        let scoresSum = analysisResult.reduce((accumulator, currentValue) => {
            // console.log("currentValue", currentValue);
            const { score } = currentValue[0];
            // console.log("score", score);
            // console.log("accumulator", accumulator);

            return accumulator + score;
        }, 0);

        let scoreAvg = scoresSum / analysisResult.length;

        if (scoreAvg > 0.8) {
            newDeposition.status = "accepted";
        } else {
            newDeposition.status = "rejected";
        }
    } else {
        newDeposition.status = "rejected";
    }

    const deposition = await newDeposition.save();
    // console.log(deposition);
    const signedUrl = new SignedUrl();
    const url = signedUrl.sign(`${req.protocol}://${process.env.FRONTEND_URL}/resolution/${deposition._id}`, {
        ttl: 60 * 60 * 24,
        params: {
            email: deposition.placeOwnerEmail,
        },
    });

    sendMailForDeposition(deposition, formatPlaceAddress(jsonPlace), url);

    /*
        #swagger.responses[200] = {
            description: 'Create a new deposition.',
            schema: {
                result: true,
                deposition: {$ref: '#/definitions/Deposition'},
            },
        }
    */
    return res.json({ result: true, deposition: deposition });
});

router.get("/", (req, res) => {
    Deposition.find({ status: "accepted" })
        .populate("placeId")
        .sort({ createdAt: -1 })
        .then((data) => {
            /*
                #swagger.responses[200] = {
                    description: 'Get all depositions.',
                    schema: {
                        result: true,
                        depositions: [{$ref: '#/definitions/Deposition'}],
                    },
                }
            */
            return res.json({ result: true, depositions: data });
        });
});

router.get("/last-day", (req, res) => {
    const now = new Date();
    const yesterday = new Date(now.setDate(now.getDate() - 1));
    Deposition.find({ status: "accepted", createdAt: { $gte: yesterday } })
        .populate("placeId")
        .sort({ createdAt: -1 })
        .then((data) => {
            /*
                #swagger.responses[200] = {
                    description: 'Get deposition for last day.',
                    schema: {
                        result: true,
                        depositions: [{$ref: '#/definitions/Deposition'}],
                    },
                }
            */
            return res.json({ result: true, depositions: data });
        });
});

router.post("/by-location", (req, res) => {
    // #swagger.ignore = true
    if (!checkBody(req.body, ["coords"])) {
        res.json({ result: false, error: "No location provided." });
        return;
    }
    const { coords } = req.body;
    // console.log(coords, coords.longitude, coords.latitude);
    Place.find({
        geojson: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [coords.longitude, coords.latitude],
                },
                $maxDistance: 1000,
                // $minDistance: 100,
            },
        },
    }).then((places) => {
        console.log("h", places);
    });
});

// Supprimer une déposition
router.delete("/delete", authenticateUser, (req, res) => {
    if (!checkBody(req.body, ["depositionId"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    // console.log(req.user);
    User.findById(req.user.sub).then((user) => {
        if (user === null) {
            return res.status(500).json({ result: false, error: "User not found" });
        }
        // console.log("req.body in delete", req.body);
        // console.log("found user in delete", user);
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

                Deposition.deleteOne({ _id: deposition._id })
                    .then(() => {
                        /*
                        #swagger.responses[200] = {
                            description: 'Delete a deposition.',
                            schema: {
                                result: true,
                            },
                        }
                    */
                        return res.json({ result: true });
                    })
                    .catch((err) => {
                        console.log(err);
                        return res.json({ result: false });
                    });
            });
    });
});

router.get("/search", (req, res) => {
    const { q } = req.query;
    if (!checkBody(req.query, ["q"])) {
        res.json({ result: false, error: "Missing search terms" });
        return;
    }

    let regex = new RegExp(`${q}`, "ig");
    Place.find({ address: { $regex: regex }, status: "accepted" }).then((places) => {
        Deposition.find({ placeId: { $in: places.map((p) => p.id) } })
            .populate("placeId")
            .then((depositions) => {
                /*
                    #swagger.responses[200] = {
                        description: 'Search depositions by place.',
                        schema: {
                            result: true,
                            depositions: [{$ref: '#/definitions/Deposition'}],
                        },
                    }
                */
                return res.json({ result: true, depositions });
            });
    });
});

router.get("/:id", (req, res) => {
    const { id } = req.params;
    Deposition.findById(id)
        .populate("placeId")
        .then((deposition) => {
            if (deposition) {
                /*
                    #swagger.responses[200] = {
                        description: 'Get deposition details.',
                        schema: {
                            result: true,
                            deposition: {$ref: '#/definitions/Deposition'},
                        },
                    }
                */
                return res.json({ result: true, deposition });
            }
            return res.status(404).json({ result: false, message: "deposition not found" });
        });
});

router.put("/update/:id", authenticateUser, (req, res) => {
    if (!checkBody(req.body, ["description", "name"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    const id = req.params.id;
    const { name, description } = req.body;

    Deposition.updateOne(
        { _id: id, userId: req.user.id },
        {
            name: name,
            description: description,
        }
    ).then((response) => {
        /*
            #swagger.responses[200] = {
                description: 'Update a deposition.',
                schema: {
                    result: true,
                    message: "Déposition modifiée avec succès",
                },
            }
        */
        res.status(200).json({ result: true, message: "Déposition modifiée avec succès" });
    });
});
router.post("/:id/resolve", upload.array("files"), async (req, res) => {
    if (!checkBody(req.body, ["content"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    const { id } = req.params;
    const { content } = req.body;

    const signedUrl = new SignedUrl();
    if (!signedUrl.verify(req.body.frontendUrl)) {
        return res.json({ result: false, error: "Wrong signature" });
    }
    const deposition = await Deposition.findById(id).populate("placeId");
    const visualProofs = await storePicturesInCloudinary(req.files);

    const newResolution = new Resolution({
        depositionsId: [id],
        visualProofs: visualProofs.map((cloudinaryFile) => {
            return {
                url: cloudinaryFile.secure_url,
                longitude: deposition.placeId.geojson.coordinates[1],
                latitude: deposition.placeId.geojson.coordinates[0],
                // altitude: jsonPlace.alt,
                location: {
                    type: "Point",
                    coordinates: [deposition.placeId.geojson.coordinates[0], deposition.placeId.geojson.coordinates[1]],
                },
                takenAt: new Date(),
            };
        }),
        text: content,
    });

    newResolution.save().then((savedRepo) => {
        Deposition.updateMany({ _id: { $in: savedRepo.depositionsId } }, { status: "resolved" })
            .then((depositionsUpdated) => {
                console.log("depositionsUpdated", depositionsUpdated);
                /*
                    #swagger.responses[200] = {
                        description: 'Resolve deposition.',
                        schema: {
                            "resolution": {
                                "depositionsId": [
                                    "666a107fe6048363ed27b9e6"
                                ],
                                "visualProofs": [],
                                "status": "pending",
                                "text": "my explication",
                                "_id": "666a10a4e6048363ed27b9fd",
                            }
                        },
                    }
                */
                res.json({ result: true, resolution: savedRepo });
            })
            .catch((err) => {
                res.json({ result: false, message: "An error as occured solving depositions." });
            });
    });
});

const formatPlaceAddress = (placeObject) => {
    if (placeObject.street) {
        return `${placeObject.tags["addr:housenumber"]} ${placeObject.street}`;
    } else if (
        placeObject.tags &&
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
            // console.log(
            //     placeObject,
            //     "-" + typeof placeObject.tags["addr:street"] !== "undefined"
            //         ? placeObject.tags["addr:street"]
            //         : placeObject.tags["contact:street"]
            // );
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
// router.get("/:id/resolve", (req, res) => {
//     const { signature } = req.query;
//     // validate signature then ...
// });

const findOrCreatePlace = async (ref, address, latitude, longitude) => {
    // console.log(ref, address, latitude, longitude);
    let result = await Place.findOne({ uniqRef: ref });
    if (!result) {
        const newPlace = new Place({
            address: address,
            geojson: {
                type: "Point",
                coordinates: [latitude, longitude],
            },
            type: "Place",
            uniqRef: ref,
        });
        result = await newPlace.save();
    }
    return result;
};

const sendMailForDeposition = (deposition, location, url) => {
    console.log("start sending mail");
    const mailOptions = {
        from: "nopestsallowed@email.com",
        to: deposition.placeOwnerEmail,
        subject: `${location} is infected by ${deposition.type}`,
        html: template({
            name: deposition.name,
            address: location,
            takenAt: deposition.createdAt.toLocaleString("fr-FR"),
            ownerEmail: deposition.placeOwnerEmail,
            description: deposition.description,
            url: url,
        }),
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
    // console.log(
    //     "p",
    //     pictures.map((picture) => picture.originalname.split(".")[0])
    // );
    const result = await Promise.all(
        pictures.map((picture) =>
            cloudinary.uploader.upload(picture.path, {
                resource_type: "auto",
                // use_filename: true,
                // unique_filename: false,
                public_id: picture.originalname.split(".")[0],
                // metadata: `original_picture_name=${picture.originalname.split(".")[0]}`,
            })
        )
    );
    // console.log("result", result);
    return result;
};
export default router;
