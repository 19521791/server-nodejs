const express = require("express");
// const morgan = require("morgan");
const handlebars  = require("express-handlebars");
const path = require("path");
const tf = require('@tensorflow/tfjs-node');
const getrouter = require("./routes/get")
const postrouter = require("./routes/post");
const loadModel = require("./yolov5/loadModel");
const homerouter = require("./routes/home");
const mongoose = require("mongoose");
const connectDB = require("./app/config/dbConnect");

const app = express();
const PORT = process.env.PORT || 3500;
connectDB();
// app.use(morgan('combined'));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.engine('hbs', handlebars.engine({
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(getrouter);
app.use(postrouter);
app.use(homerouter);
   
mongoose.connection.once("open", () => {
    (async function() {
        await tf.ready();
        const model = await loadModel();
      })();
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`App are listening at ${PORT}`));
  });

 
