const express = require("express");
const router = express.Router();
const upload = require('../middleware/storageForVideo');
const controller = require('../controller/nineDash');

router.get("/video", (req, res) => {
    res.render("formVideo.ejs");
});

router.post("/detect-video",upload, controller.uploadVideo);

router.get("/render-video/:filename", controller.renderVideo);

module.exports = router;