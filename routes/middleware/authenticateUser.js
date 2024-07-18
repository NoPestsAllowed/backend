import jwt from "jsonwebtoken";
import { promisify } from "node:util";
import jwksClient from "jwks-rsa";
import User from "../../models/users.js";

const authenticateUser = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }

    const fetchJwksUri = async (issuer) => {
        const response = await fetch(`${issuer}/oidc/.well-known/openid-configuration`);
        const { jwks_uri } = await response.json();
        return jwks_uri;
    };

    const getKey = (jwksUri) => (header, callback) => {
        // console.log("jwksUri in getKey", jwksUri);
        const client = jwksClient({ jwksUri });
        client.getSigningKey(header.kid, (err, key) => {
            if (err) {
                return callback(err);
            }
            callback(null, key.publicKey || key.rsaPublicKey);
        });
    };

    try {
        console.log(token, jwt.decode(token));
        const { iss: issuer } = jwt.decode(token);
        console.log("issuer", issuer);
        const jwksUri = await fetchJwksUri(issuer);
        const authenticatedUser = await promisify(jwt.verify)(token, getKey(jwksUri));
        // console.log("authenticatedUser is : ", authenticatedUser);
        req.user = authenticatedUser;
        next();
    } catch (error) {
        console.error(error);
        return res.sendStatus(403);
    }

    // const verify = async (token) => {
    //     const { iss: issuer } = jwt.decode(token);
    //     console.log("issuer", issuer);
    //     const jwksUri = await fetchJwksUri(issuer);
    //     console.log("jwksUri", jwksUri);
    //     return promisify(jwt.verify)(token, getKey(jwksUri));
    // };

    // const decodeToken = async (token) => {
    //     const { iss: issuer } = jwt.decode(token);
    //     console.log("issuer", issuer);
    //     const jwksUri = await fetchJwksUri(issuer);
    //     console.log("jwksUri", jwksUri);
    //     return promisify(jwt.decode)(token, getKey(jwksUri));
    // };

    // const setUser = async (sub) => {
    //     console.log(sub);
    //     const user = await User.findById(sub);
    //     req.user = user;
    //     // console.log(req.user);
    //     // return user;
    // };
    // verify(token)
    //     .then((user) => {
    //         console.log("Token verified successfully.");
    //         console.log(user);
    //         // decodeToken(token).then((decodedToken) => console.log("decodedToken", decodedToken));
    //         // console.log("decoded token is ", jwt.decode(token, { complete: true }));
    //         await setUser(user.sub);
    //         // console.log("here");
    //         next();
    //     })
    //     .catch((err) => {
    //         console.log("auth error", err);
    //         return res.sendStatus(403);
    //     });

    // return res.sendStatus(403);
    // jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithms: ["ES256"] }, (err, user) => {
    //     if (err) {
    //         console.log("auth error", err);
    //         return res.sendStatus(403);
    //     }

    //     req.user = user;
    //     next();
    // });
};

export default authenticateUser;
