var express = require("express");
var router = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/users");
const RefreshToken = require("../models/refreshTokens");
const { generateAccessAndRefreshToken } = require("../modules/generateAccessAndRefreshToken");

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" });
});

/* Authentication routes goes bellow. */
router.post("/register", (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    console.log(firstname, lastname, email, password);
    User.findOne({ email: email }).then((existingUser) => {
        if (existingUser) {
            return res.json({ result: false, message: "User already exist" });
        }
        const [accessToken, refreshToken] = generateAccessAndRefreshToken(email);
        const newUser = new User({
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: bcrypt.hashSync(password, 10),
            token: accessToken,
        });

        newUser.save().then((user) => {
            const newRefreshToken = new RefreshToken({
                email: user.email,
                refreshToken,
            });
            newRefreshToken.save().then((savedRefreshToken) => {
                res.cookie("nopestsallowed_jwt", savedRefreshToken, {
                    httpOnly: true,
                    // sameSite: "none",
                    secure: true,
                    maxAge: 24 * 60 * 60 * 1000, // 1 day : 24h * 60min * 60sec * 1000ms
                });
                return res.json({ result: true, user: user });
            });
        });
    });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    User.findOne({ email: email }).then((user) => {
        console.log("user", user);
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).send("Error: Unauthorized");
        }
        const [accessToken, refreshToken] = generateAccessAndRefreshToken(email);

        const newRefreshToken = new RefreshToken({
            email,
            refreshToken,
        });

        RefreshToken.updateMany({ email: email, revokedAt: null }, { revokedAt: new Date() }).then((resp) => {
            newRefreshToken.save().then((savedRefreshToken) => {
                res.cookie("nopestsallowed_jwt", savedRefreshToken.refreshToken, {
                    httpOnly: true,
                    // sameSite: "none",
                    secure: true,
                    maxAge: 24 * 60 * 60 * 1000, // 1 day : 24h * 60min * 60sec * 1000ms
                });
                return res.json({
                    result: true,
                    token: accessToken,
                });
            });
        });
    });
});

module.exports = router;
