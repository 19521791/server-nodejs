const detectImage = require('../service/ninedash/detect.service');
const renderBox = require('../service/ninedash/render-img.service');
const fs = require('fs');

const classThreshold = 0.2;

const execImage = async (imagePath, model) => {
    const predictions = await detectImage(imagePath, model);
    const img = fs.readFileSync(imagePath);
    if (predictions) {
        const [xmin, ymin, width, height] = predictions.bbox;
        const score = predictions.score;
        const predictedClass = predictions.class;
        const [xRatio, yRatio] = [1, 1];
        const canvas = await renderBox(img, classThreshold, [xmin, ymin, width, height], [score], [predictedClass], [xRatio, yRatio],)
        
        const tempImage = canvas.toString("base64");
        const final = `data:image/jpeg;base64, ${tempImage}`;
        
        return { predictions: predictions, img: final };
        
    } else {
        return { predictions: null, img: null };
    }
};

module.exports = execImage;
