const tf = require("@tensorflow/tfjs-node");
const sharp = require('sharp');

const preprocess = async (source, modelWidth, modelHeight) => {
    const input = tf.tidy(() => {
        const img = tf.node.decodeImage(source, 3);
        const resizedImg = tf.image.resizeBilinear(img, [
            modelWidth,
            modelHeight,
        ]);
        const normalizedImg = resizedImg.div(255.0);
        const expandedImg = normalizedImg.expandDims();
        return expandedImg;
    });
    return [input];
};

module.exports = preprocess;
