const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async function globalTeardown() {
    const instance = global.__MONGOINSTANCE;
    await instance.stop();
};
