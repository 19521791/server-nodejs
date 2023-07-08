const fs = require("fs");
const path = require("path");

const folderPath = "/home/long1100/temp/test/mock-data";

const removeNonPngImages = (folderPath) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error(`Error reading folder: ${err}`);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            const fileExt = path.extname(file).toLowerCase();

            if (fs.statSync(filePath).isFile() && fileExt !== ".png") {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Error removing file: ${filePath}`);
                    } else {
                        console.log(`File removed: ${filePath}`);
                    }
                });
            }
        });
    });
};

removeNonPngImages(folderPath);
