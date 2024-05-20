const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = (email) => {
    const accessToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10s",
    });
    const refreshToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
    });

    return [accessToken, refreshToken];
};

module.exports = { generateAccessAndRefreshToken };
