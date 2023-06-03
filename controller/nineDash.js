const path = require("path");
const loadModel = require("../service/ninedash/loadModel");
const detectImage = require("../service/ninedash/detect");
const renderBox = require("../service/ninedash/renderBox");
const fs = require("fs");

const classThreshold = 0.2;

const uploadImage = async (req, res) => {
    if (!req.file) {
        res.status(400).send("Hey, FUCX YOU!");
    } else {
        console.log("Success upload image!");
        const fileName = req.file.filename;
        console.log("TYPE: ", req.file);
        const imageUrl = "/nine-dash/" + fileName;
        console.log("EndPoint: ", imageUrl);
        res.redirect(imageUrl);
    }

    // res.send("Long dep trai");
};

const getImage = async (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, "..", "uploads", filename);
    const model = await loadModel();
    try {
        const predictions = await detectImage(imagePath, model, classThreshold);
        const firstPrediction = predictions[0];
        const handleImage = firstPrediction ? firstPrediction.buffer : null;
        const imageData = handleImage.toString("base64");
        const src = `data:image/jpeg;base64,${imageData}`;

        if (!firstPrediction) {
            res.render("upload.ejs", { predictions: [], src });
            return;
        }
        const [xmin, ymin, width, height] = firstPrediction.bbox;
        console.log("Coordinate bboxes: ", xmin, ymin, width, height);
        const score = firstPrediction.score[0];
        console.log("Confident: ", score);
        const predictedClass = firstPrediction.class[0];
        console.log("Class: ", predictedClass);
        const [xRatio, yRatio] = firstPrediction.ratio;
        const outputPath = path.join(__dirname, "..", "outputs", filename);
        renderBox(
            handleImage,
            classThreshold,
            [xmin, ymin, width, height],
            [score],
            [predictedClass],
            [xRatio, yRatio],
        )
            .then((canvas) => {
                const buffer = canvas.toBuffer("image/png");
                fs.writeFileSync(outputPath, buffer);
                console.log("Image saved: ", outputPath);
                tempImage = buffer.toString("base64");
                finalImage = `data:image/jpeg;base64, ${tempImage}`;
                res.render("upload.ejs", { predictions, finalImage });
            })
            .catch((error) => {
                console.log("Error: ", error);
            });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error detecting objects in image.");
    }
};

module.exports = {
    uploadImage,
    getImage,
};
