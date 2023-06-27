const fs = require("fs");
const preprocess = require("./preprocess.service");
const tf = require("@tensorflow/tfjs-node");

const detectImage = async (imgSource, model) => {
    console.time('detect');
    const predictions = [];
    const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
    const buffer = fs.readFileSync(imgSource);
    const [input, xRatio, yRatio] = await preprocess(
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
        ratio: [xRatio, yRatio],
    });
    tf.dispose([boxes, scores, classes, input]);
    console.timeEnd('detect');
    return predictions[0];
};

module.exports = detectImage;
