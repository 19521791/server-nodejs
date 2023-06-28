const path = require("path");
const detectImage = require("../service/ninedash/detect.service");
const renderBox = require("../service/ninedash/render-img.service");
const fs = require("fs");
const extractFrame = require("../service/ninedash/extract-frame.service");
const generateVideo = require("../service/ninedash/render-video.service");
const { getRabbitMQConnection } = require('../config/rabbit-mq.config');
const { getMessageFromQueue } = require('../provider/ready-for-rabbit');

const classThreshold = 0.2;

const uploadImage = async (req, res) => {
    console.time('post');
    if (!req.files) {
        res.status(400).send("No files uploaded.");
    } else {
        console.log("Success upload image!");
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
        } 
        console.timeEnd('post');
        res.redirect(`/nine-dash`);
    }
};

const getImage = async (req, res) => {
    console.time('get');
    const model = global.modeler;
    const io = req.app.get('io');
    try {
      const messages = await getMessageFromQueue("imageQueue");
      let process = messages.length;
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

          const handleImage = fs.readFileSync(imagePath);
  
          if (predictions) {
            const [xmin, ymin, width, height] = predictions.bbox;
            const score = predictions.score;
            const predictedClass = predictions.class;
            const [xRatio, yRatio] = predictions.ratio;
  
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
            fs.writeFileSync(imagePath, buffer);
            const tempImage = buffer.toString("base64");
            finalImages.push(`data:image/jpeg;base64, ${tempImage}`);
            // if(io){
            //     process --;
            //     console.log('IO is working');
            // io.emit('process', {process: 100});
            // } else{
            //     console.log('IO is not working');
            // }
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
    console.time('uploadVideo');
    if (!req.file) {
        res.status(400).send("No video uploaded!");
    } else {
        console.log("Success upload video");
        const videoUrl = "/video/" + req.file.filename;
        console.timeEnd('uploadVideo');
        res.redirect(videoUrl);
    }
};

const renderVideo = async (req, res) => {
    console.time('renderVideo');
    const model = global.modeler;
    try {
        const videoPath = path.join( __dirname, "..", "uploadVideos", req.params.filename,);
        const destPath = path.join(__dirname, "..", "FRAMES");
        const outputPredictFrame = path.join(__dirname, "..", "DETECTS");

        await extractFrame(videoPath, destPath);
 
        const framePaths = await new Promise((resolve, reject) => {
            console.time('getPath');
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
            console.timeEnd('getPath');
        });

        let progress = 0;
        
        const frameNames = fs.readdirSync(destPath);

        console.time('predict');

        const batchSize = 10; 
        const batches = [];
        const predictionsPromises = [];

        for (let i = 0; i < framePaths.length; i += batchSize) {
            const batch = framePaths.slice(i, i + batchSize);
            batches.push(batch);

            const predictionsPromise = Promise.all(batch.map(file => detectImage(file, model)));
            predictionsPromises.push(predictionsPromise);
        }

        const allPredictions = [];

        for (const predictionsPromise of predictionsPromises) {
            const predictions = await predictionsPromise;
            allPredictions.push(...predictions);
        }
        console.timeEnd('predict');

        console.time('finalPredict');
        const finalImagesPromises = allPredictions.map(
            async (prediction, index) => {
                const firstPrediction = prediction[0];
                const handleImage = firstPrediction  ? firstPrediction.buffer : null;

                const outputPath = path.join( __dirname,"..", "DETECTS",frameNames[index],);

                if (firstPrediction) {
                    const [xmin, ymin, width, height] = firstPrediction.bbox;
                    const score = firstPrediction.score[0];
                    const predictedClass = firstPrediction.class[0];
                    const [xRatio, yRatio] = firstPrediction.ratio;

                    return renderBox( handleImage, classThreshold, [xmin, ymin, width, height], [score], [predictedClass], [xRatio, yRatio],)
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
        console.timeEnd('finalPredict');
        
        const outputVideoPath = path.join( __dirname, "..", "outputVideos", req.params.filename,);

        const fps = 30;
        console.time('generate');
        await generateVideo(fps, outputPredictFrame, outputVideoPath);
        console.timeEnd('generate');
        // const outputVideoPath = path.join( __dirname, "..", "outputVideos", '1687435027351_video3.mp4');
        const video = fs.readFileSync(outputVideoPath);
        console.timeEnd('renderVideo');
        res.render('displayVideo.ejs', { video: video});
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
