const fs = require("fs");
const preprocess = require("./preprocess.service");
const tf = require("@tensorflow/tfjs-node");

const calculateTensorSize = (tensor) => {
    const shape = tensor.shape;
    const dataTypeSize = Float32Array.BYTES_PER_ELEMENT;
  
    const dataSize = shape.reduce((acc, dim) => acc * dim, 1) * dataTypeSize;
  
    return dataSize;
  }

const detectImage = async (imgSource, model) => {
    const predictions = [];
    const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
    const buffer = fs.readFileSync(imgSource);
    const [input] = await preprocess(
        buffer,
        modelWidth,
        modelHeight,
    );
    const [boxes, scores, classes] = await model.executeAsync(input);
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();
    predictions.push({
        bbox: boxesData.slice(0, 4),
        score: scoresData[0],
        class: classesData[0],
    });
    tf.dispose([boxes, scores, classes, input]);
    return predictions[0];
};

module.exports = detectImage;
