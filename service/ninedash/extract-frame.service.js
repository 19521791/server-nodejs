const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const processVideoFrames = async (videoPath, frameDir) => {
    return new Promise((resolve, reject) => {
        console.time("extractFrame");
        ffmpeg(videoPath)
            .output(`${frameDir}/frame-%d.png`)
            .on("end", () => {
                resolve(frameDir);
            })
            .on("error", (err) => {
                reject(err);
            })
            .run();
        console.timeEnd("extractFrame");
    });
};

module.exports = processVideoFrames;
