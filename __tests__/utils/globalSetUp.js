const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async function globalSetup() {
    const instance = await MongoMemoryServer.create();
    const uri = instance.getUri();
    global.__MONGOINSTANCE = instance;
    process.env.MONGO_URI = uri.slice(0, uri.lastIndexOf("/"));

    // The following is to make sure the database is clean before an test starts
    const conn = await mongoose.connect(`${process.env.MONGO_URI}/npa_test_db`);
    await conn.connection.db.dropDatabase();
    await mongoose.disconnect();
};
