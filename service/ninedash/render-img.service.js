const labels = require("./labels.json");
const fs = require("fs");
const sharp = require("sharp");
const { createCanvas, loadImage, Canvas } = require("canvas");

const renderBoxes = (
    handleImage,
    classThreshold,
    boxes_data,
    scores_data,
    classes_data,
    ratios,
) => {
    console.time('draw');
    const imageBuffer = Buffer.from(handleImage);
    return sharp(imageBuffer)
        .toBuffer()
        .then((buffer) => {
            return loadImage(buffer);
        })
        .then((image) => {
            const canvasWidth = image.width;
            const canvasHeight = image.height;
            maxSize = Math.max(canvasWidth, canvasHeight);
            const colors = new Colors();
            const font = `${Math.max(
                Math.round(Math.max(canvasWidth, canvasHeight) / 25),
                14,
            )}px Arial`;
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);
            ctx.font = font;
            ctx.textBaseline = "top";

            for (let i = 0; i < scores_data.length; ++i) {
                if (scores_data[i] > classThreshold) {
                    const klass = labels[classes_data[i]];
                    const color = colors.get(classes_data[i]);
                    const score = (scores_data[i] * 100).toFixed(1);
                    let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
                    x1 *= canvasWidth * ratios[0];
                    x2 *= canvasWidth * ratios[0];
                    y1 *= canvasHeight * ratios[1];
                    y2 *= canvasHeight * ratios[1];
                    const width = x2 - x1;
                    const height = y2 - y1;
                    ctx.fillStyle = Colors.hexToRgba(color, 0.2);
                    ctx.fillRect(x1, y1, width, height);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = Math.max(
                        Math.min(canvasWidth, canvasHeight) / 200,
                        2.5,
                    );
                    ctx.strokeRect(x1, y1, width, height);
                    ctx.fillStyle = color;
                    const textWidth = ctx.measureText(
                        klass + " - " + score + "%",
                    ).width;
                    const textHeight = parseInt(font, 10);
                    const yText = y1 - (textHeight + ctx.lineWidth);
                    ctx.fillRect(
                        x1 - 1,
                        yText < 0 ? 0 : yText,
                        textWidth + ctx.lineWidth,
                        textHeight + ctx.lineWidth,
                    );

                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(
                        klass + " - " + score + "%",
                        x1 - 1,
                        yText < 0 ? 0 : yText,
                    );
                }
            }
            console.timeEnd('draw');
            return canvas;
        })
        .catch((err) => {
            console.log('Error in render image');
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
