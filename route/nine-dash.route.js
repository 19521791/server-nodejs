const bodyParser = require("body-parser");
const { uploadImage, getImage, extract_img_from_web, getImage_URL } = require("../controller/nine-dash.controller");
const express = require("express");
const router = express.Router();
const upload = require("../middleware/storage");

router.use(bodyParser.urlencoded({ extended: true }));

router.post("/detect", upload, uploadImage);

router.get("/nine-dash", getImage);

router.post("/url", extract_img_from_web)

router.get("/nine-dash-url", getImage_URL);

module.exports = router;
