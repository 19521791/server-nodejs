const fs = require("fs");
const path = require("path");

const removeFiles = async (frameDir, detectDir) => {
    const frameFiles = fs.readdirSync(frameDir);

    await Promise.all(
        frameFiles.map((file) => {
            fs.promises.unlink(path.join(frameDir, file));
        }),
    );

    const detectFiles = fs.readdirSync(detectDir);

    await Promise.all(
        detectFiles.map((file) => {
            fs.promises.unlink(path.join(detectDir, file));
        }),
    );

    console.log("Frame files and detected frame files removed.");
};

module.exports = removeFiles;
