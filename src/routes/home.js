const express = require("express");
const router = express.Router();
const renderHome = require("../app/controllers/homeController");

router.get('/', renderHome);

module.exports = router;