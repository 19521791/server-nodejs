const tf = require("@tensorflow/tfjs-node");
const path = require("path");

const modelPath = path.join(__dirname, "model", "model.json");

async function loadModel() {
    console.time("loadModel");
    const model = await tf.loadGraphModel(`file://${modelPath}`);
    const dummyInput = tf.ones(model.inputs[0].shape);
    const warmupResult = await model.executeAsync(dummyInput);
    tf.dispose(warmupResult);
    tf.dispose(dummyInput);
    console.log("Model loaded successfully");
    model.inputShape = model.inputs[0].shape;
    console.timeEnd("loadModel");
    return model;
}

module.exports = { loadModel };
