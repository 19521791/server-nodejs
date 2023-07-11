const fs = require("fs");
const path = require("path");

const framesDir = "/home/long1100/server/tiny";

const deleteFrames = (framesDir) => {
    fs.readdir(framesDir, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(framesDir, file);

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${filePath}`);
                } else {
                    console.log(`File deleted: ${filePath}`);
                }
            });
        });
    });
};

deleteFrames(framesDir);
