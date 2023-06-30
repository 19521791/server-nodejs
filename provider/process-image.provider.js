const workerpool = require('workerpool');
const path = require('path');

const workerPath = path.join(__dirname, 'worker.provider.js');
const pool = workerpool.pool(workerPath, { maxWorkers: 2 });

const processImage = async (imagePaths) => {
  console.log('Exec outside')
  const results = await Promise.all(
    imagePaths.map(async (imagePath) => {
      console.log('Exec inside');
      await pool.exec('processImageWorker', [imagePath]);
    })
  );

  return results;
};

module.exports = processImage;


