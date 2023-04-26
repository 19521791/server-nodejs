const fs = require("fs");
const sharp = require("sharp");
const preprocess = require("./preprocess");
const tf = require("@tensorflow/tfjs-node");

const detectImage = async (imgSource, model, classThreshold) => {
    const predictions = [];
    const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);
    // console.log("=======",modelWidth, modelHeight);
    const buffer = fs.readFileSync(imgSource);
    const imageData = buffer.toString('base64');
    const src = `data:image/jpeg;base64,${imageData}`;
    const source = sharp(buffer);
    const [input, xRatio, yRatio] = await preprocess(source, modelWidth, modelHeight);
  
    const [boxes, scores, classes] = await model.executeAsync(input);
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();
    
    tf.dispose([boxes, scores, classes, input]);
  
    
  
    for (let i = 0; i < boxesData.length; i += 4) {
      const ymin = boxesData[i] * yRatio;
      const xmin = boxesData[i + 1] * xRatio;
      const ymax = boxesData[i + 2] * yRatio;
      const xmax = boxesData[i + 3] * xRatio;
      const score = scoresData[i / 4];
  
      if (score > classThreshold) {
        predictions.push({ bbox: [xmin, ymin, xmax - xmin, ymax - ymin], score, class: classesData[i / 4], src });
      }
      else {
        predictions.push({ bbox: [], score, class: [], src});
      }
    }
  
    return predictions;
  };

module.exports = detectImage;