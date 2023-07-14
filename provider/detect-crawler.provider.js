const leakyDetect = require('../service/ninedash/leaky-detect.service');
const renderBox = require("../service/ninedash/render-img.service");

const CLASS_THRESHOLD = 0.2;

const execImage = async (image, model) => {
    const img = image.toString("base64");
    const predictions = await leakyDetect(image, model);
    if (predictions.class === 1) {
        const [xmin, ymin, width, height] = predictions.bbox;
        const score = predictions.score;
        const predictedClass = predictions.class;
        const [xRatio, yRatio] = [1, 1];
        const imgRender = await renderBox(
            image,
            CLASS_THRESHOLD,
            [xmin, ymin, width, height],
            [score],
            [predictedClass],
            [xRatio, yRatio],
        );
        const tempImage = imgRender.toString("base64");

        return { predictions: predictions, img: tempImage };
    } else {
        return { predictions: [], img: img };
    }
};

module.exports = execImage;