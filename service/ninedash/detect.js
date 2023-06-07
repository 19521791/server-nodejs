const fs = require("fs");
const sharp = require("sharp");
const preprocess = require("./preprocess");
const tf = require("@tensorflow/tfjs-node");

const detectImage = async (imgSource, model) => {
    const predictions = [];
    const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
    const buffer = fs.readFileSync(imgSource);
    // const source = sharp(buffer);
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
        bbox: boxesData,
        score: scoresData,
        class: classesData,
        buffer,
        ratio: [xRatio, yRatio],
    });
    tf.dispose([boxes, scores, classes, input]);

    return predictions;
};

module.exports = detectImage;
