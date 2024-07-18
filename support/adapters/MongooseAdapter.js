import { BaseModel } from "../../models/BaseModel.js";
import User from "../../models/users.js";

export class MongooseAdapter {
    model;

    constructor(name) {
        this.model = name;
    }

    async upsert(id, payload, expiresIn) {
        // console.log("Upserting model:", this.model, "with id:", id);
        // `${this.model}-${id}`
        const exist = await BaseModel.findOne({ key: id });
        if (exist !== null) {
            console.log("Model exist");
        }
        try {
            await BaseModel.updateOne(
                { key: id, "payload.kind": this.model },
                { payload, expiresAt: new Date(Date.now() + expiresIn * 1000) },
                { upsert: true }
            );
        } catch (error) {
            console.error("Error in upsert:", error);
            throw new Error("Failed to upsert the model");
        }
    }

    async find(id) {
        console.log("Finding model:", this.model, "with id:", id);

        try {
            const doc = await BaseModel.findOne({
                key: id,
                "payload.kind": this.model,
            });
            console.debug("debuging baseModel retrieved", doc);
            if (doc?.payload && doc?.payload.kind === "Session") {
                const userExist = await User.findById(doc.payload.accountId);
                console.debug("userExist", userExist !== null);
                if (!userExist) {
                    return null;
                }
            }
            return doc?.payload || null;
        } catch (error) {
            console.error("Error in find:", error);
            throw new Error("Failed to find the model");
        }
    }

    async findByUserCode(userCode) {
        // console.log("Finding DeviceCode with userCode:", userCode);

        try {
            const doc = await BaseModel.findOne({
                "payload.kind": "DeviceCode",
                "payload.userCode": userCode,
            });
            return doc?.payload || null;
        } catch (error) {
            console.error("Error in findByUserCode:", error);
            throw new Error("Failed to find DeviceCode by userCode");
        }
    }

    async findByUid(uid) {
        console.log("Finding Session with uid:", uid);

        try {
            const doc = await BaseModel.findOne({
                "payload.kind": "Session",
                "payload.uid": uid,
            });
            return doc?.payload || null;
        } catch (error) {
            console.error("Error in findByUid:", error);
            throw new Error("Failed to find Session by uid");
        }
    }

    async consume(id) {
        console.log("Consuming model:", this.model, "with id:", id);

        try {
            await BaseModel.updateOne(
                {
                    key: id,
                    "payload.kind": this.model,
                },
                { consumed: Date.now() / 1000 }
            );
        } catch (error) {
            console.error("Error in consume:", error);
            throw new Error("Failed to consume the model");
        }
    }

    async destroy(id) {
        console.log("Destroying model:", this.model, "with id:", id);

        try {
            await BaseModel.deleteOne({
                key: id,
                "payload.kind": this.model,
            });
        } catch (error) {
            console.error("Error in destroy:", error);
            throw new Error("Failed to destroy the model");
        }
    }

    async revokeByGrantId(grantId) {
        console.log("Revoking by grantId:", grantId);

        try {
            await BaseModel.deleteMany({
                "payload.grantId": grantId,
            });
        } catch (error) {
            console.error("Error in revokeByGrantId:", error);
            throw new Error("Failed to revoke by grantId");
        }
    }
}
