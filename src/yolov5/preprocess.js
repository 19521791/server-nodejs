const sharp = require("sharp");
const tf = require("@tensorflow/tfjs-node");

const preprocess = async (source, modelWidth, modelHeight) => {
    let xRatio, yRatio; // ratios for boxes
  
    const imgBuffer = await source.toBuffer(); // convert source to buffer
    const sharpImg = await sharp(imgBuffer).ensureAlpha().resize({
      width: modelWidth,
      height: modelHeight,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }).toBuffer(); // resize and crop image using sharp
  
    const input = tf.tidy(() => {
      const img = tf.node.decodeImage(sharpImg, 3); // decode image
      const [h, w] = img.shape.slice(0, 2); // get source width and height
      const maxSize = Math.max(w, h); // get max size
      const padW = (maxSize - w) / 2;
      const padH = (maxSize - h) / 2;
      const padding = [[Math.floor(padH), Math.ceil(padH)], [Math.floor(padW), Math.ceil(padW)], [0, 0]]; // compute padding for each dimension
  
      xRatio = maxSize / w; // update xRatio
      yRatio = maxSize / h; // update yRatio
  
      return tf.pad(img, padding)
        .resizeBilinear([modelWidth, modelHeight]) // resize frame
        .toFloat() // convert to float32
        .div(255.0) // normalize
        .expandDims(0); // add batch
    });
  
    return [input, xRatio, yRatio];
  };
  
  

  module.exports = preprocess;