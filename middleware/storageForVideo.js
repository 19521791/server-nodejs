const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploadVideos");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    let errorMessage = '';
    if(!file || file.mimetype !== 'video/mp4'){
        errorMessage = 'Wrong file type \"' + file.originalname.split('.').pop() + '\" found. Only mp4 video files are allowed!';
    }
    if(errorMessage){
        return cb({errorMessage: errorMessage, code: 'LIMIT_FILE_TYPE'}, false);
    }
    cb(null, true);
}

const upload = multer({
    fileFilter: fileFilter,
    storage: storage,
    limits: { fileSize:  104857600}, // 200mb
}).single("video_uploaded");

module.exports = upload;