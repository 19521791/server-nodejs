const bodyParser = require("body-parser");
const { uploadImage, getImage, crawlImage, getCrawlImage } = require("../controller/nine-dash.controller");
const express = require("express");
const router = express.Router();
const upload = require("../middleware/storage");

router.use(bodyParser.urlencoded({ extended: true }));

router.post("/detect", upload, uploadImage);

router.get("/nine-dash", getImage);

router.post("/url", crawlImage)

router.get("/nine-dash-url", getCrawlImage);

module.exports = router;
