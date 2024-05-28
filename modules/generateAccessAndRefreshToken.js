const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = (payload) => {
    const accessToken = jwt.sign({ ...payload }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10d",
    });
    const refreshToken = jwt.sign({ ...payload }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10d",
    });

    return [accessToken, refreshToken];
};

module.exports = { generateAccessAndRefreshToken };
