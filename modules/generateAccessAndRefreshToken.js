const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = (name) => {
    const accessToken = jwt.sign({ username: name }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10s",
    });
    const refreshToken = jwt.sign({ username: name }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
    });

    return [accessToken, refreshToken];
};

module.exports = { generateAccessAndRefreshToken };
