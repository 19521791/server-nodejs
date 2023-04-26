const express = require("express");
const controller = require("../app/controllers/getController");

const router = express.Router();

router.use('/image/:filename', controller.getImage);

module.exports = router;