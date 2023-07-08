const { exec } = require("child_process");
const path = require("path");

const extractFrames = (videoPath) => {
    const command = `ffmpeg -i ${videoPath} ${path.join(
        __dirname,
        "mock-data",
        "frame-%d.png",
    )}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error extracting frames: ${error}`);
            return;
        }
        console.log("Frames extracted successfully!");
    });
};

const videoPath = "/home/long1100/server/uploadVideos/1686994599272_video3.mp4";

extractFrames(videoPath);
