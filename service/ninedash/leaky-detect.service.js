const fs = require("fs");
const preprocess = require("./preprocess.service");
const tf = require("@tensorflow/tfjs-node");

const detectImage = async (img, model) => {
    const predictions = [];
    const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
    const [input] = await preprocess(img, modelWidth, modelHeight);
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