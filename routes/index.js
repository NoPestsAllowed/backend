var express = require("express");
var router = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/users");
const RefreshToken = require("../models/refreshTokens");
const {
    generateAccessAndRefreshToken,
    clearTokens,
    generateAccessToken,
} = require("../modules/generateAccessAndRefreshToken");
const authenticateUser = require("./middleware/authenticateUser");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const templatePath = path.join(__dirname, "../templates/emails/accountRegistered.hbs");
const source = fs.readFileSync(templatePath, "utf8");
const template = handlebars.compile(source);

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

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" });
});

/* Authentication routes goes bellow. */
router.post("/register", (req, res) => {
    const { firstname, lastname, email, password } = req.body;
    // console.log(firstname, lastname, email, password);
    User.findOne({ email: email })
        .then((existingUser) => {
            if (existingUser) {
                return res.json({ result: false, message: "User already exist" });
            }
            const [accessToken, refreshToken] = generateAccessAndRefreshToken({ email });
            const newUser = new User({
                firstname: firstname,
                lastname: lastname,
                email: email,
                password: bcrypt.hashSync(password, 10),
                token: accessToken,
            });

            newUser.save().then((user) => {
                const [accessToken] = generateAccessAndRefreshToken({ email: user.email, id: user.id });
                user.token = accessToken;
                user.save();
                const newRefreshToken = new RefreshToken({
                    email: user.email,
                    refreshToken,
                });
                newRefreshToken.save().then((savedRefreshToken) => {
                    res.cookie("nopestsallowed_jwt", savedRefreshToken, {
                        httpOnly: true,
                        // sameSite: "none",
                        secure: false,
                        signed: true,
                        maxAge: 24 * 60 * 60 * 1000, // 1 day : 24h * 60min * 60sec * 1000ms
                    });

                    // return res.json({ result: true, user: user });
                    const mailOptions = {
                        from: "nous@nopestsallowed.com",
                        to: user.email,
                        subject: "Bienvenue chez NoPestsAllowed",
                        html: template({
                            firstname: firstname,
                            company: "NoPestsAllowed",
                            lien: "www.nopestsallowed.com",
                            message:
                                "Bonjour. Nous sommes heureux de vous informer que votre compte a été bien créé. Pour vous connecter, veuillez utiliser votre adresse e-mail et votre mot de passe créés lors de l'inscription. Obliez le mdp? Voici le lien: www.nopestsallowed.com/password. Cordialement, l'equipe de NoPestsAllowed 🐞🪲🐝.",
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
                    return res.json({ result: true, user: user });
                });
            });
        })
        .catch((error) => {
            res.json({ result: false, message: error.message });
        });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    // console.log(email, password);
    User.findOne({ email: email }).then((user) => {
        // console.log("user", user);
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).send("Error: Unauthorized");
        }
        const [accessToken, refreshToken] = generateAccessAndRefreshToken({ email: user.email, id: user.id });

        const newRefreshToken = new RefreshToken({
            email,
            refreshToken,
        });

        RefreshToken.updateMany({ email: email, revokedAt: null }, { revokedAt: new Date() }).then((resp) => {
            newRefreshToken.save().then((savedRefreshToken) => {
                const cookieTokenContent = {
                    refreshToken: savedRefreshToken.refreshToken,
                    userId: user.id,
                    expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).getTime(),
                };
                res.cookie("nopestsallowed_jwt", cookieTokenContent, {
                    httpOnly: true,
                    // sameSite: "none",
                    secure: false,
                    signed: true,
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 1 day : 24h * 60min * 60sec * 1000ms
                });

                return res.json({
                    result: true,
                    token: accessToken,
                    user: user,
                    expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                });
            });
        });
    });
});

// router.use(authenticateUser);

// Route de déconnexion
router.post("/logout", authenticateUser, (req, res) => {
    // 1. Récupération du refreshToken depuis les cookies
    // console.log(req.user, req.headers, req.cookies, req.signedCookies);
    // const refreshToken = req.cookies.nopestsallowed_jwt;
    // // Vérifie si le refreshToken est présent
    // if (!refreshToken) {
    //     return res.status(401).json({ result: false, message: "No token provided" });
    // }

    // 2. Vérifie et révoque le refreshToken s'il est valide
    RefreshToken.findOneAndUpdate(
        { email: req.user.email, revokedAt: null }, // Cherche un refreshToken non révoqué
        { revokedAt: new Date() } // Ajoute une date de révocation
    )
        .then((token) => {
            console.log("token", token);
            // if (!token) {
            //     // Si aucun token valide trouvé
            //     return res.status(401).json({ result: false, message: "Invalid token" });
            // }

            // 3. Supprime le cookie du navigateur
            res.clearCookie("nopestsallowed_jwt", {
                httpOnly: true,
                secure: true,
            });

            // 4. Répondre au client que la déconnexion a réussi
            return res.json({ result: true, message: "Logged out successfully" });
        })
        .catch((error) => {
            // Gestion des erreurs
            return res.status(500).json({ result: false, error: error.message });
        });
});

router.get("/refresh", async (req, res) => {
    // const refreshToken = req.body.refreshToken;
    const { signedCookies = {} } = req;
    const { nopestsallowed_jwt } = signedCookies;
    // console.log(signedCookies, nopestsallowed_jwt);

    if (!nopestsallowed_jwt) {
        return res.sendStatus(204);
    }

    const decoded = jwt.verify(nopestsallowed_jwt.refreshToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    console.log(decoded);

    if (!user) {
        await clearTokens(req, res);
        return res.sendStatus(401);
    }

    const accessToken = generateAccessToken({ email: user.email, id: user.id });

    return res.json({
        result: true,
        token: accessToken,
        expireAt: new Date(Date.now() + 1),
    });
    // const newRefreshToken = new RefreshToken({
    //     email: user.email,
    //     refreshToken,
    // });

    // newRefreshToken.save().then((savedRefreshToken) => {
    //     const cookieTokenContent = {
    //         refreshToken: savedRefreshToken.refreshToken,
    //         userId: user.id,
    //         expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).getTime(),
    //     };

    //     res.cookie("nopestsallowed_jwt", cookieTokenContent, {
    //         httpOnly: true,
    //         // sameSite: "none",
    //         secure: false,
    //         signed: true,
    //         expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 1 day : 24h * 60min * 60sec * 1000ms
    //     });

    //     // return res.sendStatus(204);
    //     return res.json({
    //         result: true,
    //         token: accessToken,
    //         expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    //     });
    // });
});

module.exports = router;
