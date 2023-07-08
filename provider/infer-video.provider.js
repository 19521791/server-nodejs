const fs = require("fs");
const drawBBox = require("./draw-bbox.provider");
const execImage = require("./process-image.provider");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

const compareFramesAndInfer = async (
    imageDir,
    threshold,
    imageFiles,
    model,
    outputPath,
) => {
    let previousImage = null;
    const concurrencyLimit = 10; // Set the desired concurrency level
    const promises = [];
    let result;
    for (const file of imageFiles) {
        const imagePath = `${imageDir}/${file}`;
        const savedPath = `${outputPath}/${file}`;
        const currentImage = await readImage(imagePath);

        if (previousImage) {
            const mismatchedPixels = compareImages(previousImage, currentImage);
            const isMatch =
                mismatchedPixels / (currentImage.width * currentImage.height) <=
                threshold;

            let promise;
            if (isMatch) {
                console.log(`Performing inference on: ${file}`);
                promise = drawBBox(result.predictions, imagePath).then(
                    (result) => {
                        const dataImage = result.img.replace(
                            /^data:image\/png;base64,/,
                            "",
                        );
                        fs.writeFileSync(savedPath, dataImage, "base64");
                    },
                );
            } else {
                console.log(
                    `No similarity, choosing: ${file} as the new reference`,
                );
                promise = execImage(imagePath, model).then((result) => {
                    const dataImage = result.img.replace(
                        /^data:image\/png;base64,/,
                        "",
                    );
                    fs.writeFileSync(savedPath, dataImage, "base64");
                });
            }
            promises.push(promise);
        } else {
            console.log(`Setting ${file} as the reference frame`);
            result = await execImage(imagePath, model);
            const dataImage = result.img.replace(
                /^data:image\/png;base64,/,
                "",
            );
            fs.writeFileSync(savedPath, dataImage, "base64");
        }

        previousImage = currentImage;

        if (promises.length >= concurrencyLimit) {
            await Promise.all(promises);
            promises.length = 0;
        }
    }

    await Promise.all(promises);
};

const readImage = (path) => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(path)
            .pipe(new PNG())
            .on("parsed", function () {
                resolve(this);
            })
            .on("error", function (error) {
                reject(error);
            });
    });
};

const compareImages = (img1, img2) => {
    const diff = new PNG({ width: img1.width, height: img1.height });
    const mismatchedPixels = pixelmatch(
        img1.data,
        img2.data,
        diff.data,
        img1.width,
        img1.height,
        { threshold: 0.1 },
    );
    return mismatchedPixels;
};

module.exports = compareFramesAndInfer;
