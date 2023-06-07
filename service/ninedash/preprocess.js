const sharp = require("sharp");
const tf = require("@tensorflow/tfjs-node");
const { loadImage } = require("canvas");

const preprocess = async (source, modelWidth, modelHeight) => {
    let xRatio = 1,
        yRatio = 1;
    let imgWidth, imgHeight;
    // const imgBuffer = await source.toBuffer();
    const image = await loadImage(source);
    imgWidth = image.width;
    imgHeight = image.height;
    const sharpImg = await sharp(source)
        .ensureAlpha()
        .resize({
            width: modelWidth,
            height: modelHeight,
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();
    const input = tf.tidy(() => {
        const img = tf.node.decodeImage(sharpImg, 3);
        const [h, w] = img.shape.slice(0, 2);
        const maxSize = Math.max(w, h);
        const padW = (maxSize - w) / 2;
        const padH = (maxSize - h) / 2;
        const padding = [
            [Math.floor(padH), Math.ceil(padH)],
            [Math.floor(padW), Math.ceil(padW)],
            [0, 0],
        ];
        xRatio = maxSize / w;
        yRatio = maxSize / h;
        return tf
            .pad(img, padding)
            .resizeBilinear([modelWidth, modelHeight])
            .toFloat()
            .div(255.0)
            .expandDims(0);
    });

    return [input, xRatio, yRatio];
};

module.exports = preprocess;
