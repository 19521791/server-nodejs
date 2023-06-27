const express = require("express");
const router = express.Router();
const upload = require("../middleware/storage-video");
const { uploadVideo, renderVideo } = require("../controller/nine-dash.controller");

router.get("/video", (req, res) => {
    res.render("formVideo.ejs");
});

router.post("/detect-video", upload, uploadVideo);

router.get("/video/:filename", renderVideo);

module.exports = router;
