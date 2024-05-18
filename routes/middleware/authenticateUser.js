const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const authHeader = req?.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.PASS_PHRASE, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
};

module.exports = authenticateUser;
