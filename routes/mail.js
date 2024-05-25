var express = require("express");
var router = express.Router();
// Import the Nodemailer library
const nodemailer = require("nodemailer");

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
    // Configure the mailoptions object
    const mailOptions = {
        from: "yourusername@email.com",
        to: "yourfriend@email.com",
        subject: "Sending Email using Node.js",
        text: "That was easy!",
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
