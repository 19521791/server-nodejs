const sharp = require("sharp");
const path = require("path");

const compressImage = async (imgPath, outputPath) => {
  const compressedPath = path.join(outputPath);

  await sharp(imgPath)
    .resize(512, 512)
    .jpeg({ quality: 10 })
    .toFile(path.join(compressedPath, path.basename(imgPath)));
};

const imagePath = path.join(__dirname, '..', 'uploads', 'test3.jpeg')
const outputPath = path.join(__dirname, '..', 'test', 'mock-data');

compressImage(imagePath, outputPath)
  .then(() => {
    console.log("Image compressed and saved successfully");
  })
  .catch((error) => {
    console.error("Error compressing and saving image:", error);
  });
