const express = require("express");
const path = require("path");

const viewEngine = (req, res, next) => {
    app.use(express.static(path.resolve(__dirname, "..", "public")));
    app.set("view engine", "ejs");
    app.set("views", path.resolve(__dirname, "..", "views"));
    next();
};

module.exports = viewEngine;
