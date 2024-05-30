var express = require("express");
var router = express.Router();
// Import the Nodemailer library
const nodemailer = require("nodemailer");
const { SignedUrl } = require("../modules/generateSignedUrl");
// import { Signature } from "../modules/generateSignedUrl";

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const templatePath = path.join(__dirname, "../templates/emails/messageSent.hbs");
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

// router.get("/test", (req, res) => {
//     // const signature = Signature;
//     let signedUrl = new SignedUrl();
//     // const lundi = signedUrl.sign("Lundi");
//     // const realUrl = signedUrl.sign("http://npa.app", {
//     //     params: {
//     //         email: "monuser@test.test",
//     //     },
//     // });
//     // const anotherRealUrl = signedUrl.sign("http://npa.app", {
//     //     ttl: 60 * 60 * 24,
//     //     params: {
//     //         email: "another@test.test",
//     //     },
//     // });
//     // const expiredUrl = signedUrl.sign("http://npa.app", {
//     //     ttl: 2,
//     //     params: {
//     //         email: "another@test.test",
//     //     },
//     // });
//     // console.log("lundi", lundi);
//     // console.log("realUrl", realUrl);
//     // console.log("anotherRealUrl", anotherRealUrl);
//     // console.log("——— EXTRACTION METHOD ———");
//     // console.log("extract lundi", signedUrl.verify(lundi));
//     // console.log("extract realUrl", signedUrl.verify(realUrl));
//     // console.log("extract anotherRealUrl", signedUrl.verify(anotherRealUrl));
//     // let i = setTimeout(() => {
//     //     console.log("expired", signedUrl.verify(expiredUrl));
//     // }, 3000);
//     // // clearTimeout(i);

//     const url = signedUrl.sign("http://npa.app", {
//         ttl: 60 * 60 * 24,
//         params: {
//             email: "nopestsallowed@email.com",
//         },
//     });

// router.post("/depositions/create", async (req, res) => {
//     try {
//         const deposition = req.body;
//         const mailOptions = {
//             from: process.env.MAIL_USERNAME,
//             to: deposition.placeOwnerEmail,
//             subject: "New Deposition Created",
//             html: template({
//                 name: deposition.name,
//                 createdAt: new Date().toLocaleDateString(),
//                 description: deposition.description,
//             }),
//         };
//         await transporter.sendMail(mailOptions);
//         res.status(200).json({ message: "Deposition created and email sent successfully." });
//     } catch (error) {
//         console.error("Error creating deposition:", error);
//         res.status(500).json({ message: "Failed to create deposition and send email." });
//     }
// });

router.post("/contact-us", (req, res) => {
    const {firstname, lastname, email, title, message} = req.body;
    console.log(firstname, lastname, email, title, message);

    const mailOptions = {
        from: email,
        to: "nous@nopestsallowed.com",
        subject: "Un utilisateur a envoyé un message",
        html: template({
            firstname: firstname,
            lastname: lastname,
            email: email,
            title: title,
            message: message,
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

    res.json({result: true, message: "Email sent"});
})

module.exports = router;
