const path = require("path");
const detectImage = require("../service/ninedash/detect");
const renderBox = require("../service/ninedash/renderBox");
const fs = require("fs");
const extractFrame = require("../service/ninedash/extractFrame");
const generateVideo = require("../service/ninedash/generateVideo");
const { getRabbitMQConnection } = require("../config/rabbit-mq.config");
// const { predictions, render, frames } = require("../middleware/progressBar");

const classThreshold = 0.2;

const uploadImage = async (req, res) => {
    console.time('post');
    if (!req.files) {
        res.status(400).send("No files uploaded.");
    } else {
        console.log("Success upload image!");
        let rabbitMQConnection;
        try {
            const rabbitMQConnection = getRabbitMQConnection();

            const fileNames = req.files.map((file) => file.filename);

            fileNames.forEach(async (filename) => {

            if(rabbitMQConnection){
                const channel = await rabbitMQConnection.createChannel();
                await channel.assertQueue("imageQueue");
                channel.sendToQueue("imageQueue", Buffer.from(JSON.stringify({ filename })));
                await channel.close();
            }
           });
        } catch (err) {
            console.log(err);
            res.status(500).send("Error saving image names");
        } finally{
            if (rabbitMQConnection) {
                await rabbitMQConnection.close();
                console.log('Disconnected from RabbitMQ');
            }
        }
        console.timeEnd('post');
        res.redirect(`/nine-dash`);
    }
    // res.send('Long dep trai');
};

const getImage = async (req, res) => {
    console.time('get');
    const model = global.modeler;
  
    try {
      const rabbitMQConnection = getRabbitMQConnection();
      const channel = await rabbitMQConnection.createChannel();
  
      const messages = [];
  
      while (true) {
        const message = await channel.get("imageQueue");
        if (!message) {
          break; 
        }
        messages.push(JSON.parse(message.content.toString()));
        channel.ack(message);
      }
  
      if (messages.length === 0) {
        console.log("No messages available in the queue.");
        res.status(204).send("No images to process.");
      } else {
        const finalImages = [];
        const allPredictions = [];
  
        for (const message of messages) {
          const { filename } = message;
  
          const imagePath = path.join(__dirname, "..", "uploads", filename);
  
          const predictions = await detectImage(imagePath, model);
  
          const firstPrediction = predictions[0];
          const handleImage = firstPrediction ? firstPrediction.buffer : null;
  
          const outputPath = path.join(__dirname, "..", "outputs", filename);
  
          if (firstPrediction) {
            const [xmin, ymin, width, height] = firstPrediction.bbox;
            const score = firstPrediction.score[0];
            const predictedClass = firstPrediction.class[0];
            const [xRatio, yRatio] = firstPrediction.ratio;
  
            console.log("Coordinate bboxes: ", xmin, ymin, width, height);
            console.log("Confident: ", score);
            console.log("Class: ", predictedClass);
  
            const canvas = await renderBox(
              handleImage,
              classThreshold,
              [xmin, ymin, width, height],
              [score],
              [predictedClass],
              [xRatio, yRatio]
            );
  
            const buffer = canvas.toBuffer("image/png");
            fs.writeFileSync(outputPath, buffer);
            const tempImage = buffer.toString("base64");
  
            finalImages.push(`data:image/jpeg;base64, ${tempImage}`);
          } else {
            finalImages.push(null);
          }
  
          allPredictions.push(predictions);
        }
        console.timeEnd('get');
        res.render("displayImage.ejs", {
          predictions: allPredictions,
          finalImages: finalImages,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error detecting objects in images.");
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

        res.send("Long dep trai");
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
