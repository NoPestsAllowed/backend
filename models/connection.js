const mongoose = require("mongoose");
const connectionString = process.env.DB_CONNECTION_STRING;
mongoose.set("strictQuery", true);

mongoose
    .connect(connectionString, { connectTimeoutMS: 2000 })
    .then(() => console.log("Successfully connected to the NoPestsAllowed Database 🪳🪳 🪳  🪳   🪳  !"))
    .catch((errorMessage) => console.error(errorMessage));
