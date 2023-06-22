const { exec } = require('child_process');
const path = require('path');

const extractFrames = (videoPath, outputDir) => {
  const command = `ffmpeg -i ${videoPath} ${path.join(outputDir, 'frame-%d.png')}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error extracting frames: ${error}`);
      return;
    }
    console.log('Frames extracted successfully!');
  });
};

const videoPath = '/home/long1100/temp/uploadVideos/1687450315550_video4.mp4';
const outputDir = '/home/long1100/temp/test/mock-data';

extractFrames(videoPath, outputDir);
