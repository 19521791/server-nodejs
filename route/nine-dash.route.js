const bodyParser = require("body-parser");
const { uploadImage, getImage, extract_img_from_web } = require("../controller/nine-dash.controller");
const express = require("express");
const router = express.Router();
const upload = require("../middleware/storage");

router.use(bodyParser.urlencoded({ extended: true }));

router.post("/detect", upload, uploadImage);

router.post("/url", upload, extract_img_from_web)

router.get("/nine-dash", getImage);

module.exports = router;
