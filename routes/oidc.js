import express from "express";
import bodyParser from "body-parser";
import * as querystring from "node:querystring";
import { inspect } from "node:util";
const router = express.Router();
import Provider from "oidc-provider";
import oauthConfig from "../support/oidc-config.js";
// import { Account } from "../models/Account.js";
import OIDCAccount from "../support/OIDCAccount.js";
import { checkBody } from "../modules/checkBody.js";
import User from "../models/users.js";

oauthConfig.findAccount = OIDCAccount.findAccount;
const oidcProvider = new Provider("http://192.168.1.17:3000", oauthConfig);

const setNoCache = (req, res, next) => {
    res.set("Pragma", "no-cache");
    res.set("Cache-Control", "no-cache, no-store");
    next();
};

oidcProvider.addListener("server_error", (etx, error) => {
    console.error("server error", JSON.stringify(etx, null, 2));
});

const keys = new Set();
const debug = (obj) =>
    querystring.stringify(
        Object.entries(obj).reduce((acc, [key, value]) => {
            keys.add(key);
            if (!value || value === "") return acc;
            acc[key] = inspect(value, { depth: null });
            return acc;
        }, {}),
        "<br/>",
        ": ",
        {
            encodeURIComponent(value) {
                return keys.has(value) ? `<strong>${value}</strong>` : value;
            },
        }
    );

const parse = bodyParser.urlencoded({ extended: false });

router.get("/interaction/:uid", setNoCache, async (req, res, next) => {
    //   console.log("INTERACTION INDEX");
    //   console.log("COOKIES", req.headers.cookie);

    try {
        const { uid, prompt, params, session } = await oidcProvider.interactionDetails(req, res);

        const client = await oidcProvider.Client.find(params.client_id);
        // console.log("PROMPT NAME : ", prompt.name);
        switch (prompt.name) {
            //   case "register": {
            //     return res.render("register", {
            //       client,
            //       uid,
            //       details: prompt.details,
            //       params,
            //       title: "Create new Account",
            //       session: session ? debug(session) : undefined,
            //       dbg: {
            //         params: debug(params),
            //         prompt: debug(prompt),
            //       },
            //     });
            //   }
            case "login": {
                return res.render("login", {
                    client,
                    uid,
                    details: prompt.details,
                    params,
                    title: "Sign-in",
                    session: session ? debug(session) : undefined,
                    dbg: {
                        params: debug(params),
                        prompt: debug(prompt),
                    },
                });
            }
            case "consent": {
                return res.render("interaction", {
                    client,
                    uid,
                    details: prompt.details,
                    params,
                    title: "Authorize",
                    session: session ? debug(session) : undefined,
                    dbg: {
                        params: debug(params),
                        prompt: debug(prompt),
                    },
                });
            }
            default:
                return undefined;
        }
    } catch (err) {
        return next(err);
    }
});

router.post("/interaction/:uid/confirm", setNoCache, parse, async (req, res, next) => {
    // console.log("INTERACTION CONFIRM");
    try {
        const interactionDetails = await oidcProvider.interactionDetails(req, res);
        const {
            prompt: { name, details },
            params,
            session: { accountId },
        } = interactionDetails;
        // assert.equal(name, "consent");
        if (name !== "consent") {
            // console.log("name !== consent");
            throw new Error("name is not consent");
        }

        let { grantId } = interactionDetails;
        let grant;

        if (grantId) {
            // console.log("ISSET GRANT ID", grantId);
            // we'll be modifying existing grant in existing session
            grant = await oidcProvider.Grant.find(grantId);
        } else {
            // console.log("acountId is", accountId);
            // we're establishing a new grant
            grant = new oidcProvider.Grant({
                accountId,
                clientId: params.client_id,
            });
        }

        if (details.missingOIDCScope) {
            console.log("details.missingOIDCScope", details.missingOIDCScope);
            grant.addOIDCScope(details.missingOIDCScope.join(" "));
        }
        if (details.missingOIDCClaims) {
            console.log("details.missingOIDCClaims", details.missingOIDCClaims);
            grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
            console.log("details.missingResourceScopes", details.missingResourceScopes);
            for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
                grant.addResourceScope(indicator, scopes.join(" "));
            }
        }

        grantId = await grant.save();
        //   console.log("grantId is ", grantId);
        //   console.log("interactionDetails", interactionDetails);
        const consent = {
            // login: {
            //   account: accountId,
            // },
        };
        if (!interactionDetails.grantId) {
            // we don't have to pass grantId to consent, we're just modifying existing one
            consent.grantId = grantId;
        }

        //   console.log("INTERACTION DETAILS : ", interactionDetails);

        const result = { consent };
        console.log("result is", result);
        await oidcProvider.interactionFinished(req, res, result, {
            mergeWithLastSubmission: true,
        });
    } catch (err) {
        next(err);
    }
});

router.post("/interaction/:uid/login", setNoCache, parse, async (req, res, next) => {
    // console.log("INTERACTION LOGIN");
    try {
        const {
            prompt: { name },
        } = await oidcProvider.interactionDetails(req, res);
        //   assert.equal(name, "login");
        if (name !== "login") {
            throw new Error("prompt.name is not login");
        }
        //   const account = await Account.findByLogin(req.body.login);
        const account = await OIDCAccount.findByLogin(req.body.login);
        if (!account) {
            throw new Error("Account not found");
        }
        //   console.log("ACCOUNT", req.body.login, account);
        const result = {
            login: {
                accountId: account.accountId, // must match value provided in [sub]
                //   userId: account.profile.id,
            },
            consent: {},
        };
        //   console.log(result);
        await oidcProvider.interactionFinished(req, res, result, {
            mergeWithLastSubmission: true,
        });
    } catch (err) {
        const result = {
            error: "access_denied",
            error_description: "Account not found",
        };
        await oidcProvider.interactionFinished(req, res, result, {
            mergeWithLastSubmission: false,
        });
        next(err);
    }
});

// USER REGISTRATION

router.get("/interaction/:uid/create", async (req, res) => {
    //   console.log("INTERACTION CREATE");
    const { uid, prompt, params, session } = await oidcProvider.interactionDetails(req, res);
    const client = await oidcProvider.Client.find(params.client_id);

    return res.render("register", {
        client,
        uid,
        details: prompt.details,
        params,
        title: "Create new Account",
        session: session ? debug(session) : undefined,
        dbg: {
            params: debug(params),
            prompt: debug(prompt),
        },
    });
});

router.post("/interaction/:uid/reg", setNoCache, parse, async (req, res, next) => {
    console.log("INTERACTION REGISTER");
    // console.log(req.body);
    if (!checkBody(req.body, ["firstName", "lastName", "email", "password"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }
    const { firstName, lastName, email, password } = req.body;
    try {
        // const details = await oidcProvider.interactionDetails(req, res);
        // const { email, firstName, lastName, password } = req.body;
        //   if (await get(email));
        //   console.log("BEFORE ACCOUNT CREATION");
        const userExist = await User.findOne({ email: email });
        if (userExist) {
            throw new Error("User already exist!");
        }
        const newUser = await User.create({
            email,
            firstname: firstName,
            lastname: lastName,
            password,
        });
        const oidcAccount = new OIDCAccount(newUser);
        //   console.log("BEFORE ACCOUNT CREATION");
        console.log("NEW USER ", newUser, oidcAccount);
        const result = {
            login: {
                accountId: oidcAccount.accountId, // must match value provided in [sub]
                // userId: oidcAccount.profile.id,
            },
        };
        // console.log(result);
        await oidcProvider.interactionFinished(req, res, result, {
            mergeWithLastSubmission: true,
        });
    } catch (err) {
        console.error("ACCOUNT CREATION ERROR ", err);
        //   const result = {
        //     error: "access_denied",
        //     error_description: "Account creation error",
        //   };
        //   await oidcProvider.interactionFinished(req, res, result, {
        //     mergeWithLastSubmission: false,
        //   });
        next(err);
    }
});

router.get("/interaction/:uid/abort", setNoCache, async (req, res, next) => {
    console.log("INTERACTION ABORT");
    try {
        const result = {
            error: "access_denied",
            error_description: "End-User aborted interaction",
        };
        await oidcProvider.interactionFinished(req, res, result, {
            mergeWithLastSubmission: false,
        });
    } catch (err) {
        next(err);
    }
});

// router.get("/interaction/:uid", setNoCache, async (req, res, next) => {
//   console.log("iefbqsdlfb");
// //   return oidcServer.handleBeforeLoginEntrypoint(req, res, next);
// });
// router.post(
//   "/auth/oidc/interaction/:uid/login",
//   setNoCache,
//   parse,
//   async (req, res, next) =>
//     oidc.handleLoginEntrypoint(req, res, next, oidcServer)
// );
// router.post(
//   "/auth/oidc/interaction/:uid/confirm",
//   setNoCache,
//   parse,
//   async (req, res, next) =>
//     oidc.handleConfirmGrantEntrypoint(req, res, next, oidcServer)
// );
// router.get(
//   "/auth/oidc/interaction/:uid/abort",
//   setNoCache,
//   async (req, res, next) =>
//     oidc.handleLoginCancelEntrypoint(req, res, next, oidcServer)
// );

// router.get("/interaction/:uid", async (req, res) => {
//   const details = await oidc.interactionDetails(req, res);
//   console.log(details);
// });

// router.post("/token", (req, res) => {
//   console.debug(req);
//   console.log("GETTING TOKEN - GETTING TOKEN - GETTING TOKEN - GETTING TOKEN");
// });
router.use("/", oidcProvider.callback());

router.use((err, req, res, next) => {
    //   if (err instanceof SessionNotFound) {
    //     // handle interaction expired / session not found error
    //     console.log("session not found error thrown");
    //   }
    console.error("here is the error", err);
    next(err);
});

export default router;
