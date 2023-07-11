const path = require("path");
const detectImage = require("../service/ninedash/detect.service");
const detectImage_handleimg = require("../service/ninedash/detect_handleimg.service");

const renderBox = require("../service/ninedash/render-img.service");
const extract_img_URL = require("../service/ninedash/extract_img_URL.service")
const fs = require("fs");
const extractFrame = require("../service/ninedash/extract-frame.service");
const generateVideo = require("../service/ninedash/render-video.service");
const { getRabbitMQConnection } = require('../config/rabbit-mq.config');
const { getMessageFromQueue } = require('../provider/ready-for-rabbit.provider');
const axios = require('axios');


const execImage = require('../provider/process-image.provider');

const uploadImage = async (req, res) => {
    console.time('post');
    if (!req.files) {
        res.status(400).send("No files uploaded.");
    } else {
        try {
            const rabbitMQConnection = getRabbitMQConnection();

            const fileNames = req.files.map((file) => file.filename);

            fileNames.forEach(async (filename) => {
              console.log("path=" + filename)
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
    const model = global.modeler;
    const finalImages = [];
    const allPredictions = [];
    try {
        const messages = await getMessageFromQueue("imageQueue");

        if (messages.length === 0) {

            res.render("displayImage.ejs", {
                predictions: allPredictions,
                finalImages: finalImages,
            });
        } else {

        await Promise.all(
            messages.map(async (message) => {

            const { filename } = message;

            const imagePath = path.join(__dirname, '..', 'uploads', filename);

            const result = await execImage(imagePath, model);

            finalImages.push(result.img);
            allPredictions.push(result.predictions);
            })
        );

        res.render("displayImage.ejs", {
            predictions: allPredictions,
            finalImages: finalImages,
          path: "/nine-dash"
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

const extract_img_from_web = async (req, res) => {
    console.time('post');
    const url = req.body.url_input;
    if (!url) {
        res.status(400).send("No url");
    } else {
        console.log("Success scan url!");
        console.log(url);
        const list_img_url = await extract_img_URL(url);

        if (!list_img_url) {
            console.log("Success scan url!");
        }
        else {
            try {
                const rabbitMQConnection = getRabbitMQConnection();
                list_img_url.forEach(async (img_url) => {
                    if(rabbitMQConnection && !img_url.endsWith('.webp')){
                      console.log(img_url)
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
          // fs.writeFileSync('image.jpg', handleImage);
          // console.log('Hình ảnh đã được tải về và lưu vào biến handleImage');
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
