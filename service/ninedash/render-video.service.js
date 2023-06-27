const removeFiles = require("./remove-file.service");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const path = require("path");

const generateVideoFromFrames = async (fps, frameDir, outputPath) => {
    const frameDirectory = path.join(__dirname, "..", "..", "FRAMES");
    const detectDirectory = path.join(__dirname, "..", "..", "DETECTS");
    const ffmpegCommand = `ffmpeg -framerate ${fps} -i ${frameDir}/frame-%d.png -c:v libx264 -crf 23 -pix_fmt yuv420p ${outputPath}`;

    try {
        await exec(ffmpegCommand);
    } catch (err) {
        console.log("Error generating video: ", err);
        return;
    }

    await removeFiles(frameDirectory, detectDirectory);
};

module.exports = generateVideoFromFrames;
