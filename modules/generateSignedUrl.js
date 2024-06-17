// import { createHash } from "crypto";
const { createHash } = require("crypto");
const { querystring } = require("querystring");
const { URLSearchParams } = require("url");

class SignedUrl {
    secret = process.env.ACCESS_TOKEN_SECRET;
    signatureKey = "signature";
    expireKey = "expire";
    hash;
    ttl;
    constructor(options = {}) {
        const { hash = "sha256", ttl = 0 } = options;
        this.ttl = ttl;
        if (typeof hash === "string") {
            this.hash = (input, secret) => createHash(hash).update(input).update(secret).digest("hex");
        } else {
            this.hash = hash;
        }
    }

    sign(url, signatureOptions = {}) {
        const data = {};
        if (signatureOptions.ttl) {
            data[this.expireKey] = Date.now() + signatureOptions.ttl * 1000;
        } else if (this.ttl) {
            data[this.expireKey] = Date.now() + this.ttl * 1000;
        }

        if (signatureOptions.params) {
            for (const param in signatureOptions.params) {
                if (Object.hasOwnProperty.call(signatureOptions.params, param)) {
                    data[param] = signatureOptions.params[param];
                }
            }
        }

        const prefixSign = url.indexOf("?") == -1 ? "?" : "&";

        if (Object.keys(data).length) {
            url += `${prefixSign}${new URLSearchParams(data).toString()}`;
            url += `&${this.signatureKey}=${this.hash(url, this.secret)}`;
        } else {
            url += `${prefixSign}${this.signatureKey}=${this.hash(url, this.secret)}`;
        }

        return url;
    }

    extractParams(string) {
        return new URLSearchParams(string.split("?")[1]);
    }

    extractSignature(string) {
        let pos = string.lastIndexOf(this.signatureKey);

        if (pos === -1) {
            throw new Error("No signature provided");
        }

        return [string.substr(0, pos - 1), string.substr(pos + this.signatureKey.length + 1)];
    }

    expireAt(string) {
        const params = this.extractParams(string);

        if (!params.has(this.expireKey)) {
            return Infinity;
        }

        return params.get(this.expireKey);
    }

    verify(url) {
        console.log("verifying : ", url);
        const [baseUrl, signature] = this.extractSignature(url);
        const expire = this.expireAt(baseUrl);
        console.log(Date.now(), expire, Date.now() - expire);
        if (expire < Date.now()) {
            // throw new Error("Route has expired", url);
            return false;
        }

        return signature === this.hash(baseUrl, this.secret);
    }
}

module.exports = { SignedUrl };
