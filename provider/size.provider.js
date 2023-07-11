const fs = require('fs');

const size = async(imgPath) => {
    const stats = fs.statSync(imgPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    return fileSizeInKB;
}

module.exports = size;