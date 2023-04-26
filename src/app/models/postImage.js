const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postImage = new Schema({
    filename: {
        type: String,
        required: true
    },
    data: {
        type: Buffer,
        required: true
    }
});

module.exports = mongoose.model('postImage', postImage);