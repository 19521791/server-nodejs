const path = require("path");
const fs = require("fs");
const extractFrame = require("../service/ninedash/extract-frame.service");
const generateVideo = require("../service/ninedash/render-video.service");
const { getRabbitMQConnection } = require("../config/rabbit-mq.config");
const { getMessageFromQueue } = require("../provider/ready-for-rabbit.provider");
const execImage = require("../provider/process-image.provider");
const size = require('../provider/size.provider');
const compress = require('../service/ninedash/compress.service');
const compareFramesAndInfer = require('../provider/infer-video.provider');


const THRESHOLD_MATCHED = 0.1;
const COMPRESS_QUALITY = 50;

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
                if (rabbitMQConnection) {
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
            THRESHOLD_MATCHED,
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

module.exports = {
    uploadImage,
    getImage,
    uploadVideo,
    renderVideo,
};
