const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = (payload) => {
    const accessToken = generateAccessToken({ ...payload });
    const refreshToken = jwt.sign({ ...payload }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10d",
    });

    return [accessToken, refreshToken];
};

const generateAccessToken = (payload) => {
    return jwt.sign({ ...payload }, process.env.ACCESS_TOKEN_SECRET, {
        // expiresIn: "10d",
    });
};

const clearTokens = async (req, res) => {
    const { signedCookies = {} } = req;
    const { refreshToken } = signedCookies;
    if (refreshToken) {
        const tokenFromDB = await refreshToken.findOne({ refreshToken });
        if (tokenFromDB) {
            console.log("revocking token from db");
            tokenFromDB.update({ revokedAt: Date.now() });
        }
    }
    res.clearCookie("nopestsallowed_jwt", {
        httpOnly: true,
        secure: false,
        signed: true,
    });
};

module.exports = { generateAccessAndRefreshToken, generateAccessToken, clearTokens };
