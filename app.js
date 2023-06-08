require("dotenv").config();
const express = require("express");
const parseReq = require("./config/parseRequest");
const routerhome = require("./route/home");
const routeNineDash = require("./route/nineDash");
const morgan = require("morgan");
const notfound = require("./route/404");
const viewEngine = require("./config/viewEngine");
const video = require("./route/nineDashVideo");

app = express();
app.use(viewEngine);
app.use(morgan("dev"));
app.use(parseReq);
app.use(routerhome);
app.use(video);
app.use(routeNineDash);
app.use(notfound);

module.exports = app;
