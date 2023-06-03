const mongoose = require("mongoose");

async function connectDB() {
    try {
        mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        mongoose.connection.once("open", () => {
            console.log("Connected to MongoDB");
        });
    } catch (err) {
        console.error(`Connect failure: ${err}`);
    }
}

module.exports = connectDB;
