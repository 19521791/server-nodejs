const sharp = require('sharp')
const path = require('path');

const compressImage = async (imagePath, compPath, quality) => {
  await sharp(imagePath)
  .jpeg({ quality: quality })
  .toFile(path.join(compPath, path.basename(imagePath)));
};

module.exports = compressImage;
