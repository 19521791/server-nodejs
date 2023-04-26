const path = require("path");
const loadModel = require("../../yolov5/loadModel");
const detectImage = require("../../yolov5/detect");

const classThreshold = 0.2;

module.exports = {
    getImage: async (req, res) => {
      const filename = req.params.filename;
      const imagePath = path.join(__dirname,'..','..', 'Images', filename);
      // console.log(`"image path: " ${imagePath}`);
      const model = await loadModel();
      try {
        const predictions = await detectImage(imagePath, model, classThreshold);
        const firstPrediction = predictions[0];
        const handleImage = firstPrediction.src;
        if (!firstPrediction) {
            res.render('display', { predictions: handleImage });
            return;
        }
        const [xmin, ymin, width, height] = firstPrediction.bbox;
        const score = firstPrediction.score;
        const predictedClass = firstPrediction.class;
        console.log("RESULTS: ");
        console.log("Coordinate: ", xmin, ymin, width, height);
        console.log("Score: ", score);
        console.log("Class: ", predictedClass);
        res.render('display', { predictions, handleImage });
      } catch (error) {
        console.error(error);
        res.status(500).send('Error detecting objects in image.');
      }
    }
  };
  