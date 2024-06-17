const mongoose = require("mongoose");

beforeAll(async () => {
    // put your client connection code here, example with mongoose:
    await mongoose.disconnect();
    await mongoose.connect(process.env["DB_CONNECTION_STRING"]);
});

afterAll(async () => {
    // put your client disconnection code here, example with mongodb:
    await mongoose.disconnect();
});
