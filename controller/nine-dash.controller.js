const path = require("path");
// const detectImage = require("../service/ninedash/detect.service");
const detectImage_handleimg = require("../service/ninedash/detect_handleimg.service");

const renderBox = require("../service/ninedash/render-img.service");
const extract_img_URL = require("../service/ninedash/extract_img_URL.service")
const fs = require("fs");
const extractFrame = require("../service/ninedash/extract-frame.service");
const generateVideo = require("../service/ninedash/render-video.service");
const { getRabbitMQConnection } = require('../config/rabbit-mq.config');
const { getMessageFromQueue } = require('../provider/ready-for-rabbit.provider');
const axios = require('axios');
const compress = require('../service/ninedash/compress.service');
const compareFramesAndInfer = require('../provider/infer-video.provider');
const execImage = require('../provider/process-image.provider');



const COMPRESS_QUALITY = 50;
const MATCHED_THRESHOLD = 0.1;


const uploadImage = async (req, res) => {
    if (req.files) {
        try {
            const rabbitMQConnection = getRabbitMQConnection();

            const fileNames = req.files.map((file) => file.filename);

            const savedPath = path.join(__dirname, '..', 'tiny');

            fileNames.forEach(async (filename) => {

                const imagePath = path.join(__dirname, '..', 'uploads', filename);
                            
                compress(imagePath, savedPath, COMPRESS_QUALITY)
                .then(() => console.log('Done'))
                .catch(err => console.log(`Error in compressing: ${err}`));
                
            });

            fileNames.forEach(async (filename) => {
                if(rabbitMQConnection){
                    const channel = await rabbitMQConnection.createChannel();
                    await channel.assertQueue("imageQueue");
                    channel.sendToQueue(
                        "imageQueue",
                        Buffer.from(JSON.stringify({ filename })),
                    );
                    await channel.close();
                }
            });
            
        } catch (err) {
            console.log(err);
            res.render("404.ejs");
        }
        res.redirect(`/nine-dash`);
    }
};

const getImage = async (req, res) => {
    console.time('render-img');
    const model = global.modeler;
    const finalImages = [];
    const allPredictions = [];
    const progress = { total: 0, completed: 0 };
    const io = global._io;
    try {
        const messages = await getMessageFromQueue("imageQueue");
        const isValid = messages.length !== 0;
        progress.total = messages.length;
        if(isValid){
             await Promise.all(
                messages.map(async (message) => {
                    const { filename } = message;

                    const imagePath = path.join( __dirname, "..", "tiny", filename,);
                    const outputImg = path.join(__dirname, "..", "outputs", filename,);

                    const result = await execImage(imagePath, model);
                    fs.writeFileSync(outputImg, result.img);
                    
                    finalImages.push(`data:image/jpeg;base64, ${result.img}`);

                    allPredictions.push(result.predictions);
                    progress.completed++;

                    io.emit('progress', progress);
                }),
            );
            console.timeEnd('render-img');
            res.render("displayImage.ejs", {
                predictions: allPredictions,
                finalImages: finalImages,
                path: "/nine-dash-url"
            });
        } else {
            res.render("404.ejs");
        }
    } catch (error) {
        console.error(error);
        res.render("404.ejs");
    }
};

const uploadVideo = async (req, res) => {
    if (req.file) {
        console.log("Success upload video");
        const rabbitMQConnection = getRabbitMQConnection();

        const filename = req.file.filename;

        if (rabbitMQConnection) {
            const channel = await rabbitMQConnection.createChannel();
            await channel.assertQueue("videoQueue");
            channel.sendToQueue( "videoQueue", Buffer.from(JSON.stringify({ filename })),);
            await channel.close();
        } else {
            console.log("Error connecting RabbitMQ");
            res.render("404.ejs");
        }
        res.redirect("/render-video");
    } else {
        res.render("404.ejs");
    }
};

const renderVideo = async (req, res) => {
    const model = global.modeler;
    const message = await getMessageFromQueue("videoQueue");
    const { filename } = message[0];

    try {
        const videoPath = path.join(__dirname, "..", "uploadVideos", filename);
        const destPath = path.join(__dirname, "..", "FRAMES");
        const outputPredictFrame = path.join(__dirname, "..", "DETECTS");

        await extractFrame(videoPath, destPath);

        const frameNames = fs.readdirSync(destPath);

        await compareFramesAndInfer(
            destPath,
            MATCHED_THRESHOLD,
            frameNames,
            model,
            outputPredictFrame,
        );

        const outputVideoPath = path.join( __dirname, "..", "outputVideos", filename,);

        const fps = 30;

        await generateVideo(fps, outputPredictFrame, outputVideoPath);

        const video = fs.readFileSync(outputVideoPath);

        res.render("displayVideo.ejs", { video: video });
    } catch (err) {
        console.log(err);
    }
};

const extract_img_from_web = async (req, res) => {
    console.time('post');
    const url = req.body.url_input;
    if (!url) {
        res.status(400).send("No url");
    } else {
        console.log("Success scan url!");
        const list_img_url = await extract_img_URL(url);

        if (!list_img_url) {
            console.log("Success scan url!");
        }
        else {
            try {
                const rabbitMQConnection = getRabbitMQConnection();
                list_img_url.forEach(async (img_url) => {
                    if(rabbitMQConnection && !img_url.endsWith('.webp')){
                      const channel = await rabbitMQConnection.createChannel();
                      await channel.assertQueue("imageURLQueue");
                      channel.sendToQueue("imageURLQueue", Buffer.from(JSON.stringify({ img_url })));
                      await channel.close();
                    }
               });
            } catch (err) {
                console.log(err);
                res.status(500).send("Error saving image url");
            } 
        }
      
        console.timeEnd('post');
        res.redirect(`/nine-dash-url`);
    }
};

const getImage_URL = async (req, res) => {
  console.time('get');
  const model = global.modeler;
  const io = req.app.get('io');
  try {
    const messages = await getMessageFromQueue("imageURLQueue");
    let process = messages.length;
    if (messages.length === 0) {
      console.log("No messages available in the queue.");
      res.status(204).send("No images to process.");
    } else {
      const finalImages = [];
      const allPredictions = [];
      let handleImage;

      for (const message of messages) {
        const { img_url } = message;


        try {
          const response = await axios({
            url: img_url,
            responseType: 'arraybuffer'
          });
          handleImage = Buffer.from(response.data, 'binary');
          const predictions = await detectImage_handleimg(handleImage, model);
          if (predictions && predictions.class == 1) {
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
            // fs.writeFileSync(imagePath, buffer);
            const tempImage = buffer.toString("base64");
            finalImages.push(`data:image/jpeg;base64, ${tempImage}`);
            allPredictions.push(predictions);

          } else {
            // finalImages.push(null);
            // allPredictions.push(null);
          }
        } catch (error) {
          console.log(error);
          continue;
        }
      }
      console.timeEnd('get');
      res.render("displayImage.ejs", {
        predictions: allPredictions,
        finalImages: finalImages,
        path: "/nine-dash-url"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error detecting objects in images.");
  }
};

module.exports = {
    uploadImage,
    getImage,
    uploadVideo,
    renderVideo,
    extract_img_from_web,
    getImage_URL
};
