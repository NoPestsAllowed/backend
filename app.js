require("dotenv").config();
require("./models/connection");

const authenticateUser = require("./routes/middleware/authenticateUser");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var depositionsRouter = require("./routes/depositions");
var mailRouter = require("./routes/mail");

var app = express();

const cors = require("cors");

const corsOptions = {
    origin: function (origin, callback) {
        // Remplacee 'allowedOrigins' avec vos différents URLs front pouvant accéder au Backend
        const allowedOrigins = [
            // "http://localhost:4000",
            "http://localhost:3001",
            "http://192.168.100.145:3000",
            "http://192.168.100.145:3001",
            "http://192.168.100.145:8081",
            process.env.FRONTEND_URL,
        ];
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
    methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/mail", mailRouter);
// app.use(authenticateUser);
app.use("/users", usersRouter);
app.use("/depositions", depositionsRouter);

module.exports = app;
