const measureClass = require('./time-measure.class');
const fs = require('fs');
const path = require('path');

const timer = new measureClass();

const post = 'http://localhost:8080/detect';
// const get = 'http://localhost:8080/nine-dash';

const currentDir = path.resolve(__dirname);
const allImagesFolderPath = path.join(currentDir, 'mock-data');

const getShuffledImages = () => {
    const allImages = fs.readdirSync(allImagesFolderPath);
    if (allImages.length === 0) {
      throw new Error('No images found in the specified folder.');
    }
    const shuffledImages = allImages.sort(() => 0.5 - Math.random());
    return shuffledImages;
}

const getRandomMockImages = () => {
    const shuffledImages = getShuffledImages();
    return shuffledImages.slice(0, 10);
}

const randomImages = getRandomMockImages();
const imageData = randomImages.map((imageName) => {
  const imagePath = path.join(allImagesFolderPath, imageName);
  return { image: fs.readFileSync(imagePath).toString('base64') };
});

timer.start('uploadImage', 'POST', post, imageData);
