const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
        console.log("File name: ", file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
}).single("image_uploaded");

module.exports = upload;