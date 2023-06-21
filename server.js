const app = require("./app");
const { connectToRabbitMQ } = require("./config/rabbit-mq.config");
const loadModel = require('./service/ninedash/loadModel');
const tf = require('@tensorflow/tfjs-node');

const { PORT } = process.env;

(async function() {
    await tf.ready();
    const model = await loadModel();
    global.modeler = model;
    connectToRabbitMQ();
    app.listen(PORT, () => console.log(`App are listening at ${PORT}`));
})();


