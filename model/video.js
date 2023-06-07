const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    video: String,
});

module.exports = mongoose.model('Video', videoSchema);