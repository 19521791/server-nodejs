const fs = require("fs");

const uploadImage = async (req, res) => {
  const filename = req.file.filename;
  const imageUrl = '/image/' + filename;
  console.log(`"==image url==: " ${imageUrl}`);
  console.log(`"Image" buffer: ${req.file.buffer}`);
  res.redirect(imageUrl);
  };
  
  module.exports = {
    uploadImage,
  };
  