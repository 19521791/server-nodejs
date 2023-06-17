const path = require("path");
const loadModel = require("../service/ninedash/loadModel");
const detectImage = require("../service/ninedash/detect");
const renderBox = require("../service/ninedash/renderBox");
const fs = require("fs");
const Image = require("../model/image");
const extractFrame = require("../service/ninedash/extractFrame");
const generateVideo = require("../service/ninedash/generateVideo");
// const { predictions, render, frames } = require("../middleware/progressBar");

const classThreshold = 0.2;

const uploadImage = async (req, res) => {
    if (!req.files) {
        res.status(400).send("No files uploaded.");
    } else {
        console.log("Success upload image!");

        const fileNames = req.files.map((file) => file.filename);

        try {
            const savedImage = await Promise.all(
                fileNames.map((filename) => {
                    const image = new Image({ image: filename });
                    return image.save();
                }),
            );

            console.log("Saved images: ", savedImage);
        } catch (err) {
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
            const imagePath = path.join(__dirname, "..", "uploads", imageName);
            const predictions = await detectImage(imagePath, model);

            imageNamesToDelete.push(imageName);

            return predictions;
        });
        const allPredictions = await Promise.all(predictionsPromises);

        const finalImagesPromises = allPredictions.map(
            async (predictions, index) => {
                const firstPrediction = predictions[0];
                const handleImage = firstPrediction
                    ? firstPrediction.buffer
                    : null;

                const outputPath = path.join(
                    __dirname,
                    "..",
                    "outputs",
                    imageNames[index].image,
                );

                if (firstPrediction) {
                    const [xmin, ymin, width, height] = firstPrediction.bbox;
                    const score = firstPrediction.score[0];
                    const predictedClass = firstPrediction.class[0];
                    const [xRatio, yRatio] = firstPrediction.ratio;

                    console.log(
                        "Coordinate bboxes: ",
                        xmin,
                        ymin,
                        width,
                        height,
                    );
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
                            tempImage = buffer.toString("base64");

                            return `data:image/jpeg;base64, ${tempImage}`;
                        })
                        .catch((error) => {
                            console.log("Error: ", error);
                        });
                } else {
                    return null;
                }
            },
        );

        const finalImages = await Promise.all(finalImagesPromises);

        await Image.deleteMany({ image: { $in: imageNamesToDelete } });

        res.render("displayImage.ejs", {
            predictions: allPredictions,
            finalImages,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error detecting objects in image.");
    }
};

const uploadVideo = async (req, res) => {
    if (!req.file) {
        res.status(400).send("No video uploaded!");
    } else {
        console.log("Success upload video");
        const videoUrl = "/render-video/" + req.file.filename;
        res.redirect(videoUrl);
    }
};

const renderVideo = async (req, res) => {
    const model = await loadModel();

    // let processPredictions = 0;
    // let processRender = 0;
    // let processFrames = 0;

    try {
        const videoPath = path.join(
            __dirname,
            "..",
            "uploadVideos",
            req.params.filename,
        );
        const destPath = path.join(__dirname, "..", "FRAMES");
        const outputPredictFrame = path.join(__dirname, "..", "DETECTS");

        await extractFrame(videoPath, destPath);

        try {
            const framePaths = await new Promise((resolve, reject) => {
                fs.readdir(destPath, (err, files) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const paths = files.map((file) =>
                        path.join(destPath, file),
                    );
                    resolve(paths);
                });
            });
            // const totalFrames = framePaths.length;
            // const progressPredictions = predictions(totalFrames);
            // const progressRender = render(totalFrames);
            // const progressFrames = frames(totalFrames);

            const frameNames = fs.readdirSync(destPath);

            // progressPredictions.start();
            const predictionsPromises = framePaths.map(async (file) => {
                const predictions = await detectImage(file, model);

                // processPredictions++;
                // progressPredictions.update(processPredictions);

                return predictions;
            });

            const allPredictions = await Promise.all(predictionsPromises);
            // progressPredictions.stop();

            // progressRender.start();
            // progressFrames.start();
            const finalImagesPromises = allPredictions.map(
                async (prediction, index) => {
                    const firstPrediction = prediction[0];
                    const handleImage = firstPrediction
                        ? firstPrediction.buffer
                        : null;

                    const outputPath = path.join(
                        __dirname,
                        "..",
                        "DETECTS",
                        frameNames[index],
                    );

                    if (firstPrediction) {
                        const [xmin, ymin, width, height] =
                            firstPrediction.bbox;
                        const score = firstPrediction.score[0];
                        const predictedClass = firstPrediction.class[0];
                        const [xRatio, yRatio] = firstPrediction.ratio;

                        // processRender++;
                        // progressRender.update(processRender);

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
                                tempImage = buffer.toString("base64");

                                // processFrames++;
                                // progressFrames.update(processFrames);

                                return `data:image/jpeg;base64, ${tempImage}`;
                            })
                            .catch((error) => {
                                console.log("Error: ", error);
                            });
                    } else {
                        return null;
                    }
                },
            );

            const finalImages = await Promise.all(finalImagesPromises);
            // progressRender.stop();
            // progressFrames.stop();

            const outputVideoPath = path.join(
                __dirname,
                "..",
                "outputVideos",
                req.params.filename,
            );

            const fps = 30;

            await generateVideo(fps, outputPredictFrame, outputVideoPath);
        } catch (err) {
            console.error("Error in here:", err);
        }

        res.send("My name is Long");
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    uploadImage,
    getImage,
    uploadVideo,
    renderVideo,
};
