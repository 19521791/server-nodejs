const detectImage = require('../service/ninedash/detect.service');

const model = global.modeler;
const processImageWorker = async (imagePath) => {
    const predictions = await detectImage(imagePath, model);
    console.log('WORKER RUNs');
    if (predictions) {
        const [xmin, ymin, width, height] = predictions.bbox;
        const score = predictions.score;
        const predictedClass = predictions.class;
        const [xRatio, yRatio] = predictions.ratio;

        console.log(`${imagePath}: Done!`);

        return { predictions };
    } else {
        return { predictions: null };
    }
};

module.exports = processImageWorker;
