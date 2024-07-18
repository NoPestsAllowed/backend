import {} from "dotenv/config";
import "./models/connection.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Documentation
import swaggerUi from "swagger-ui-express";
const swaggerFile = require("./swagger-output.json");

import authenticateUser from "./routes/middleware/authenticateUser.js";

import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";

import bodyParser from "body-parser";
import cors from "cors";

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import depositionsRouter from "./routes/depositions.js";
import mailRouter from "./routes/mail.js";
import oidcRouter from "./routes/oidc.js";
import geocoderRouter from "./routes/geocoder.js";

const app = express();

app.set("views", path.join("./", "views"));
app.set("view engine", "ejs");

app.use((req, res, next) => {
    const orig = res.render;
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
        app.render(view, locals, (err, html) => {
            if (err) throw err;
            orig.call(res, "_layout", {
                ...locals,
                body: html,
            });
        });
    };
    next();
});

app.use("/oidc", oidcRouter);

const corsOptions = {
    origin: function (origin, callback) {
        // Remplacee 'allowedOrigins' avec vos différents URLs front pouvant accéder au Backend
        const allowedOrigins = [
            // "http://localhost:4000",
            "http://localhost:3001",
            "http://192.168.100.145:3000",
            "http://192.168.100.145:3001",
            "http://192.168.100.145:8081",
            `http://${process.env.FRONTEND_URL}`,
            `https://${process.env.FRONTEND_URL}`,
            "com.anonymous.no-pests-allowed://",
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
app.use(cookieParser(process.env.ACCESS_TOKEN_SECRET));
app.use(express.static(path.join("./", "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    "/doc",
    swaggerUi.serve,
    swaggerUi.setup(swaggerFile, {
        customJs: [
            "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js",
        ],
        customCssUrl: [
            "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
            "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css",
            "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css",
        ],
    })
);

app.use("/", indexRouter);
app.use("/geocoder", geocoderRouter);
app.use("/mail", mailRouter);
// app.use(authenticateUser);
app.use("/users", usersRouter);
app.use("/depositions", depositionsRouter);

export default app;
