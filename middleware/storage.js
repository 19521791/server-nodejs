const multer = require("multer");
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${uuidv4()}_${file.originalname}`;
        cb(null, uniqueFilename);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 3000000 },
}).array("image_uploaded");

module.exports = upload;
