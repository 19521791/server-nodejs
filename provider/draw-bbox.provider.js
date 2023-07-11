const renderBox = require("../service/ninedash/render-img.service");
const preprocess = require("../service/ninedash/preprocess.service");
const fs = require("fs");

const CLASS_THRESHOLD = 0.2;

const draw = async (predictions, img_) => {
    const img = fs.readFileSync(img_);
    const tempImg = img.toString("base64");
    if (predictions.class === 1) {
        const [xmin, ymin, width, height] = predictions.bbox;
        const score = predictions.score;
        const predictedClass = predictions.class;
        const [xRatio, yRatio] = [1, 1];
        const imgRender = await renderBox(
            img,
            CLASS_THRESHOLD,
            [xmin, ymin, width, height],
            [score],
            [predictedClass],
            [xRatio, yRatio],
        );

        const tempImage = imgRender.toString("base64");

        return { predictions: predictions, img: tempImage };
    } else {
        return { predictions: null, img: tempImg };
    }
};

module.exports = draw;
