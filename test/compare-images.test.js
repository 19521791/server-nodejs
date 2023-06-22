const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const imageDir = '/home/long1100/temp/test/mock-data';
const threshold = 0.1;

const compareFramesAndInfer = async (imageDir, threshold, imageFiles) => {
  let previousImage = null;

  for (const file of imageFiles) {
    const imagePath = `${imageDir}/${file}`;
    const currentImage = await readImage(imagePath);

    if (previousImage) {
      const mismatchedPixels = compareImages(previousImage, currentImage);
      if (mismatchedPixels / (currentImage.width * currentImage.height) <= threshold) {
        console.log('Performing inference on:', file);
        // Perform your inference logic here using the current frame
      } else {
        console.log('No similarity, choosing:', file, 'as the new reference');
      }
    } else {
      console.log('Setting', file, 'as the reference frame');
    }

    previousImage = currentImage;
  }
};

const readImage = (path) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this);
      })
      .on('error', function (error) {
        reject(error);
      });
  });
};

const compareImages = (img1, img2) => {
  const diff = new PNG({ width: img1.width, height: img1.height });
  const mismatchedPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, { threshold: 0.1 });
  return mismatchedPixels;
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Divide image files among worker processes
  const imageFiles = fs.readdirSync(imageDir);
  const chunkSize = Math.ceil(imageFiles.length / numCPUs);
  let startIndex = 0;

  for (let i = 0; i < numCPUs; i++) {
    const endIndex = Math.min(startIndex + chunkSize, imageFiles.length);
    const workerImageFiles = imageFiles.slice(startIndex, endIndex);

    const worker = cluster.fork();
    worker.send(workerImageFiles);

    startIndex = endIndex;
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  console.log(`Worker ${process.pid} started`);

  process.on('message', async (message) => {
    const workerImageFiles = message;
    await compareFramesAndInfer(imageDir, threshold, workerImageFiles);

    console.log(`Worker ${process.pid} finished`);
    process.exit();
  });
}
