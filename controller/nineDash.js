const path = require("path");
const loadModel = require("../service/ninedash/loadModel");
const detectImage = require("../service/ninedash/detect");
const renderBox = require("../service/ninedash/renderBox");
const fs = require("fs");
const Image = require('../model/image');

const classThreshold = 0.2;

const uploadImage = async (req, res) => {
    if (!req.files) {
        res.status(400).send("No files uploaded.");
    } else {
        console.log("Success upload image!");

        const fileNames = req.files.map((file) => file.filename);
        
        try{
            const savedImage = await Promise.all(
                fileNames.map((filename) => {
                    const image = new Image({ image: filename});
                    return image.save();
                })
            )

            console.log("Saved images: ", savedImage);
        } catch(err) {
            console.log(err);
        }

        res.redirect(`/nine-dash`);
    }
    // res.send('Long dep trai');
};

const getImage = async (req, res) => {
    const model = await loadModel();
    
    try {
        const imageNames = await Image.find({}).select("image");

        const imageNamesToDelete = [];

        const predictionsPromises = imageNames.map(async (image) => {
            const imageName = image.image;
            const imagePath = path.join(__dirname, '..', 'uploads', imageName);
            const predictions = await detectImage(imagePath, model);

            imageNamesToDelete.push(imageName);

            return predictions;
        })
        const allPredictions = await Promise.all(predictionsPromises);

        const finalImagesPromises = allPredictions.map(async (predictions, index) => {
            const firstPrediction = predictions[0];
            const handleImage = firstPrediction ? firstPrediction.buffer : null;

            const outputPath = path.join(__dirname, "..", "outputs", imageNames[index].image);

            if(firstPrediction){
                const [xmin, ymin, width, height] = firstPrediction.bbox;
                const score = firstPrediction.score[0];
                const predictedClass = firstPrediction.class[0];
                const [xRatio, yRatio] = firstPrediction.ratio;

                console.log("Coordinate bboxes: ", xmin, ymin, width, height);
                console.log("Confident: ", score);
                console.log("Class: ", predictedClass);

                return renderBox(
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

                        
                        return `data:image/jpeg;base64, ${tempImage}`;
                    })
                    .catch((error) => {
                        console.log("Error: ", error);
                    });
            } else {
                return null;
            }
        });

        const finalImages = await Promise.all(finalImagesPromises);

        await Image.deleteMany({image: {$in: imageNamesToDelete}});

        res.render('upload.ejs', {predictions: allPredictions, finalImages});
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Error detecting objects in image.");
    }
};

module.exports = {
    uploadImage,
    getImage,
};
