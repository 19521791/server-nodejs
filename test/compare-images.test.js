const fs = require("fs");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");
const cluster = require("cluster");
const detect = require("../service/ninedash/detect.service");
const { loadModel } = require("../service/ninedash/load-model.service");
const tf = require("@tensorflow/tfjs-node");

const threshold = 0.1;

const compareFramesAndInfer = async (imageDir, threshold, imageFiles, arr) => {
    let previousImage = null;
    let result = null;
    await tf.ready();
    const model = await loadModel();
    for (const file of imageFiles) {
        const imagePath = `${imageDir}/${file}`;
        const currentImage = await readImage(imagePath);

        if (previousImage) {
            const mismatchedPixels = compareImages(previousImage, currentImage);
            if (
                mismatchedPixels / (currentImage.width * currentImage.height) <=
                threshold
            ) {
                console.log("Performing inference on:", file);
                arr.push({ file: file, result: result });
            } else {
                console.log(
                    "No similarity, choosing:",
                    file,
                    "as the new reference",
                );
                result = await detect(imagePath, model);
                arr.push({ file: file, result: result });
                console.log(result);
            }
        } else {
            console.log("Setting", file, "as the reference frame");
            result = await detect(imagePath, model);
            arr.push({ file: file, result: result });
            console.log(result);
        }
        previousImage = currentImage;
    }
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

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    const imageFiles = fs.readdirSync(imageDir);
    const chunkSize = Math.ceil(imageFiles.length / numCPUs);
    let startIndex = 0;

    for (let i = 0; i < numCPUs; i++) {
        const endIndex = Math.min(startIndex + chunkSize, imageFiles.length);
        const workerImageFiles = imageFiles.slice(startIndex, endIndex);

        const worker = cluster.fork();
        worker.send({ workerImageFiles, arr });
        worker.on("exit", () => {
            console.log(`Worker ${worker.process.pid} exited`);
        });

        startIndex = endIndex;
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });

    cluster.on("disconnect", () => {
        resolve(arr);
    });
} else {
    console.log(`Worker ${process.pid} started`);

    process.on("message", async (message) => {
        const { workerImageFiles, arr } = message;
        try {
            await compareFramesAndInfer(
                imageDir,
                threshold,
                workerImageFiles,
                arr,
            );
            console.log(`Worker ${process.pid} finished`);
            process.send({ arr });
        } catch (error) {
            console.error(`Worker ${process.pid} error:`, error);
        } finally {
            process.exit();
        }
    });
}
