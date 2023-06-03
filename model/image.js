const mongoose = require("mongoose");

const imageShema = new mongoose.Schema({
    image: String,
    required: true
});

module.exports = mongoose.model("Image", imageShema);
