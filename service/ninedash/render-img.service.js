const labels = require("./labels.json");
const gm = require('gm').subClass({ imageMagick: true });

const renderBoxes = async (
    handleImage,
    classThreshold,
    boxes_data,
    scores_data,
    classes_data,
    ratios,
  ) => {
    const imageBuffer = Buffer.from(handleImage);
    const gmImage = gm(imageBuffer);
    gmImage.setFormat('PNG');
  
    const canvasWidth = await new Promise((resolve, reject) => {
      gmImage.size((err, size) => {
        if (err) {
          reject(err);
        } else {
          resolve(size.width);
        }
      });
    });
  
    const canvasHeight = await new Promise((resolve, reject) => {
      gmImage.size((err, size) => {
        if (err) {
          reject(err);
        } else {
          resolve(size.height);
        }
      });
    });
  
    const maxSize = Math.max(canvasWidth, canvasHeight);
    const colors = new Colors();
    const textHeight = 14;
    
    for (let i = 0; i < scores_data.length; ++i) {
      if (scores_data[i] > classThreshold) {
        const klass = labels[classes_data[i]];
        const color = colors.get(classes_data[i]);
        const score = (scores_data[i] * 100).toFixed(1);
        const [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
        const scaledX1 = Math.round(x1 * canvasWidth * ratios[0]);
        const scaledX2 = Math.round(x2 * canvasWidth * ratios[0]);
        const scaledY1 = Math.round(y1 * canvasHeight * ratios[1]);
        const scaledY2 = Math.round(y2 * canvasHeight * ratios[1]);
        const textHeight = 14;
        const yText = y1 - (textHeight + 2);

        gmImage
          .fill(Colors.hexToRgba(color, 0.1))
          .stroke("#FF7D7D", 3)
          .drawRectangle(scaledX1, scaledY1, scaledX2, scaledY2)
          .drawText(scaledX1 - 1, yText < 0 ? 0 : yText, `${klass} - ${score}%`)
          .fill(color)
          .font('Aria', 14)
          
      }
    }
    return new Promise((resolve, reject) => {
      gmImage.toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          const base64Image = buffer.toString('base64');
          resolve(base64Image);
        }
      });
    });
  };

class Colors {
  constructor() {
      this.palette = [
        "#FF3838",
        "#FF9D97",
        "#FF701F",
        "#FFB21D",
        "#CFD231",
        "#48F90A",
        "#92CC17",
        "#3DDB86",
        "#1A9334",
        "#00D4BB",
        "#2C99A8",
        "#00C2FF",
        "#344593",
        "#6473FF",
        "#0018EC",
        "#8438FF",
        "#520085",
        "#CB38FF",
        "#FF95C8",
        "#FF37C7",
      ];
      this.n = this.palette.length;
  }

  get(i) {
      return this.palette[Math.floor(i) % this.n];
  }

  static hexToRgba(hex, alpha) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
          ? `rgba(${[
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16),
            ].join(", ")}, ${alpha})`
          : null;
  }
}

module.exports = renderBoxes;
