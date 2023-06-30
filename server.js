const app = require("./app");
const { connectToRabbitMQ } = require("./config/rabbit-mq.config");
const { loadModel } = require('./service/ninedash/load-model.service');
const tf = require('@tensorflow/tfjs-node');
const http = require('http');
const socketIO = require('socket.io');

const { PORT } = process.env;

(async function() {
    await tf.ready();
    const model = await loadModel();
    global.modeler = model;
    connectToRabbitMQ();
    const server = http.createServer(app);
    const io = socketIO(server);

    app.set('io', io);
    io.on('connection', (socket) => {
        console.log('A client connected');
        socket.on('disconnect', () => {
            console.log('A client disconnected');
        });
    });

    server.listen(PORT, () => console.log(`App are listening at ${PORT}`));
})();


