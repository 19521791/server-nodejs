const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

const generateVideoFromFrames = async (fps, frameDir, outputPath) => {
  const ffmpegCommand = `ffmpeg -framerate ${fps} -i ${frameDir}/frame-%d.png -c:v libx264 -crf 23 -pix_fmt yuv420p ${outputPath}`;

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Error generating video:', error);
      return;
    }
    console.log('Video generation completed!');
  });
};

module.exports = generateVideoFromFrames;