// import { Account } from "../models/Account.js";

import User from "../models/users.js";

export default class OIDCAccount {
    constructor(account) {
        this.accountId = account.id;
        this.profile = account;
    }

    async claims(use, scope) {
        console.log("IN OIDC ACCOUNT CLAIMS", scope, !scope, this);
        // if (!scope) return undefined;
        const openid = { sub: this.accountId };
        const email = {
            email: this.profile.email,
            email_verified: this.profile.emailVerified,
        };
        // const noPestsAllowedId = {
        //   id: this.profile._id,
        // };

        console.log("openid", openid, "email", email);
        console.log("the response will be : ", {
            ...(scope.includes("openid") && openid),
            //   ...(scope.includes("userid") && noPestsAllowedId),
            ...(scope.includes("email") && email),
        });
        return {
            ...(scope.includes("openid") && openid),
            ...(scope.includes("email") && email),
            //   ...(scope.includes("userid") && noPestsAllowedId),
        };
        // eslint-disable-line no-unused-vars
        // if (this.profile) {
        //   return {
        //     sub: this.accountId, // it is essential to always return a sub claim
        //     email: this.profile.email,
        //     email_verified: this.profile.email_verified,
        //     family_name: this.profile.family_name,
        //     given_name: this.profile.given_name,
        //     locale: this.profile.locale,
        //     name: this.profile.name,
        //   };
        // }
        // return {
        //   sub: this.accountId, // it is essential to always return a sub claim
        //   address: {
        //     country: "000",
        //     formatted: "000",
        //     locality: "000",
        //     postal_code: "000",
        //     region: "000",
        //     street_address: "000",
        //   },
        //   birthdate: "1987-10-16",
        //   email: "johndoe@example.com",
        //   email_verified: false,
        //   family_name: "Doe",
        //   gender: "male",
        //   given_name: "John",
        //   locale: "en-US",
        //   middle_name: "Middle",
        //   name: "John Doe",
        //   nickname: "Johny",
        //   phone_number: "+49 000 000000",
        //   phone_number_verified: false,
        //   picture: "http://lorempixel.com/400/200/",
        //   preferred_username: "johnny",
        //   profile: "https://johnswebsite.com",
        //   updated_at: 1454704946,
        //   website: "http://example.com",
        //   zoneinfo: "Europe/Berlin",
        // };
    }

    static async findByFederated(provider, claims) {
        console.log("FINDING ACCOUNT BY FEDERATED", login);
        const id = `${provider}.${claims.sub}`;
        if (!logins.get(id)) {
            logins.set(id, new Account(id, claims));
        }
        return logins.get(id);
    }

    static async findByLogin(login) {
        console.log("FINDING ACCOUNT BY LOGIN", login);
        const account = await User.findOne({ email: login });
        if (!account) {
            console.log(`no Account found for login: ${login}`);
            return null;
        }
        return new OIDCAccount(account);
    }

    static async findAccount(ctx, id, token) {
        // eslint-disable-line no-unused-vars
        // token is a reference to the token used for which a given account is being loaded,
        //   it is undefined in scenarios where account claims are returned from authorization endpoint
        // ctx is the koa request context
        console.log("FINDING ACCOUNT", ctx, id, token);
        try {
            const account = await User.findById(id);
            console.log("account found", account, id);
            // if (account === null) new OIDCAccount(id); // eslint-disable-line no-new
            return new OIDCAccount(account);
        } catch (error) {
            console.error("ISSET AN ERROR FINDING ACCOUNT", error);
        }
    }
}

// export default Account;
