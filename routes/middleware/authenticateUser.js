const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const authHeader = req?.headers.authorization;
    // console.log(authHeader);
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log("auth error", err);
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
};

module.exports = authenticateUser;
