var express = require("express");
var router = express.Router();
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const authenticateUser = require("./middleware/authenticateUser");
const Deposition = require("../models/depositions");
const { generateAccessAndRefreshToken, clearTokens } = require("../modules/generateAccessAndRefreshToken");
const { checkBody } = require("../modules/checkBody");

/* GET users listing. */
router.get("/", function (req, res, next) {
    User.find().then((data) => {
        /*
            #swagger.responses[200] = {
                description: 'Get all users.',
                schema: {
                    users: [{$ref: '#/definitions/User'}],
                },
            }
        */
        res.json(data);
    });
});

router.put("/update/:id", authenticateUser, (req, res) => {
    const id = req.params.id;
    if (!checkBody(req.body, ["firstname", "lastname"])) {
        console.log("missing fields");
        return res.json({ result: false, error: "Missing or empty fields" });
    }
    const { firstname, lastname, dateOfBirth, password, avatarUrl } = req.body;

    let hashedPassword;
    if (password) {
        hashedPassword = bcrypt.hashSync(password, 10);
    }

    User.updateOne(
        { _id: id },
        {
            firstname: firstname,
            lastname: lastname,
            dateOFBirth: dateOfBirth,
            password: hashedPassword ? hashedPassword : undefined,
            avatarUrl: avatarUrl,
        }
    ).then((response) => {
        if (response.modifiedCount === 1) {
            /*
                #swagger.responses[200] = {
                    description: 'Update user\'s account.',
                    schema: {
                        result: true,
                        tmessage: "Informations mises à jour avec succès" },
                    },
                }
            */
            res.status(200).json({ result: true, message: "Informations mises à jour avec succès" });
        } else {
            res.status(400).json({ result: false, error: "Vos modifications n'ont pas été prises en compte" });
        }
    });
});

router.delete("/delete/:id", authenticateUser, (req, res) => {
    const id = req.params.id;
    if (!checkBody(req.params, ["id"])) {
        return res.json({ result: false, error: "Missing user id" });
    }
    User.deleteOne({ _id: id }).then((deletedDoc) => {
        if (deletedDoc.deletedCount > 0) {
            /*
                    #swagger.responses[200] = {
                        description: 'Delete current user\'s account',
                        schema: {
                            result: true,
                            message: "Votre compte a bien été supprimé",
                        },
                    }
                */
            res.status(200).json({ message: "Votre compte a bien été supprimé" });
        } else {
            res.status(400).json({ result: false, error: "Ce compte n'existe pas" });
        }
    });
});

router.get("/depositions", authenticateUser, (req, res) => {
    const { id } = req.user;
    Deposition.find({ userId: id })
        .populate("placeId")
        .sort({ createdAt: -1 })
        .limit(10)
        .then((data) => {
            /*
                #swagger.responses[200] = {
                    description: 'Get all deposition for current user.',
                    schema: {
                        result: true,
                        depositions: {$ref: '#/definitions/Deposition'},
                    },
                }
            */
            res.json({ result: true, depositions: data });
        })
        .catch((err) => console.log(err));
});

router.get("/me", authenticateUser, (req, res) => {
    User.findById(req.user.id).then((user) => {
        if (user) {
            /*
                #swagger.responses[200] = {
                    description: 'Get current authenticated user.',
                    schema: {
                        result: true,
                        user: {$ref: '#/definitions/User'},
                    },
                }
            */
            return res.json({ result: true, user });
        }
        return res.json({ result: false, message: "User not found" });
    });
});

module.exports = router;
