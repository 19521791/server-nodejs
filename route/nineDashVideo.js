const express = require("express");
const router = express.Router();
const upload = require("../middleware/storageForVideo");
const { uploadVideo, renderVideo } = require("../controller/nineDash");

router.get("/video", (req, res) => {
    res.render("formVideo.ejs");
});

router.post("/detect-video", upload, uploadVideo);

router.get("/render-video/:filename", renderVideo);

module.exports = router;
