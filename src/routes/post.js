const express = require('express');
const router = express.Router();
const controller = require('../app/controllers/postController');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/Images');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), controller.uploadImage);

module.exports = router;

  