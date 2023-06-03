const loadModel = require("./service/ninedash/loadModel");
const tf = require("@tensorflow/tfjs-node");
const app = require("./app");
const connectDB = require("./config/db.config");

const { PORT } = process.env;

(async function () {
    await tf.ready();
    const model = await loadModel();
    connectDB();
    app.listen(PORT, () => console.log(`App are listening at ${PORT}`));
})();
