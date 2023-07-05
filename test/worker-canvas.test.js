const { Worker } = require('worker_threads');

const worker = new Worker(`
  const { createCanvas } = require('canvas');
  const { parentPort } = require('worker_threads');
  const canvas = createCanvas(200, 200);
  const context = canvas.getContext('2d');
  context.fillStyle = 'red';
  context.fillRect(0, 0, 200, 200);
  const buffer = canvas.toBuffer('image/png');
  parentPort.postMessage(buffer);
`, { eval: true });

worker.on('message', (buffer) => {
  console.log('Native dependencies are correctly installed and accessible.');
  console.log('The canvas module is working in the worker thread.');
});

worker.on('error', (error) => {
  console.error('Error:', error);
});

worker.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Worker stopped with exit code ${code}`);
  }
});
