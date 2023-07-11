const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        const uniqueFilename = Date.now() + '-' + file.originalname;
        cb(null, uniqueFilename);
    },
});

const fileFilter = (req, file, cb) => {
    const isValid = file.mimetype.startsWith("image/");

    if(isValid){
        cb(null, true);
    } else {
        cb(new Error("Invalid file type"));
    }
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 3000000 },
    fileFilter: fileFilter,    
}).array("image_uploaded", 10);

module.exports = upload;
