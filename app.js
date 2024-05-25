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
