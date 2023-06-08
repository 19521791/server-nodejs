const { uploadImage, getImage } = require("../controller/nineDash");
const express = require("express");
const router = express.Router();
const upload = require("../middleware/storage");

router.post("/detect", upload, uploadImage);

router.get("/nine-dash", getImage);

module.exports = router;
