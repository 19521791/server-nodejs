const controller = require("../controller/nineDash");
const express = require("express");
const router = express.Router();
const upload = require("../middleware/storage");

router.post("/detect", upload, controller.uploadImage);

router.get("/nine-dash", controller.getImage);

module.exports = router;
