import { MongooseAdapter } from "./adapters/MongooseAdapter.js";
// import { get } from "../services/account-service.js";
import { interactionPolicy } from "oidc-provider";
import OIDCAccount from "./OIDCAccount.js";
const { Prompt, Check, base } = interactionPolicy;
const basePolicy = base();
// const registerPrompt = new Prompt(
//   {
//     name: "create",
//     requestable: true,
//   }
//   //   new Check(
//   // "native_client_prompt",
//   // "native clients require End-User interaction",
//   // "interaction_required",
//   // (ctx) => {
//   //   const { oidc } = ctx;
//   //   if (
//   // oidc.client.applicationType === "native" &&
//   // oidc.params.response_type !== "none" &&
//   // (!oidc.result || !("consent" in oidc.result))
//   //   ) {
//   // return Check.REQUEST_PROMPT;
//   //   }
//   //
//   //   return Check.NO_NEED_TO_PROMPT;
//   // }
//   //   )
// );
// basePolicy.add(registerPrompt, 0);
// console.log(basePolicy);
export default {
    adapter: MongooseAdapter,
    //   async findAccount(ctx, sub, token) {
    //     // console.log("sub is", sub);
    //     const account = await OIDCAccount.findAccount(ctx, sub, token);
    //     console.log("account is", account);
    //     return {
    //       accountId: sub,
    //       userId: account.profile.id,
    //       async claims(use, scope, claims, rejected) {
    //         console.log("scope in findAccount", scope);
    //         if (!scope) return undefined;
    //         const openid = { sub };
    //         const email = {
    //           email: account.profile.email,
    //           email_verified: account.profile.emailVerified,
    //         };
    //         const noPestsAllowedId = {
    //           id: account.profile.id,
    //         };

    //         console.log("the response will be : ", {
    //           ...(scope.includes("openid") && openid),
    //           ...(scope.includes("userid") && noPestsAllowedId),
    //           ...(scope.includes("email") && email),
    //         });
    //         return {
    //           ...(scope.includes("openid") && openid),
    //           ...(scope.includes("email") && email),
    //           ...(scope.includes("userid") && noPestsAllowedId),
    //         };
    //       },
    //     };
    //   },
    features: {
        devInteractions: { enabled: false },
        resourceIndicators: {
            defaultResource: (ctx, client, oneOf) => {
                return "http://nopestsallowed.com";
            },
            enabled: true,
            getResourceServerInfo: (ctx, resourceIndicator, client) => {
                return {
                    //   audience: resourceIndicator,
                    scope: "openid email userid offline_access",
                    accessTokenTTL: 2 * 60 * 60, // 2 hours
                    accessTokenFormat: "jwt",
                    jwt: {
                        sign: { alg: "ES256" },
                    },
                };
            },
            useGrantedResource: (ctx, model) => {
                console.log("MODEL", model);
                return true;
            },
        },
        introspection: { enabled: true },
        claimsParameter: { enabled: true },
        deviceFlow: { enabled: true },
        encryption: { enabled: true },
        registration: { enabled: true },
        registrationManagement: {
            enabled: true,
            rotateRegistrationAccessToken: true,
        },
        revocation: { enabled: true },
        pushedAuthorizationRequests: { enabled: true },
        // requestObjects: {
        //   request: true,
        //   requestUri: true,
        //   mode: "strict",
        // },
        jwtResponseModes: { enabled: true },
        jwtUserinfo: { enabled: true },
        userinfo: { enable: true },
    },
    interactions: {
        policy: basePolicy,
        url(ctx, interaction) {
            //   console.log("IN INTERACTIONS");
            //   console.log(interaction, ctx);
            return `/oidc/interaction/${interaction.uid}`; // MUST BE : /oidc/interaction/${interaction.uid}
        },
    },
    clients: [
        {
            application_type: "native",
            client_id: "oidc_client",
            client_secret: "maSuperPhrasePourHasher",
            grant_types: ["refresh_token", "authorization_code"],
            redirect_uris: ["com.anonymous.no-pests-allowed://"],
            token_endpoint_auth_method: "none",
        },
    ],
    issueRefreshToken: async (ctx, client, code) => {
        // return true;
        return (
            client.grantTypeAllowed("refresh_token") &&
            (code.scopes.has("offline_access") || code.scopes.has("openid") || code.scopes.has("token"))
        );
    },
    cookies: {
        keys: ["secrelavqldsbNDMKQsbdlt_key", "qdfsfbqslkbAnotherKeyFTYUJH"],
        long: {
            httpOnly: true,
            overwrite: true,
            signed: true,
            //   secure: process.env.APP_ENV !== "local",
            sameSite: "none",
            //   path: process.env.OP_PATH,
        },
        short: {
            httpOnly: true,
            overwrite: true,
            signed: true,
            //   secure: process.env.APP_ENV !== "local",
            sameSite: "none",
            //   path: process.env.OP_PATH,
        },
    },
    claims: {
        // address: ["address"],
        email: ["email", "email_verified"],
        userid: ["id"],
        // phone: ["phone_number", "phone_number_verified"],
        // profile: [
        //   "birthdate",
        //   "family_name",
        //   "gender",
        //   "given_name",
        //   "locale",
        //   "middle_name",
        //   "name",
        //   "nickname",
        //   "picture",
        //   "preferred_username",
        //   "profile",
        //   "updated_at",
        //   "website",
        //   "zoneinfo",
        // ],
    },
    formats: {
        AccessToken: "jwt",
    },
    //   async loadExistingGrant(ctx) {
    //     console.log("LOADING EXISTING GRANT");
    //     const grantId =
    //       (ctx.oidc.result &&
    //         ctx.oidc.result.consent &&
    //         ctx.oidc.result.consent.grantId) ||
    //       ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId);

    //     console.log("isset grantId : [", grantId, "]");
    //     if (grantId) {
    //       return ctx.oidc.provider.Grant.find(grantId);
    //     }

    //     const grant = new ctx.oidc.provider.Grant({
    //       clientId: ctx.oidc.client.clientId,
    //       accountId: ctx.oidc.session?.accountId,
    //     });

    //     const scopes = ctx.oidc.params.scope.split(" ");

    //     for (let scope of scopes) {
    //       // TODO: Confirm if this is correct
    //       grant.addOIDCScope(scope);
    //     }

    //     // TODO: Use ttl.Grant
    //     await grant.save(3600);

    //     return grant;
    //   },
    pkce: { required: () => true, methods: ["S256"] },
    jwks: {
        keys: [
            {
                d: "VEZOsY07JTFzGTqv6cC2Y32vsfChind2I_TTuvV225_-0zrSej3XLRg8iE_u0-3GSgiGi4WImmTwmEgLo4Qp3uEcxCYbt4NMJC7fwT2i3dfRZjtZ4yJwFl0SIj8TgfQ8ptwZbFZUlcHGXZIr4nL8GXyQT0CK8wy4COfmymHrrUoyfZA154ql_OsoiupSUCRcKVvZj2JHL2KILsq_sh_l7g2dqAN8D7jYfJ58MkqlknBMa2-zi5I0-1JUOwztVNml_zGrp27UbEU60RqV3GHjoqwI6m01U7K0a8Q_SQAKYGqgepbAYOA-P4_TLl5KC4-WWBZu_rVfwgSENwWNEhw8oQ",
                dp: "E1Y-SN4bQqX7kP-bNgZ_gEv-pixJ5F_EGocHKfS56jtzRqQdTurrk4jIVpI-ZITA88lWAHxjD-OaoJUh9Jupd_lwD5Si80PyVxOMI2xaGQiF0lbKJfD38Sh8frRpgelZVaK_gm834B6SLfxKdNsP04DsJqGKktODF_fZeaGFPH0",
                dq: "F90JPxevQYOlAgEH0TUt1-3_hyxY6cfPRU2HQBaahyWrtCWpaOzenKZnvGFZdg-BuLVKjCchq3G_70OLE-XDP_ol0UTJmDTT-WyuJQdEMpt_WFF9yJGoeIu8yohfeLatU-67ukjghJ0s9CBzNE_LrGEV6Cup3FXywpSYZAV3iqc",
                e: "AQAB",
                kty: "RSA",
                n: "xwQ72P9z9OYshiQ-ntDYaPnnfwG6u9JAdLMZ5o0dmjlcyrvwQRdoFIKPnO65Q8mh6F_LDSxjxa2Yzo_wdjhbPZLjfUJXgCzm54cClXzT5twzo7lzoAfaJlkTsoZc2HFWqmcri0BuzmTFLZx2Q7wYBm0pXHmQKF0V-C1O6NWfd4mfBhbM-I1tHYSpAMgarSm22WDMDx-WWI7TEzy2QhaBVaENW9BKaKkJklocAZCxk18WhR0fckIGiWiSM5FcU1PY2jfGsTmX505Ub7P5Dz75Ygqrutd5tFrcqyPAtPTFDk8X1InxkkUwpP3nFU5o50DGhwQolGYKPGtQ-ZtmbOfcWQ",
                p: "5wC6nY6Ev5FqcLPCqn9fC6R9KUuBej6NaAVOKW7GXiOJAq2WrileGKfMc9kIny20zW3uWkRLm-O-3Yzze1zFpxmqvsvCxZ5ERVZ6leiNXSu3tez71ZZwp0O9gys4knjrI-9w46l_vFuRtjL6XEeFfHEZFaNJpz-lcnb3w0okrbM",
                q: "3I1qeEDslZFB8iNfpKAdWtz_Wzm6-jayT_V6aIvhvMj5mnU-Xpj75zLPQSGa9wunMlOoZW9w1wDO1FVuDhwzeOJaTm-Ds0MezeC4U6nVGyyDHb4CUA3ml2tzt4yLrqGYMT7XbADSvuWYADHw79OFjEi4T3s3tJymhaBvy1ulv8M",
                qi: "wSbXte9PcPtr788e713KHQ4waE26CzoXx-JNOgN0iqJMN6C4_XJEX-cSvCZDf4rh7xpXN6SGLVd5ibIyDJi7bbi5EQ5AXjazPbLBjRthcGXsIuZ3AtQyR0CEWNSdM7EyM5TRdyZQ9kftfz9nI03guW3iKKASETqX2vh0Z8XRjyU",
                use: "sig",
            },
            {
                crv: "P-256",
                d: "K9xfPv773dZR22TVUB80xouzdF7qCg5cWjPjkHyv7Ws",
                kty: "EC",
                use: "sig",
                x: "FWZ9rSkLt6Dx9E3pxLybhdM6xgR5obGsj5_pqmnz5J4",
                y: "_n8G69C-A2Xl4xUW2lF0i8ZGZnk_KPYrhv4GbTGu5G4",
            },
        ],
    },
    ttl: {
        AccessToken: 24 * 60 * 60,
        AuthorizationCode: 60 * 60,
        ClientCredentials: 60,
        DeviceCode: 60,
        IdToken: 24 * 60 * 60,
        RefreshToken: 12 * 24 * 60 * 60,
    },
};
