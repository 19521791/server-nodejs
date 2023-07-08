const tf = require("@tensorflow/tfjs-node");

const preprocess = async (source, modelWidth, modelHeight) => {
    console.time("preprocess");
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

    console.timeEnd("preprocess");
    return [input];
};

module.exports = preprocess;
