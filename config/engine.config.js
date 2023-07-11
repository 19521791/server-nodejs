const path = require("path");

const viewEngine = (req, res, next) => {
    app.set("view engine", "ejs");
    app.set("views", path.resolve(__dirname, "..", "views"));
    next();
};

module.exports = viewEngine;
