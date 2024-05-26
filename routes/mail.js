var express = require("express");
var router = express.Router();
// Import the Nodemailer library
const nodemailer = require("nodemailer");
const { SignedUrl } = require("../modules/generateSignedUrl");
// import { Signature } from "../modules/generateSignedUrl";

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

router.get("/test", (req, res) => {
    // const signature = Signature;
    let signedUrl = new SignedUrl();
    // const lundi = signedUrl.sign("Lundi");
    // const realUrl = signedUrl.sign("http://npa.app", {
    //     params: {
    //         email: "monuser@test.test",
    //     },
    // });
    // const anotherRealUrl = signedUrl.sign("http://npa.app", {
    //     ttl: 60 * 60 * 24,
    //     params: {
    //         email: "another@test.test",
    //     },
    // });
    // const expiredUrl = signedUrl.sign("http://npa.app", {
    //     ttl: 2,
    //     params: {
    //         email: "another@test.test",
    //     },
    // });
    // console.log("lundi", lundi);
    // console.log("realUrl", realUrl);
    // console.log("anotherRealUrl", anotherRealUrl);
    // console.log("——— EXTRACTION METHOD ———");
    // console.log("extract lundi", signedUrl.verify(lundi));
    // console.log("extract realUrl", signedUrl.verify(realUrl));
    // console.log("extract anotherRealUrl", signedUrl.verify(anotherRealUrl));
    // let i = setTimeout(() => {
    //     console.log("expired", signedUrl.verify(expiredUrl));
    // }, 3000);
    // // clearTimeout(i);

    const url = signedUrl.sign("http://npa.app", {
        ttl: 60 * 60 * 24,
        params: {
            email: "yourfriend@email.com",
        },
    });

    // Configure the mailoptions object
    const mailOptions = {
        from: "yourusername@email.com",
        to: "yourfriend@email.com",
        subject: "Sending Email using Node.js",
        text: "That was easy!",
        html: `
            <h1>Act or die</h1>
            now just click : <a href="${url}">This link</a>
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
});

module.exports = router;
