require("dotenv").config();
const express = require("express");
const parseReq = require("./config/request.config");
const routerhome = require("./route/home.route");
const routeNineDash = require("./route/nine-dash.route");
const morgan = require("morgan");
const notfound = require("./route/404");
const viewEngine = require("./config/engine.config");
const video = require("./route/nine-dash-video.route");
const cors = require("cors");
const compression = require("compression");

app = express();
app.use(
    compression({
        level: 9,
        threshold: 100,
    }),
);
app.use(cors());
app.use(viewEngine);
app.use(morgan("dev"));
app.use(parseReq);
app.use(routerhome);
app.use(video);
app.use(routeNineDash);
app.use(notfound);

module.exports = app;
