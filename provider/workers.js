const { parentPort, workerData } = require('worker_threads');
const detectImage = require('../service/ninedash/detect');
const path = require('path');
const renderBox = require('../service/ninedash/renderBox');
const fs = require('fs');

const classThreshold = 0.2;

const processMessage = async ({ message, model }) => {
  const { filename } = message;
  const inputPath = path.join(__dirname, '..', 'uploads', filename);
  const outputPath = path.join(__dirname, '..', 'outputs', filename);
  const predictions = await detectImage(inputPath, model);
  const firstElPredictions = predictions[0];
  const imgArrPredictions = [];

  if(firstElPredictions){
    const [xmin, ymin, width, height] = firstElPredictions.bbox;
    const score = firstElPredictions.score[0];
    const predictedClass = firstElPredictions.class[0];
    const [xRatio, yRatio] = firstElPredictions.ratio;
    const img = fs.readFileSync(inputPath);
    const canvas = await renderBox(
      img,
      classThreshold,
      [xmin, ymin, width, height],
      [score],
      [predictedClass],
      [xRatio, yRatio],
    );

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    const tempImage = buffer.toString("base64");

    imgArrPredictions.push(`data:image/jpeg;base64, ${tempImage}`);
  } else {
    imgArrPredictions.push(null);
  }
  parentPort.postMessage(imgArrPredictions);
};
  
module.exports = processMessage;