const path = require("path");
const fs = require("fs");
const extractFrame = require("../service/ninedash/extract-frame.service");
const generateVideo = require("../service/ninedash/render-video.service");
const { getRabbitMQConnection } = require('../config/rabbit-mq.config');
const { getMessageFromQueue } = require('../provider/ready-for-rabbit.provider');
const axios = require('axios');
const compareFramesAndInfer = require('../provider/infer-video.provider');
const execImage = require('../provider/process-image.provider');
const ImageHunter = require('../service/ninedash/crawl-img.service');
const detectCrawler = require('../provider/detect-crawler.provider');


const MATCHED_THRESHOLD = 0.1;


const uploadImage = async (req, res) => {
    if (req.files) {
        try {
            const rabbitMQConnection = getRabbitMQConnection();

            const fileNames = req.files.map((file) => file.filename);
            let process = fileNames.length;

            fileNames.forEach(async (filename) => {
                if(rabbitMQConnection){
                    const channel = await rabbitMQConnection.createChannel();
                    await channel.assertQueue("imageQueue");
                    channel.sendToQueue(
                        "imageQueue",
                        Buffer.from(JSON.stringify({ filename })),
                    );
                    await channel.close();
                    process = process - 1;
                }
            });
            if(process === 0){
                await rabbitMQConnection.close();
            }
        } catch (err) {
            console.log(err);
            res.render("404.ejs");
        }
        res.redirect(`/nine-dash`);
    }
};

const getImage = async (req, res) => {
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

                    const imagePath = path.join( __dirname, "..", "uploads", filename,);
                   
                    const result = await execImage(imagePath, model);
                                        
                    finalImages.push(`data:image/jpeg;base64, ${result.img}`);

                    allPredictions.push(result.predictions);
                    progress.completed++;

                    io.emit('progress', progress);
                }),
            );
            res.render("displayImage.ejs", {
                predictions: allPredictions,
                finalImages: finalImages,
                path: "/nine-dash"
            });
        } else {
            res.render("404.ejs");
        }
        // res.json({key: "long"});
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
        let process = filename.length;
        if (rabbitMQConnection) {
            const channel = await rabbitMQConnection.createChannel();
            await channel.assertQueue("videoQueue");
            channel.sendToQueue( "videoQueue", Buffer.from(JSON.stringify({ filename })),);
            await channel.close();
            process = process - 1;
        } else {
            console.log("Error connecting RabbitMQ");
            res.render("404.ejs");
        }
        if(process === 0){
            await rabbitMQConnection.close();
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

const crawlImage = async (req, res) => {
    const url = req.body.url_input;
    if (url) {        
        const crawlImg = new ImageHunter(url);

        const lists = await crawlImg.Load();
        let process = lists.length;

        try{
            const rabbitMQConnection = getRabbitMQConnection();
            lists.forEach(async (link) => {
                if(rabbitMQConnection){
                    const channel = await rabbitMQConnection.createChannel();
                        await channel.assertQueue("linkQueue");
                        channel.sendToQueue(
                            "linkQueue",
                            Buffer.from(JSON.stringify({ link })),
                        );
                        await channel.close();
                        process = process - 1;
                }
            })
            if(process === 0){
                await rabbitMQConnection.close();
            }
        } catch(err){

        }
        res.redirect(`/nine-dash-url`);
        // res.json({lists});
    } else {
        res.render('404.ejs');
    }
};

axios.interceptors.request.use((config) => {
    return config;
  });
  
axios.interceptors.response.use((response) => {
return response;
});
  
  const getCrawlImage = async (req, res) => {
    const model = global.modeler;
    try {
      const messages = await getMessageFromQueue("linkQueue");
      const isValid = messages.length !== 0;
      if (isValid) {
        const finalImages = [];
        const allPredictions = [];
  
        const imgPromises = messages.map(async (message) => {
          const { link } = message;
  
          try {
            const response = await axios({
              url: link,
              responseType: 'arraybuffer'
            });
            const handleImage = Buffer.from(response.data, 'binary');
  
            const result = await detectCrawler(handleImage, model);
  
            finalImages.push(`data:image/jpeg;base64, ${result.img}`);
  
            allPredictions.push(result.predictions);
  
          } catch (error) {
            console.log(error);
          }
        });
  
        await Promise.all(imgPromises);
  
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
      res.status(500).send("Error detecting objects in images.");
    }
  };

module.exports = {
    uploadImage,
    getImage,
    uploadVideo,
    renderVideo,
    crawlImage,
    getCrawlImage
};
