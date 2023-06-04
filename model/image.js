const mongoose = require("mongoose");

const imageShema = new mongoose.Schema({
    image: String,
});

module.exports = mongoose.model("Image", imageShema);
